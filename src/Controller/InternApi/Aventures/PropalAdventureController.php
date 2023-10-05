<?php

namespace App\Controller\InternApi\Aventures;

use App\Entity\Enum\Rando\StatusType;
use App\Entity\Rando\RaPropalAdventure;
use App\Entity\Rando\RaRando;
use App\Repository\Rando\RaPropalAdventureRepository;
use App\Repository\Rando\RaRandoRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataRandos;
use App\Service\Propals\PropalService;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/aventures/propals/adventure', name: 'api_aventures_propals_adventure_')]
class PropalAdventureController extends AbstractController
{
    public function submitForm($type, RaPropalAdventureRepository $repository, RaPropalAdventure $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataRandos $dataEntity, RaRando $rando): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataPropalAdventure($obj, $data);

        if($existe = $repository->findOneBy(['rando' => $rando, 'name' => $obj->getName()])){
            if($type == "create" || ($type == "update" && $existe->getId() != $obj->getId())){
                return $apiResponse->apiJsonResponseValidationFailed([
                    ["name" => "name", "message" => "Cette aventure existe déjà."]
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
        return $apiResponse->apiJsonResponse($obj, RaPropalAdventure::LIST);
    }

    #[Route('/{rando}/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, RaRando $rando, ApiResponse $apiResponse, ValidatorService $validator,
                           DataRandos $dataEntity, RaPropalAdventureRepository $repository): Response
    {
        return $this->submitForm("create", $repository, new RaPropalAdventure(), $request, $apiResponse, $validator, $dataEntity, $rando);
    }

    #[Route('/{rando}/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, RaRando $rando, RaPropalAdventure $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataRandos $dataEntity, RaPropalAdventureRepository $repository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $rando);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(RaPropalAdventure $obj, RaPropalAdventureRepository $repository, ApiResponse $apiResponse): Response
    {
        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/vote/{id}', name: 'vote', options: ['expose' => true], methods: 'PUT')]
    public function vote(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                         RaPropalAdventure $obj, RaPropalAdventureRepository $repository, PropalService $propalService): Response
    {
        return $propalService->vote($request, $apiResponse, $validator, $obj, $repository, RaPropalAdventure::LIST);
    }

    #[Route('/end/{id}', name: 'end', options: ['expose' => true], methods: 'PUT')]
    public function end(RaPropalAdventure $obj, ApiResponse $apiResponse, ValidatorService $validator, RaRandoRepository $repository): Response
    {
        $rando = $obj->getRando();
        $rando->setAdventure($obj);
        $rando->setStatus(StatusType::Validate);

        $noErrors = $validator->validate($rando);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($rando, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }
}
