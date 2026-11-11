<?php

namespace App\Controller\InternApi\Running;

use App\Entity\Main\User;
use App\Entity\Running\RuActivity;
use App\Entity\Running\RuLog;
use App\Entity\Running\RuWeight;
use App\Repository\Running\RuActivityRepository;
use App\Repository\Running\RuLogRepository;
use App\Repository\Running\RuWeightRepository;
use App\Service\Api\ApiResponse;
use App\Service\Data\DataRunning;
use App\Service\Garmin\GarminApiClient;
use App\Service\Garmin\GarminApiException;
use App\Service\Garmin\GarminActivityMapper;
use App\Service\Running\RunningImportService;
use App\Service\Running\RunningTrackingBuilder;
use App\Service\SanitizeData;
use App\Service\ValidatorService;
use DateTime;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/running', name: 'intern_api_running_')]
class RunningController extends AbstractController
{
    #[Route('/tracking', name: 'tracking', options: ['expose' => true], methods: 'GET')]
    public function tracking(RunningTrackingBuilder $trackingBuilder, ApiResponse $apiResponse): Response
    {
        return $apiResponse->apiJsonResponseCustom($trackingBuilder->build($this->getUser()));
    }

    #[Route('/log', name: 'log_save', options: ['expose' => true], methods: 'POST')]
    public function saveLog(Request $request, RuLogRepository $logRepository, DataRunning $dataEntity,
                            ValidatorService $validator, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null || empty($data->date)) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $user = $this->getUser();
        $date = DateTime::createFromFormat('Y-m-d', $data->date);
        $log = $logRepository->findOneByUserAndDate($user, $date) ?? (new RuLog())->setUser($user);
        $log = $dataEntity->setDataLog($log, $data);

        $noErrors = $validator->validate($log);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        if ($log->isEmpty()) {
            if ($log->getId()) {
                $logRepository->remove($log, true);
            }
        } else {
            $logRepository->save($log, true);
        }

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/import', name: 'import', options: ['expose' => true], methods: 'POST')]
    public function import(Request $request, RunningImportService $importService, RunningTrackingBuilder $trackingBuilder,
                           ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null || empty($data->runs) || !is_array($data->runs)) {
            return $apiResponse->apiJsonResponseBadRequest('Aucune course à importer.');
        }

        $user = $this->getUser();
        $runs = array_map(fn ($r) => (array) $r, $data->runs);
        $result = $importService->import($user, $runs, $data->rangeStart ?? null, $data->rangeEnd ?? null);
        $result['tracking'] = $trackingBuilder->build($user);

