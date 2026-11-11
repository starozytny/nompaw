<?php

namespace App\Controller\InternApi\Rando;

use App\Entity\Rando\RaSuggestion;
use App\Repository\Rando\RaSuggestionRepository;
use App\Service\Api\ApiResponse;
use App\Service\Data\DataRandos;
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

    #[Route('/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(RaSuggestion $suggestion, RaSuggestionRepository $suggestionRepository, ApiResponse $apiResponse): Response
    {
        if ($suggestion->getAuthor() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
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
            'createdAt' => $s->getCreatedAt()?->format('Y-m-d\TH:i:s'),
        ];
    }
}
