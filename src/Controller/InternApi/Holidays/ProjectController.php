<?php

namespace App\Controller\InternApi\Holidays;

use App\Entity\Holiday\HoProject;
use App\Repository\Holiday\HoLifestyleRepository;
use App\Repository\Holiday\HoProjectRepository;
use App\Repository\Holiday\HoPropalActivityRepository;
use App\Repository\Holiday\HoPropalHouseRepository;
use App\Repository\Holiday\HoTodoRepository;
use App\Service\Api\ApiResponse;
use App\Service\Data\DataHolidays;
use App\Service\FileUploader;
use App\Service\SanitizeData;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/projects', name: 'intern_api_projects_')]
class ProjectController extends AbstractController
{
    public function submitForm($type, HoProjectRepository $repository, HoProject $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataHolidays $dataEntity, FileUploader $fileUploader): JsonResponse
    {
        $data = json_decode($request->get('data'));
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataProject($obj, $data);

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
            $obj->setCode(uniqid());
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $file = $request->files->get('image');
        if ($file) {
            $fileName = $fileUploader->replaceFile($file, HoProject::FOLDER, $obj->getImage());
            $obj->setImage($fileName);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, HoProject::FORM);
    }

    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataHolidays $dataEntity, HoProjectRepository $repository, FileUploader $fileUploader): Response
    {
        return $this->submitForm("create", $repository, new HoProject(), $request, $apiResponse, $validator, $dataEntity, $fileUploader);
    }

    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'POST')]
    public function update(Request $request, HoProject $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataHolidays $dataEntity, HoProjectRepository $repository, FileUploader $fileUploader): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $fileUploader);
    }

    #[Route('/texte/update/{type}/{id}', name: 'update_text', options: ['expose' => true], methods: 'PUT')]
    public function updateTexte(Request $request, $type, HoProject $obj, ApiResponse $apiResponse, HoProjectRepository $repository,
                                ValidatorService $validator, SanitizeData $sanitizeData): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj->setTextRoute($sanitizeData->trimData($data->texte->html));
        $obj->setIframeRoute($sanitizeData->trimData($data->iframe));
        $obj->setPriceRoute($sanitizeData->setFloatValue($data->price));

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, HoProject::TEXTE);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(HoProject $obj, HoProjectRepository $repository, ApiResponse $apiResponse,
                           FileUploader $fileUploader,
                           HoPropalHouseRepository $houseRepository,
                           HoPropalActivityRepository $activityRepository,
                           HoTodoRepository $todoRepository,
                           HoLifestyleRepository $lifestyleRepository): Response
    {
        $image = $obj->getImage();
        $obj->setPropalHouse(null);

        $repository->save($obj, true);

        foreach($houseRepository->findBy(['project' => $obj]) as $item){
            $houseRepository->remove($item);
        }
        foreach($activityRepository->findBy(['project' => $obj]) as $item){
            $activityRepository->remove($item);
        }
        foreach($todoRepository->findBy(['project' => $obj]) as $item){
            $todoRepository->remove($item);
        }
        foreach($lifestyleRepository->findBy(['project' => $obj]) as $item){
            $lifestyleRepository->remove($item);
        }

        $repository->remove($obj, true);

        $fileUploader->deleteFile($image, HoProject::FOLDER);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }
}
