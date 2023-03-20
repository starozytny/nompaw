<?php

namespace App\Controller\Api\Randos;

use App\Entity\Rando\RaGroupe;
use App\Entity\Rando\RaLink;
use App\Repository\Main\UserRepository;
use App\Repository\Rando\RaGroupeRepository;
use App\Repository\Rando\RaLinkRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataRandos;
use App\Service\FileUploader;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/randos/groupes', name: 'api_randos_groupes_')]
class GroupeController extends AbstractController
{
    public function submitForm($type, RaGroupeRepository $repository, RaGroupe $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataRandos $dataEntity, FileUploader $fileUploader,
                               RaLinkRepository $linkRepository, UserRepository $userRepository): JsonResponse
    {
        $data = json_decode($request->get('data'));
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataGroupe($obj, $data);

        if($type == "create") {
            $obj->setAuthor($this->getUser());
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        if($type == "update"){
            foreach($linkRepository->findBy(['groupe' => $obj->getId()]) as $link){
                $linkRepository->remove($link);
            }
        }

        $users = $userRepository->findAll();
        foreach($data->members as $member){
            $newMember = null;
            foreach($users as $user){
                if($user->getId() == $member) $newMember = $user;
            }

            if($newMember){
                $link = (new RaLink())
                    ->setGroupe($obj)
                    ->setUser($newMember)
                ;

                $linkRepository->save($link);
            }
        }

        $file = $request->files->get('image');
        if ($file) {
            $fileName = $fileUploader->replaceFile($file, RaGroupe::FOLDER_ILLU, $obj->getImage());
            $obj->setImage($fileName);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, RaGroupe::FORM);
    }

    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataRandos $dataEntity, RaGroupeRepository $repository, FileUploader $fileUploader,
                           RaLinkRepository $linkRepository, UserRepository $userRepository): Response
    {
        return $this->submitForm("create", $repository, new RaGroupe(), $request, $apiResponse, $validator, $dataEntity,
            $fileUploader, $linkRepository, $userRepository);
    }

    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'POST')]
    public function update(Request $request, RaGroupe $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataRandos $dataEntity, RaGroupeRepository $repository, FileUploader $fileUploader,
                           RaLinkRepository $linkRepository, UserRepository $userRepository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity,
            $fileUploader, $linkRepository, $userRepository);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(RaGroupe $obj, RaGroupeRepository $repository, RaLinkRepository $linkRepository, ApiResponse $apiResponse): Response
    {
        foreach($obj->getLinks() as $link){
            $linkRepository->remove($link);
        }

        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }
}
