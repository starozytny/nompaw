<?php

namespace App\Controller\InternApi\Aventures;

use App\Entity\Rando\RaPropalDate;
use App\Entity\Rando\RaRando;
use App\Repository\Rando\RaPropalDateRepository;
use App\Repository\Rando\RaRandoRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataRandos;
use App\Service\Propals\PropalService;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/aventures/propal/date', name: 'intern_api_aventures_propals_date_')]
class PropalDateController extends AbstractController
{
    public function submitForm($type, RaPropalDateRepository $repository, RaPropalDate $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataRandos $dataEntity, RaRando $rando): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataPropalDate($obj, $data);

        if($existe = $repository->findOneBy(['rando' => $rando, 'dateAt' => $obj->getDateAt()])){
            if($type == "create" || ($type == "update" && $existe->getId() != $obj->getId())){
                return $apiResponse->apiJsonResponseValidationFailed([
                    ["name" => "dateAt", "message" => "Cette date existe déjà."]
                ]);
            }
        }

        if($type == "create") {
            $obj = ($obj)
                ->setRando($rando)
                ->setVotes([])
                ->setAuthor($this->getUser())
            ;
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, RaPropalDate::LIST);
    }

    #[Route('/rando/{rando}/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, RaRando $rando, ApiResponse $apiResponse, ValidatorService $validator,
                           DataRandos $dataEntity, RaPropalDateRepository $repository): Response
    {
        return $this->submitForm("create", $repository, new RaPropalDate(), $request, $apiResponse, $validator, $dataEntity, $rando);
    }

    #[Route('/rando/{rando}/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, RaRando $rando, RaPropalDate $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataRandos $dataEntity, RaPropalDateRepository $repository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $rando);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(RaPropalDate $obj, RaPropalDateRepository $repository, ApiResponse $apiResponse): Response
    {
        $rando = $obj->getRando();
        if($rando->getAdventureDate() == $obj->getId()){
            $rando->setAdventureDate(null);
        }

        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/vote/{id}', name: 'vote', options: ['expose' => true], methods: 'PUT')]
    public function vote(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                         RaPropalDate $obj, RaPropalDateRepository $repository, PropalService $propalService): Response
    {
        return $propalService->vote($request, $apiResponse, $validator, $obj, $repository, RaPropalDate::LIST);
    }

    #[Route('/end/{id}', name: 'end', options: ['expose' => true], methods: 'PUT')]
    public function end(RaPropalDate $obj, ApiResponse $apiResponse, ValidatorService $validator, RaRandoRepository $repository): Response
    {
        $rando = $obj->getRando();
        $rando->setStartAt($obj->getDateAt());
        $rando->setAdventureDate($obj);

        $noErrors = $validator->validate($rando);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($rando, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }
}
