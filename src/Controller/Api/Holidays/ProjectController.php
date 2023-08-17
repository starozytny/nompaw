<?php

namespace App\Controller\Api\Holidays;

use App\Entity\Holiday\HoProject;
use App\Repository\Holiday\HoProjectRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataHolidays;
use App\Service\FileUploader;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/projects', name: 'api_projects_')]
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

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(HoProject $obj, HoProjectRepository $repository, ApiResponse $apiResponse, FileUploader $fileUploader): Response
    {
        $image = $obj->getImage();

        $repository->remove($obj, true);

        $fileUploader->deleteFile($image, HoProject::FOLDER);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }
}
