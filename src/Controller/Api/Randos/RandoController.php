<?php

namespace App\Controller\Api\Randos;

use App\Entity\Rando\RaGroupe;
use App\Entity\Rando\RaRando;
use App\Repository\Rando\RaRandoRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataRandos;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/randos/rando', name: 'api_randos_rando_')]
class RandoController extends AbstractController
{
    public function submitForm($type, RaRandoRepository $repository, RaRando $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataRandos $dataEntity, RaGroupe $groupe): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataRando($obj, $data);

        if($type == "create") {
            $obj = ($obj)
                ->setAuthor($this->getUser())
                ->setIsNext(true)
                ->setGroupe($groupe)
            ;

            $randos = $repository->findBy(['groupe' => $groupe]);
            foreach($randos as $r){
                $r->setIsNext(false);
            }
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, RaGroupe::FORM);
    }

    #[Route('/groupe/{groupe}/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, RaGroupe $groupe, ApiResponse $apiResponse, ValidatorService $validator,
                           DataRandos $dataEntity, RaRandoRepository $repository): Response
    {
        return $this->submitForm("create", $repository, new RaRando(), $request, $apiResponse, $validator, $dataEntity, $groupe);
    }

    #[Route('/groupe/{groupe}/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, RaGroupe $groupe, RaRando $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataRandos $dataEntity, RaRandoRepository $repository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $groupe);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(RaRando $obj, RaRandoRepository $repository, ApiResponse $apiResponse): Response
    {
        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }
}