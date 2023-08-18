<?php

namespace App\Controller\Api\Holidays;

use App\Entity\Holiday\HoLifestyle;
use App\Entity\Holiday\HoProject;
use App\Repository\Holiday\HoLifestyleRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataHolidays;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/projects/lifestyle', name: 'api_projects_lifestyle_')]
class LifestyleController extends AbstractController
{
    public function submitForm($type, HoLifestyleRepository $repository, HoLifestyle $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataHolidays $dataEntity, HoProject $project): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataLifestyle($obj, $data);

        if($existe = $repository->findOneBy(['project' => $project, 'name' => $obj->getName()])){
            if($type == "create" || ($type == "update" && $existe->getId() != $obj->getId())){
                return $apiResponse->apiJsonResponseValidationFailed([
                    ["name" => "name", "message" => "Ca existe déjà."]
                ]);
            }
        }

        if($type == "create") {
            $obj = ($obj)->setProject($project);
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, HoLifestyle::LIST);
    }

    #[Route('/project/{project}/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, HoProject $project, ApiResponse $apiResponse, ValidatorService $validator,
                           DataHolidays $dataEntity, HoLifestyleRepository $repository): Response
    {
        return $this->submitForm("create", $repository, new HoLifestyle(), $request, $apiResponse, $validator, $dataEntity, $project);
    }

    #[Route('/project/{project}/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, HoProject $project, HoLifestyle $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataHolidays $dataEntity, HoLifestyleRepository $repository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $project);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(HoLifestyle $obj, HoLifestyleRepository $repository, ApiResponse $apiResponse): Response
    {
        $repository->remove($obj, true);
        return $apiResponse->apiJsonResponseSuccessful("ok");
    }
}
