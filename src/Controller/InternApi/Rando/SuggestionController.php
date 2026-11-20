<?php

namespace App\Controller\InternApi\Rando;

use App\Entity\Rando\RaSuggestion;
use App\Entity\Rando\RaSuggestionTrace;
use App\Repository\Rando\RaSuggestionRepository;
use App\Repository\Rando\RaSuggestionTraceRepository;
use App\Service\Api\ApiResponse;
use App\Service\Data\DataRandos;
use App\Service\FileUploader;
use App\Service\Rando\GpxService;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/rando/suggestions', name: 'intern_api_rando_suggestions_')]
class SuggestionController extends AbstractController
{
    #[Route('', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function list(RaSuggestionRepository $suggestionRepository, ApiResponse $apiResponse): Response
    {
        $suggestions = array_map(
            fn (RaSuggestion $s) => $this->toArray($s),
            $suggestionRepository->findAllByUser($this->getUser())
        );

        return $apiResponse->apiJsonResponseCustom($suggestions);
    }

    #[Route('', name: 'save', options: ['expose' => true], methods: 'POST')]
    public function save(Request $request, RaSuggestionRepository $suggestionRepository, DataRandos $dataEntity,
                         ValidatorService $validator, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null || empty($data->name) || !isset($data->type) || !isset($data->difficulty)) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $user = $this->getUser();
        $suggestion = (!empty($data->id) ? $suggestionRepository->find($data->id) : null) ?? (new RaSuggestion())->setAuthor($user);
        if ($suggestion->getAuthor() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $suggestion = $dataEntity->setDataSuggestion($suggestion, $data);

        $noErrors = $validator->validate($suggestion);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $suggestionRepository->save($suggestion, true);
        return $apiResponse->apiJsonResponseCustom($this->toArray($suggestion));
    }

    /**
     * Uploads one photo for a suggestion (hand-added, not an AI-provided URL) and returns its
     * public path, to be appended to the suggestion's photoUrls on save — same field, same shape
     * as an AI-proposed URL, so the frontend/backend don't need to know which is which.
     */
    #[Route('/photos', name: 'upload_photo', options: ['expose' => true], methods: 'POST')]
    public function uploadPhoto(Request $request, FileUploader $fileUploader, ApiResponse $apiResponse): Response
    {
        $file = $request->files->get('photo');
        if (!$file) {
            return $apiResponse->apiJsonResponseBadRequest('Aucune photo envoyée.');
        }

        $fileName = $fileUploader->upload($file, RaSuggestion::FOLDER_PHOTOS);
        if (!$fileName) {
            return $apiResponse->apiJsonResponseBadRequest("L'envoi de la photo a échoué.");
        }

        return $apiResponse->apiJsonResponseCustom(['url' => '/' . RaSuggestion::FOLDER_PHOTOS . '/' . $fileName]);
    }

    /**
     * Imports a GPX file as an additional route for the suggestion (a suggestion can hold several).
     */
    #[Route('/{id}/traces', name: 'trace_add', options: ['expose' => true], requirements: ['id' => '\d+'], methods: 'POST')]
    public function addTrace(RaSuggestion $suggestion, Request $request, GpxService $gpxService, ApiResponse $apiResponse): Response
    {
        if ($suggestion->getAuthor() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $file = $request->files->get('gpx');
        if (!$file) {
            return $apiResponse->apiJsonResponseBadRequest('Aucun fichier GPX envoyé.');
        }

        try {
            $name = trim((string) $request->request->get('name')) ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $trace = $gpxService->addTrace($suggestion, $name, (string) file_get_contents($file->getPathname()), RaSuggestionTrace::SOURCE_USER);
        } catch (\InvalidArgumentException $e) {
            return $apiResponse->apiJsonResponseBadRequest($e->getMessage());
        }

        return $apiResponse->apiJsonResponseCustom($this->traceToArray($trace));
    }

    #[Route('/traces/{id}', name: 'trace_delete', options: ['expose' => true], methods: 'DELETE')]
    public function deleteTrace(RaSuggestionTrace $trace, RaSuggestionTraceRepository $traceRepository, GpxService $gpxService, ApiResponse $apiResponse): Response
    {
        if ($trace->getSuggestion()?->getAuthor() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $gpxService->deleteFile($trace);
        $traceRepository->remove($trace, true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(RaSuggestion $suggestion, RaSuggestionRepository $suggestionRepository, GpxService $gpxService, ApiResponse $apiResponse): Response
    {
        if ($suggestion->getAuthor() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        foreach ($suggestion->getTraces() as $trace) {
            $gpxService->deleteFile($trace);
        }

        $suggestionRepository->remove($suggestion, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    private function toArray(RaSuggestion $s): array
    {
        return [
            'id' => $s->getId(),
            'name' => $s->getName(),
            'type' => $s->getType()?->value,
            'typeString' => $s->getTypeString(),
            'difficulty' => $s->getDifficulty()?->value,
            'difficultyString' => $s->getDifficultyString(),
            'description' => $s->getDescription(),
            'location' => $s->getLocation(),
            'latitude' => $s->getLatitude(),
            'longitude' => $s->getLongitude(),
            'distanceKm' => $s->getDistanceKm(),
            'elevationGainM' => $s->getElevationGainM(),
            'altitudeMaxM' => $s->getAltitudeMaxM(),
            'durationMinutes' => $s->getDurationMinutes(),
            'pointsOfInterest' => $s->getPointsOfInterest(),
            'photoUrls' => $s->getPhotoUrls(),
            'sourceUrl' => $s->getSourceUrl(),
            'parkRules' => $s->getParkRules(),
            'travelTimeFromPeyrollesMinutes' => $s->getTravelTimeFromPeyrollesMinutes(),
            'travelBudget' => $s->getTravelBudget(),
            'randoBudget' => $s->getRandoBudget(),
            'traces' => $s->getTraces()->map(fn (RaSuggestionTrace $t) => $this->traceToArray($t))->getValues(),
            'createdAt' => $s->getCreatedAt()?->format('Y-m-d\TH:i:s'),
        ];
    }

    private function traceToArray(RaSuggestionTrace $t): array
    {
        return [
            'id' => $t->getId(),
            'name' => $t->getName(),
            'url' => '/' . RaSuggestionTrace::FOLDER . '/' . $t->getFileName(),
            'distanceKm' => $t->getDistanceKm(),
            'elevationGainM' => $t->getElevationGainM(),
            'altitudeMaxM' => $t->getAltitudeMaxM(),
            'source' => $t->getSource(),
        ];
    }
}
