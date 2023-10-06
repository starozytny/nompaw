<?php

namespace App\Controller\InternApi\Holidays;

use App\Entity\Holiday\HoProject;
use App\Entity\Holiday\HoPropalDate;
use App\Repository\Holiday\HoProjectRepository;
use App\Repository\Holiday\HoPropalDateRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataHolidays;
use App\Service\Propals\PropalService;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/intern/api/projects/propal/date', name: 'intern_api_projects_propals_date_')]
class PropalDateController extends AbstractController
{
    public function submitForm($type, HoPropalDateRepository $repository, HoPropalDate $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataHolidays $dataEntity, HoProject $project): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataPropalDate($obj, $data);

        if($existe = $repository->findOneBy(['project' => $project, 'startAt' => $obj->getStartAt(), 'endAt' => $obj->getEndAt()])){
            if($type == "create" || ($type == "update" && $existe->getId() != $obj->getId())){
                return $apiResponse->apiJsonResponseValidationFailed([
                    ["name" => "startAt", "message" => "Cette date existe déjà."]
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

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, HoPropalDate::LIST);
    }

    #[Route('/project/{project}/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, HoProject $project, ApiResponse $apiResponse, ValidatorService $validator,
                           DataHolidays $dataEntity, HoPropalDateRepository $repository): Response
    {
        return $this->submitForm("create", $repository, new HoPropalDate(), $request, $apiResponse, $validator, $dataEntity, $project);
    }

    #[Route('/project/{project}/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, HoProject $project, HoPropalDate $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataHolidays $dataEntity, HoPropalDateRepository $repository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $project);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(HoPropalDate $obj, HoPropalDateRepository $repository, ApiResponse $apiResponse): Response
    {
        $project = $obj->getProject();
        if($project->getPropalDate() == $obj->getId()){
            $project->setPropalDate(null);
        }

        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/vote/{id}', name: 'vote', options: ['expose' => true], methods: 'PUT')]
    public function vote(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                         HoPropalDate $obj, HoPropalDateRepository $repository, PropalService $propalService): Response
    {
        return $propalService->vote($request, $apiResponse, $validator, $obj, $repository, HoPropalDate::LIST);
    }

    #[Route('/end/{id}', name: 'end', options: ['expose' => true], methods: 'PUT')]
    public function end(HoPropalDate $obj, ApiResponse $apiResponse, ValidatorService $validator, HoProjectRepository $repository): Response
    {
        $project = $obj->getProject();
        $project->setStartAt($obj->getStartAt());
        $project->setEndAt($obj->getEndAt());
        $project->setPropalDate($obj);

        $noErrors = $validator->validate($project);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($project, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }
}
