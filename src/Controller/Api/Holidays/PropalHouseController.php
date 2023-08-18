<?php

namespace App\Controller\Api\Holidays;

use App\Entity\Holiday\HoProject;
use App\Entity\Holiday\HoPropalHouse;
use App\Repository\Holiday\HoProjectRepository;
use App\Repository\Holiday\HoPropalHouseRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataHolidays;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/projects/propal/house', name: 'api_projects_propals_house_')]
class PropalHouseController extends AbstractController
{
    public function submitForm($type, HoPropalHouseRepository $repository, HoPropalHouse $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataHolidays $dataEntity, HoProject $project): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataPropalHouse($obj, $data);

        if($existe = $repository->findOneBy(['project' => $project, 'name' => $obj->getName()])){
            if($type == "create" || ($type == "update" && $existe->getId() != $obj->getId())){
                return $apiResponse->apiJsonResponseValidationFailed([
                    ["name" => "name", "message" => "Cet hébergement existe déjà."]
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
        return $apiResponse->apiJsonResponse($obj, HoPropalHouse::LIST);
    }

    #[Route('/project/{project}/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, HoProject $project, ApiResponse $apiResponse, ValidatorService $validator,
                           DataHolidays $dataEntity, HoPropalHouseRepository $repository): Response
    {
        return $this->submitForm("create", $repository, new HoPropalHouse(), $request, $apiResponse, $validator, $dataEntity, $project);
    }

    #[Route('/project/{project}/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, HoProject $project, HoPropalHouse $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataHolidays $dataEntity, HoPropalHouseRepository $repository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $project);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(HoPropalHouse $obj, HoPropalHouseRepository $repository, ApiResponse $apiResponse): Response
    {
        $project = $obj->getProject();
        if($project->getPropalHouse()->getId() == $obj->getId()){
            $project->setPropalHouse(null);
        }

        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/vote/{id}', name: 'vote', options: ['expose' => true], methods: 'PUT')]
    public function vote(Request $request, HoPropalHouse $obj, ApiResponse $apiResponse, ValidatorService $validator, HoPropalHouseRepository $repository): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $votes = $obj->getVotes();

        $find = false; $nVotes = [];
        foreach($votes as $vote){
            if($vote == $data->userId){
                $find = true;
            }else{
                $nVotes[] = $vote;
            }
        }

        if(!$find){
            $nVotes[] = $data->userId;
        }

        $obj->setVotes($nVotes);

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, HoPropalHouse::LIST);
    }

    #[Route('/end/{id}', name: 'end', options: ['expose' => true], methods: 'PUT')]
    public function end(HoPropalHouse $obj, ApiResponse $apiResponse, ValidatorService $validator, HoProjectRepository $repository): Response
    {
        $project = $obj->getProject();
        $project->setPropalHouse($obj);

        $noErrors = $validator->validate($project);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($project, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }
}
