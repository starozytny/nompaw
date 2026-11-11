<?php

namespace App\Controller\InternApi\Invest;

use App\Entity\Invest\InEnveloppe;
use App\Entity\Invest\InLine;
use App\Entity\Invest\InSnapshot;
use App\Repository\Invest\InEnveloppeRepository;
use App\Repository\Invest\InLineRepository;
use App\Repository\Invest\InSnapshotRepository;
use App\Service\Api\ApiResponse;
use App\Service\Data\DataInvest;
use App\Service\Invest\InvestSeedService;
use App\Service\Invest\InvestTrackingBuilder;
use App\Service\ValidatorService;
use DateTime;
use RuntimeException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/invest', name: 'intern_api_invest_')]
class InvestController extends AbstractController
{
    #[Route('/tracking', name: 'tracking', options: ['expose' => true], methods: 'GET')]
    public function tracking(InvestTrackingBuilder $trackingBuilder, ApiResponse $apiResponse): Response
    {
        return $apiResponse->apiJsonResponseCustom($trackingBuilder->build($this->getUser()));
    }

    /**
     * Fills an empty account with Shanbo's real starting positions (see InvestSeedService) — the
     * button shown when the Positions tab has no envelope yet, needed on prod which starts empty.
     */
    #[Route('/seed', name: 'seed', options: ['expose' => true], methods: 'POST')]
    public function seed(InvestSeedService $seedService, ApiResponse $apiResponse): Response
    {
        try {
            $seedService->seedInitialData($this->getUser());
        } catch (RuntimeException $e) {
            return $apiResponse->apiJsonResponseBadRequest($e->getMessage());
        }

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/enveloppes', name: 'enveloppe_save', options: ['expose' => true], methods: 'POST')]
    public function saveEnveloppe(Request $request, InEnveloppeRepository $enveloppeRepository, DataInvest $dataEntity,
                                  ValidatorService $validator, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null || empty($data->name) || !isset($data->type)) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $user = $this->getUser();
        $enveloppe = (!empty($data->id) ? $enveloppeRepository->find($data->id) : null) ?? (new InEnveloppe())->setUser($user);
        if ($enveloppe->getUser() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $enveloppe = $dataEntity->setDataEnveloppe($enveloppe, $data);

        $noErrors = $validator->validate($enveloppe);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $enveloppeRepository->save($enveloppe, true);
        return $apiResponse->apiJsonResponseCustom(['id' => $enveloppe->getId()]);
    }

    #[Route('/enveloppes/{id}', name: 'enveloppe_delete', options: ['expose' => true], methods: 'DELETE')]
    public function deleteEnveloppe(InEnveloppe $enveloppe, InEnveloppeRepository $enveloppeRepository, ApiResponse $apiResponse): Response
    {
        if ($enveloppe->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $enveloppeRepository->remove($enveloppe, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/lines', name: 'line_save', options: ['expose' => true], methods: 'POST')]
    public function saveLine(Request $request, InEnveloppeRepository $enveloppeRepository, InLineRepository $lineRepository,
                             DataInvest $dataEntity, ValidatorService $validator, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null || empty($data->name) || empty($data->enveloppeId)) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $user = $this->getUser();
        $line = !empty($data->id) ? $lineRepository->find($data->id) : null;
        if ($line && $line->getEnveloppe()->getUser() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        if (!$line) {
            $enveloppe = $enveloppeRepository->find($data->enveloppeId);
            if (!$enveloppe || $enveloppe->getUser() !== $user) {
                return $apiResponse->apiJsonResponseForbidden();
            }
            $line = (new InLine())->setEnveloppe($enveloppe);
        }

        $line = $dataEntity->setDataLine($line, $data);

        $noErrors = $validator->validate($line);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $lineRepository->save($line, true);
        return $apiResponse->apiJsonResponseCustom(['id' => $line->getId()]);
    }

    #[Route('/lines/{id}', name: 'line_delete', options: ['expose' => true], methods: 'DELETE')]
    public function deleteLine(InLine $line, InLineRepository $lineRepository, ApiResponse $apiResponse): Response
    {
        if ($line->getEnveloppe()->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $lineRepository->remove($line, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/snapshots', name: 'snapshot_save', options: ['expose' => true], methods: 'POST')]
    public function saveSnapshot(Request $request, InLineRepository $lineRepository, InSnapshotRepository $snapshotRepository,
                                 DataInvest $dataEntity, ValidatorService $validator, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null || empty($data->lineId) || empty($data->date) || !isset($data->value)) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $line = $lineRepository->find($data->lineId);
        if (!$line || $line->getEnveloppe()->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $date = DateTime::createFromFormat('Y-m-d', $data->date);
        $snapshot = $snapshotRepository->findOneByLineAndDate($line, $date) ?? (new InSnapshot())->setLine($line);
        $snapshot = $dataEntity->setDataSnapshot($snapshot, $data);

        $noErrors = $validator->validate($snapshot);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $snapshotRepository->save($snapshot, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/snapshots/{id}', name: 'snapshot_delete', options: ['expose' => true], methods: 'DELETE')]
    public function deleteSnapshot(InSnapshot $snapshot, InSnapshotRepository $snapshotRepository, ApiResponse $apiResponse): Response
    {
        if ($snapshot->getLine()->getEnveloppe()->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $snapshotRepository->remove($snapshot, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

}
