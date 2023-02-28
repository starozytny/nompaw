<?php

namespace App\Controller\Api\Cook;

use App\Entity\Cook\CoRecipe;
use App\Repository\Cook\CoRecipeRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataCook;
use App\Service\FileUploader;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/recipes', name: 'api_recipes_')]
class RecipeController extends AbstractController
{
    #[Route('/list', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function list(CoRecipeRepository $repository, ApiResponse $apiResponse): Response
    {
        return $apiResponse->apiJsonResponse($repository->findAll(), CoRecipe::LIST);
    }

    public function submitForm($type, CoRecipeRepository $repository, CoRecipe $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataCook $dataEntity, FileUploader $fileUploader): JsonResponse
    {
        $data = json_decode($request->get('data'));
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataRecipe($obj, $data);

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $file = $request->files->get('image');
        if ($file) {
            $fileName = $fileUploader->replaceFile($file, CoRecipe::FOLDER, $obj->getImage());
            $obj->setImage($fileName);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, CoRecipe::LIST);
    }

    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataCook $dataEntity, CoRecipeRepository $repository, FileUploader $fileUploader): Response
    {
        return $this->submitForm("create", $repository, new CoRecipe(), $request, $apiResponse, $validator, $dataEntity, $fileUploader);
    }

    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, CoRecipe $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataCook $dataEntity, CoRecipeRepository $repository, FileUploader $fileUploader): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $fileUploader);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(CoRecipe $obj, CoRecipeRepository $repository, ApiResponse $apiResponse): Response
    {
        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }
}
