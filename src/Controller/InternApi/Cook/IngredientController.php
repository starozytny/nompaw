<?php

namespace App\Controller\InternApi\Cook;

use App\Entity\Cook\CoIngredient;
use App\Repository\Cook\CoIngredientRepository;
use App\Repository\Cook\CoRecipeRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataCook;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cook/ingredients', name: 'intern_api_cook_ingredients_')]
class IngredientController extends AbstractController
{
    public function submitForm($type, CoIngredientRepository $repository, CoIngredient $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataCook $dataEntity, CoRecipeRepository $recipeRepository): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $recipe = $recipeRepository->find($data->recipeId);
        if(!$recipe){
            return $apiResponse->apiJsonResponseBadRequest('Erreur, la recette n\'existe pas.');
        }

        $obj = $dataEntity->setDataIngredient($obj, $data);
        $obj = ($obj)
            ->setRecipe($recipe)
        ;

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, CoIngredient::FORM);
    }

    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataCook $dataEntity, CoIngredientRepository $repository, CoRecipeRepository $recipeRepository): Response
    {
        return $this->submitForm("create", $repository, new CoIngredient(), $request, $apiResponse, $validator, $dataEntity,  $recipeRepository);
    }

    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, CoIngredient $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataCook $dataEntity, CoIngredientRepository $repository, CoRecipeRepository $recipeRepository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $recipeRepository);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(CoIngredient $obj, CoIngredientRepository $repository, ApiResponse $apiResponse): Response
    {
        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }
}