        return $apiResponse->apiJsonResponseCustom($result);
    }

    /**
     * Pulls the last 14 days of activities and weights from Garmin's Personal API and merges them the same
     * way a CSV import would (RunningImportService::import()), plus the equivalent for weights — a manual
     * entry always wins over a Garmin one for the same day.
     */
    #[Route('/garmin-sync', name: 'garmin_sync', options: ['expose' => true], methods: 'POST')]
    public function garminSync(GarminApiClient $garminClient, GarminActivityMapper $mapper, RunningImportService $importService,
                               RunningTrackingBuilder $trackingBuilder, ApiResponse $apiResponse): Response
    {
        $user = $this->getUser();
        $from = (new DateTime('-14 days'))->format('Y-m-d');
        $until = (new DateTime())->format('Y-m-d');

        try {
            $runs = $mapper->mapToRuns($garminClient->fetchActivitySummaries($from, $until));
            $weights = $mapper->mapToWeights($garminClient->fetchWeights($from, $until));
        } catch (GarminApiException $e) {
            return $apiResponse->apiJsonResponseBadRequest($e->getMessage());
        }

        $result = [
            'activities' => $importService->import($user, $runs, null, null),
            'weights' => $importService->importWeights($user, $weights),
            'tracking' => $trackingBuilder->build($user),
        ];

        return $apiResponse->apiJsonResponseCustom($result);
    }

    #[Route('/weights', name: 'weights_save', options: ['expose' => true], methods: 'POST')]
    public function saveWeight(Request $request, RuWeightRepository $weightRepository, DataRunning $dataEntity,
                               ValidatorService $validator, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null || empty($data->date) || !isset($data->kg)) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $user = $this->getUser();
        $date = DateTime::createFromFormat('Y-m-d', $data->date);
        $weight = $weightRepository->findOneByUserAndDate($user, $date) ?? (new RuWeight())->setUser($user);
        $weight = $dataEntity->setDataWeight($weight, $data);

        $noErrors = $validator->validate($weight);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $weightRepository->save($weight, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/weights/{id}', name: 'weights_delete', options: ['expose' => true], methods: 'DELETE')]
    public function deleteWeight(RuWeight $weight, RuWeightRepository $weightRepository, ApiResponse $apiResponse): Response
    {
        if ($weight->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $weightRepository->remove($weight, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/notes', name: 'notes_save', options: ['expose' => true], methods: 'PUT')]
    public function saveNotes(Request $request, SanitizeData $sanitizeData, ManagerRegistry $doctrine, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());

        /** @var User $user */
        $user = $this->getUser();
        $user->setRunningNotes($sanitizeData->trimData($data->notes ?? null));
        $doctrine->getManager()->flush();

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    /**
     * Full overwrite from an uploaded backup file, same semantics as the original's importBackup(): replaces
     * every log/activity/weight/note for this user rather than merging.
     */
    #[Route('/backup/restore', name: 'backup_restore', options: ['expose' => true], methods: 'POST')]
    public function restoreBackup(Request $request, RuLogRepository $logRepository, RuActivityRepository $activityRepository,
                                  RuWeightRepository $weightRepository, RunningTrackingBuilder $trackingBuilder,
                                  SanitizeData $sanitizeData, ManagerRegistry $doctrine, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null || !isset($data->log) || !is_array($data->activities ?? null) || !is_array($data->weights ?? null)) {
            return $apiResponse->apiJsonResponseBadRequest('Fichier de sauvegarde invalide.');
        }

        /** @var User $user */
        $user = $this->getUser();
        $logRepository->removeAllByUser($user);
        $activityRepository->removeAllByUser($user);
        $weightRepository->removeAllByUser($user);

        foreach ((array) $data->log as $iso => $entry) {
            $entry = (array) $entry;
            $log = (new RuLog())->setUser($user)->setDate(DateTime::createFromFormat('Y-m-d', $iso))
                ->setKm($entry['km'] ?? null)
                ->setDurationSec(isset($entry['dur']) ? $this->parseDurToSec((string) $entry['dur']) : null)
                ->setHr($entry['hr'] ?? null)
                ->setHrMax($entry['hrmax'] ?? null)
                ->setRpe($entry['rpe'] ?? null)
                ->setNote($entry['note'] ?? null)
                ->setDone(!empty($entry['done']))
                ->setSource($entry['src'] ?? null)
                ->setTitle($entry['title'] ?? null)
            ;
            if (!$log->isEmpty()) {
                $logRepository->save($log);
            }
        }

        foreach ($data->activities as $run) {
            $run = (array) $run;
            $activityRepository->save((new RuActivity())->setUser($user)
                ->setDate(DateTime::createFromFormat('Y-m-d', $run['d']))
                ->setKm($run['km'])
                ->setDurationSec($run['sec'])
                ->setHr($run['hr'] ?? null)
                ->setHrMax($run['hrmax'] ?? null)
                ->setTitle($run['title'] ?? null)
            );
        }

        foreach ($data->weights as $w) {
            $w = (array) $w;
            $weightRepository->save((new RuWeight())->setUser($user)
                ->setDate(DateTime::createFromFormat('Y-m-d', $w['d']))
                ->setKg($w['kg'])
            );
        }

        $user->setRunningNotes($sanitizeData->trimData($data->notes ?? null));
        $doctrine->getManager()->flush();

        return $apiResponse->apiJsonResponseCustom($trackingBuilder->build($user));
    }

    #[Route('/reset', name: 'reset', options: ['expose' => true], methods: 'DELETE')]
    public function reset(RuLogRepository $logRepository, RuActivityRepository $activityRepository,
                          RuWeightRepository $weightRepository, ManagerRegistry $doctrine, ApiResponse $apiResponse): Response
    {
        /** @var User $user */
        $user = $this->getUser();
        $logRepository->removeAllByUser($user);
        $activityRepository->removeAllByUser($user);
        $weightRepository->removeAllByUser($user);
        $user->setRunningNotes(null);
        $doctrine->getManager()->flush();

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    private function parseDurToSec(string $dur): ?int
    {
        $parts = array_map('intval', explode(':', $dur));
        if (count($parts) === 3) {
            return $parts[0] * 3600 + $parts[1] * 60 + $parts[2];
        }
        if (count($parts) === 2) {
            return $parts[0] * 60 + $parts[1];
        }
        return null;
    }
}
