<?php

namespace App\Controller\Api\Holidays;

use App\Entity\Holiday\HoProject;
use App\Entity\Holiday\HoPropalActivity;
use App\Repository\Holiday\HoPropalActivityRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataHolidays;
use App\Service\FileUploader;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/projects/propal/activity', name: 'api_projects_propals_activity_')]
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
    public function vote(Request $request, HoPropalActivity $obj, ApiResponse $apiResponse, ValidatorService $validator, HoPropalActivityRepository $repository): Response
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
        return $apiResponse->apiJsonResponse($obj, HoPropalActivity::LIST);
    }
}
