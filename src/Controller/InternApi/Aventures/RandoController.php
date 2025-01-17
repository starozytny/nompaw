<?php

namespace App\Controller\InternApi\Aventures;

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
use App\Service\FileUploader;
use App\Service\ValidatorService;
use PHPImageWorkshop\Core\Exception\ImageWorkshopLayerException;
use PHPImageWorkshop\Exception\ImageWorkshopException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/aventures/rando', name: 'intern_api_aventures_randos_')]
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
                           FileUploader $fileUploader,
                           RaPropalDateRepository $dateRepository,
                           RaPropalAdventureRepository $adventureRepository,
                           RaImageRepository $imageRepository): Response
    {
        $obj->setAdventure(null);
        $obj->setAdventureDate(null);

        $repository->save($obj, true);

        foreach($dateRepository->findBy(['rando' => $obj]) as $item){
            $dateRepository->remove($item);
        }
        foreach($adventureRepository->findBy(['rando' => $obj]) as $item){
            $adventureRepository->remove($item);
        }
        foreach($imageRepository->findBy(['rando' => $obj]) as $item){
            $fileUploader->deleteFile($item->getFile(), RaRando::FOLDER_IMAGES.'/'.$item->getRando()->getId(), false);
            $fileUploader->deleteFile($item->getThumbs(), RaRando::FOLDER_THUMBS.'/'.$item->getRando()->getId(), false);

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

    /**
     * @throws ImageWorkshopException
     * @throws ImageWorkshopLayerException
     */
    #[Route('/cover/{id}', name: 'cover', options: ['expose' => true], methods: 'PUT')]
    public function cover(Request $request, RaRando $obj, ApiResponse $apiResponse, RaRandoRepository $repository, FileUploader $fileUploader): Response
    {
        $data = json_decode($request->getContent());

        $oldCover = $obj->getCover();
        if($oldCover){
            $oldCoverFile = $this->getParameter('private_directory') . RaRando::FOLDER_COVER . "/" . $oldCover;
            if(file_exists($oldCoverFile)){
                unlink($oldCoverFile);
            }
        }

        $randoFile = "/" . $obj->getId();
        $filenameCover = $fileUploader->cover($data->image, RaRando::FOLDER_IMAGES.$randoFile, RaRando::FOLDER_COVER.$randoFile);

        $obj->setCover($filenameCover);

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/src/cover/{id}', name: 'cover_src', options: ['expose' => true], methods: 'GET')]
    public function getCover(RaRando $obj): Response
    {
        $file = $this->getParameter('private_directory') . $obj->getCoverFile();
        if(!file_exists($file)){
            return $this->file('placeholders/placeholder.jpg');
        }
        return $this->file($file);
    }
}
