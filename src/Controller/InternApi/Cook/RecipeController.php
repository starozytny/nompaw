<?php

namespace App\Controller\InternApi\Cook;

use App\Entity\Cook\CoRecipe;
use App\Repository\Cook\CoRecipeRepository;
use App\Repository\Cook\CoStepRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataCook;
use App\Service\FileUploader;
use App\Service\SanitizeData;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cook/recipes', name: 'intern_api_cook_recipes_')]
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
        $obj = ($obj)
            ->setStatus((int) $data->status)
        ;

        $slug = $obj->getSlug();
        $i = 0; $free = false;
        do{
            $i++;
            if($existe = $repository->findOneBy(['slug' => $slug])){
                if($type == "create" || ($type == "update" && $existe->getId() != $obj->getId())){
                    $slug = $obj->getSlug() . '-' . $i;
                }else{
                    $free = true;
                }
            }else{
                $free = true;
            }
        }while(!$free);

        $obj->setSlug($slug);

        if($type == "create") {
            $obj->setAuthor($this->getUser());
        }else{
            $obj->setUpdatedAt(new \DateTime());
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $file = $request->files->get('image');
        if ($file) {
            $fileName = $fileUploader->replaceFile($file, CoRecipe::FOLDER_ILLU, $obj->getImage());
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

    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'POST')]
    public function update(Request $request, CoRecipe $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataCook $dataEntity, CoRecipeRepository $repository, FileUploader $fileUploader): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $fileUploader);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(CoRecipe $obj, CoRecipeRepository $repository, CoStepRepository $stepRepository,
                           ApiResponse $apiResponse, FileUploader $fileUploader): Response
    {
        foreach($obj->getSteps() as $step){
            $stepRepository->remove($step);
        }

        $image = $obj->getImage();

        $repository->remove($obj, true);

        $fileUploader->deleteFile($image, CoRecipe::FOLDER_ILLU);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/update-data/{id}', name: 'update_data', options: ['expose' => true], methods: 'PUT')]
    public function updateData(Request $request, CoRecipe $obj, CoRecipeRepository $repository, ApiResponse $apiResponse, SanitizeData $sanitizeData): Response
    {
        $data = json_decode($request->getContent());

        $name  = $data->name;
        $value = $data->value;

        switch ($name){
            case 'nbPerson':
                $obj->setNbPerson($value ? (int) $value : null);
                break;
            case 'difficulty':
                $obj->setDifficulty((int) $value);
                break;
            case 'durationCooking':
                $obj->setDurationCooking($sanitizeData->createTime($value));
                break;
            case 'durationPrepare':
                $obj->setDurationPrepare($sanitizeData->createTime($value));
                break;
            case 'description':
                $obj->setContent($sanitizeData->trimData($value->html));
                break;
            default: break;
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, CoRecipe::READ);
    }
}
