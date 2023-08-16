<?php

namespace App\Controller\Api\Aventures;

use App\Entity\Enum\Rando\StatusType;
use App\Entity\Rando\RaGroupe;
use App\Entity\Rando\RaRando;
use App\Repository\Main\UserRepository;
use App\Repository\Rando\RaImageRepository;
use App\Repository\Rando\RaPropalAdventureRepository;
use App\Repository\Rando\RaPropalDateRepository;
use App\Repository\Rando\RaRandoRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataRandos;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/aventures/rando', name: 'api_aventures_randos_')]
class RandoController extends AbstractController
{
    public function submitForm($type, RaRandoRepository $repository, RaRando $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataRandos $dataEntity, RaGroupe $groupe, UserRepository $userRepository): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataRando($obj, $data);

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

        $author = $this->getUser();
        if($data->referent){
            if($referent = $userRepository->find($data->referent)){
                $author = $referent;
            }
        }

        $obj->setAuthor($author);

        if($type == "create") {
            $obj = ($obj)
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
        return $apiResponse->apiJsonResponse($obj, RaRando::FORM);
    }

    #[Route('/groupe/{groupe}/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, RaGroupe $groupe, ApiResponse $apiResponse, ValidatorService $validator,
                           DataRandos $dataEntity, RaRandoRepository $repository, UserRepository $userRepository): Response
    {
        return $this->submitForm("create", $repository, new RaRando(), $request, $apiResponse, $validator, $dataEntity, $groupe, $userRepository);
    }

    #[Route('/groupe/{groupe}/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, RaGroupe $groupe, RaRando $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataRandos $dataEntity, RaRandoRepository $repository, UserRepository $userRepository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $groupe, $userRepository);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(RaRando $obj, RaRandoRepository $repository, ApiResponse $apiResponse,
                           RaPropalDateRepository $dateRepository, RaPropalAdventureRepository $adventureRepository,
                           RaImageRepository $imageRepository): Response
    {
        foreach($dateRepository->findBy(['rando' => $obj]) as $item){
            $dateRepository->remove($item);
        }
        foreach($adventureRepository->findBy(['rando' => $obj]) as $item){
            $adventureRepository->remove($item);
        }
        foreach($imageRepository->findBy(['rando' => $obj]) as $item){
            $imageRepository->remove($item);
        }

        $repository->remove($obj, true);
        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/cancel/date/{id}', name: 'cancel_date', options: ['expose' => true], methods: 'PUT')]
    public function cancelDate(RaRando $obj, ApiResponse $apiResponse, RaRandoRepository $repository): Response
    {
        $obj->setAdventureDate(null);
        $obj->setStartAt(null);

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/cancel/adventure/{id}', name: 'cancel_adventure', options: ['expose' => true], methods: 'PUT')]
    public function cancelAdventure(RaRando $obj, ApiResponse $apiResponse, RaRandoRepository $repository): Response
    {
        $obj->setAdventure(null);
        $obj->setStatus(StatusType::Propal);

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/end/{id}', name: 'end', options: ['expose' => true], methods: 'PUT')]
    public function end(RaRando $obj, ApiResponse $apiResponse, RaRandoRepository $repository): Response
    {
        $obj->setStatus(StatusType::End);
        $obj->setIsNext(false);

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/cover/{id}', name: 'cover', options: ['expose' => true], methods: 'PUT')]
    public function cover(Request $request, RaRando $obj, ApiResponse $apiResponse, RaRandoRepository $repository): Response
    {
        $data = json_decode($request->getContent());

        $obj->setCover($data->image);

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }
}
