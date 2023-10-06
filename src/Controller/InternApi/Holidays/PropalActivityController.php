<?php

namespace App\Controller\InternApi\Holidays;

use App\Entity\Holiday\HoProject;
use App\Entity\Holiday\HoPropalActivity;
use App\Repository\Holiday\HoPropalActivityRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataHolidays;
use App\Service\FileUploader;
use App\Service\Propals\PropalService;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/intern/api/projects/propal/activity', name: 'intern_api_projects_propals_activity_')]
class PropalActivityController extends AbstractController
{
    public function submitForm($type, HoPropalActivityRepository $repository, HoPropalActivity $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, FileUploader $fileUploader, DataHolidays $dataEntity, HoProject $project): JsonResponse
    {
        $data = json_decode($request->get('data'));
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataPropalActivity($obj, $data);

        if($existe = $repository->findOneBy(['project' => $project, 'name' => $obj->getName()])){
            if($type == "create" || ($type == "update" && $existe->getId() != $obj->getId())){
                return $apiResponse->apiJsonResponseValidationFailed([
                    ["name" => "name", "message" => "Cette activité existe déjà."]
                ]);
            }
        }

        if($type == "create") {
            $obj = ($obj)
                ->setProject($project)
                ->setVotes([])
                ->setAuthor($this->getUser())
            ;
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $file = $request->files->get('image');
        if ($file) {
            $fileName = $fileUploader->replaceFile($file, HoPropalActivity::FOLDER . $project->getId(), $obj->getImage(), true, 280);
            $obj->setImage($fileName);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, HoPropalActivity::LIST);
    }

    #[Route('/project/{project}/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, HoProject $project, ApiResponse $apiResponse, ValidatorService $validator,
                           FileUploader $fileUploader, DataHolidays $dataEntity, HoPropalActivityRepository $repository): Response
    {
        return $this->submitForm("create", $repository, new HoPropalActivity(), $request, $apiResponse, $validator, $fileUploader, $dataEntity, $project);
    }

    #[Route('/project/{project}/update/{id}', name: 'update', options: ['expose' => true], methods: 'POST')]
    public function update(Request $request, HoProject $project, HoPropalActivity $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           FileUploader $fileUploader, DataHolidays $dataEntity, HoPropalActivityRepository $repository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $fileUploader, $dataEntity, $project);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(HoPropalActivity $obj, HoPropalActivityRepository $repository, ApiResponse $apiResponse): Response
    {
        $repository->remove($obj, true);
        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/vote/{id}', name: 'vote', options: ['expose' => true], methods: 'PUT')]
    public function vote(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                         HoPropalActivity $obj, HoPropalActivityRepository $repository, PropalService $propalService): Response
    {
        return $propalService->vote($request, $apiResponse, $validator, $obj, $repository, HoPropalActivity::LIST);
    }

    #[Route('/end/{id}', name: 'end', options: ['expose' => true], methods: 'PUT')]
    public function end(HoPropalActivity $obj, ApiResponse $apiResponse, HoPropalActivityRepository $repository): Response
    {
        $obj->setIsSelected(true);

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/cancel/{id}', name: 'cancel', options: ['expose' => true], methods: 'PUT')]
    public function cancel(HoPropalActivity $obj, ApiResponse $apiResponse, HoPropalActivityRepository $repository): Response
    {
        $obj->setIsSelected(false);

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }
}
