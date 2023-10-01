<?php

namespace App\Controller\Api\Cook;

use App\Entity\Cook\CoCommentary;
use App\Entity\Cook\CoRecipe;
use App\Entity\Cook\CoStep;
use App\Repository\Cook\CoCommentaryRepository;
use App\Repository\Cook\CoRecipeRepository;
use App\Service\ApiResponse;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/cook/commentaries', name: 'api_cook_commentaries_')]
class CommentaryController extends AbstractController
{
    public function submitForm(CoCommentaryRepository $repository, CoRecipe $recipe, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $commentary = (new CoCommentary())
            ->setRecipe($recipe)
            ->setUser($this->getUser())
            ->setMessage($data->message->html)
            ->setRate((int) $data->rate)
        ;

        $noErrors = $validator->validate($commentary);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($commentary, true);
        return $apiResponse->apiJsonResponse($commentary, CoCommentary::READ);
    }

    #[Route('/recipe/{recipe}/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, CoRecipe $recipe, ApiResponse $apiResponse, ValidatorService $validator,
                           CoCommentaryRepository $repository): Response
    {
        return $this->submitForm($repository, $recipe, $request, $apiResponse, $validator);
    }
}
