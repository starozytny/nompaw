<?php

namespace App\Controller\Api\Birthdays;

use App\Entity\Birthday\BiBirthday;
use App\Entity\Birthday\BiPresent;
use App\Repository\Birthday\BiPresentRepository;
use App\Repository\Firebase\FiTokenRepository;
use App\Repository\Main\UserRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataBirthdays;
use App\Service\FileUploader;
use App\Service\ThirdPart\FirebaseService;
use App\Service\ThirdPart\GoogleService;
use App\Service\SanitizeData;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/birthdays/presents', name: 'api_birthdays_presents_')]
class PresentController extends AbstractController
{
    public function submitForm($type, BiPresentRepository $repository, BiPresent $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, FileUploader $fileUploader, DataBirthdays $dataEntity, BiBirthday $birthday): JsonResponse
    {
        $data = json_decode($request->get('data'));
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataPresent($obj, $data);

        if($existe = $repository->findOneBy(['birthday' => $birthday, 'name' => $obj->getName()])){
            if($type == "create" || ($type == "update" && $existe->getId() != $obj->getId())){
                return $apiResponse->apiJsonResponseValidationFailed([
                    ["name" => "name", "message" => "Ce cadeau existe déjà."]
                ]);
            }
        }

        if($type == "create") {
            $obj = ($obj)
                ->setBirthday($birthday)
                ->setAuthor($this->getUser())
            ;
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $file = $request->files->get('image');
        if ($file) {
            $fileName = $fileUploader->replaceFile($file, BiPresent::FOLDER . $birthday->getId(), $obj->getImage(), true, 280);
            $obj->setImage($fileName);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, BiPresent::LIST);
    }

    #[Route('/anniversaire/{birthday}/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, BiBirthday $birthday, ApiResponse $apiResponse, ValidatorService $validator,
                           FileUploader $fileUploader, DataBirthdays $dataEntity, BiPresentRepository $repository): Response
    {
        return $this->submitForm("create", $repository, new BiPresent(), $request, $apiResponse, $validator, $fileUploader, $dataEntity, $birthday);
    }

    #[Route('/anniversaire/{birthday}/update/{id}', name: 'update', options: ['expose' => true], methods: 'POST')]
    public function update(Request $request, BiBirthday $birthday, BiPresent $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           FileUploader $fileUploader, DataBirthdays $dataEntity, BiPresentRepository $repository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $fileUploader, $dataEntity, $birthday);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(BiPresent $obj, BiPresentRepository $repository, ApiResponse $apiResponse): Response
    {
        $repository->remove($obj, true);
        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/end/{id}', name: 'end', options: ['expose' => true], methods: 'PUT')]
    public function end(Request $request, BiPresent $obj, ApiResponse $apiResponse, BiPresentRepository $repository,
                        UserRepository $userRepository, SanitizeData $sanitizeData,
                        GoogleService $googleService, FiTokenRepository $fiTokenRepository,
                        FirebaseService $firebaseService): Response
    {
        $data = json_decode($request->getContent());

        $guest = null;
        if($data->guest){
            $guest = $userRepository->find($data->guest);
        }

        $obj->setIsSelected(true);
        $obj->setGuest($guest);
        $obj->setGuestName($sanitizeData->trimData($data->guestName) ?? "Anonyme");

        $tokens = $fiTokenRepository->findBy(['birthdayId' => $obj->getBirthday()->getId()]);
        $bearToken = $googleService->connect();
        foreach($tokens as $token){
            $title = 'Anniversaire ' . $obj->getBirthday()->getName();
            $firebaseService->sendNotif(
                $bearToken, $token, $fiTokenRepository, $title,
                'Cadeau pris : ' . $obj->getName(), $obj->getImageFile()
            );
        }

        $repository->save($obj, true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/cancel/{id}', name: 'cancel', options: ['expose' => true], methods: 'PUT')]
    public function cancel(BiPresent $obj, ApiResponse $apiResponse, BiPresentRepository $repository,
                           FiTokenRepository $fiTokenRepository, GoogleService $googleService, FirebaseService $firebaseService): Response
    {
        $obj->setIsSelected(false);
        $obj->setGuest(null);
        $obj->setGuestName(null);

        $tokens = $fiTokenRepository->findBy(['birthdayId' => $obj->getBirthday()->getId()]);
        $bearToken = $googleService->connect();
        foreach($tokens as $token){
            $title = 'Anniversaire ' . $obj->getBirthday()->getName();
            $firebaseService->sendNotif(
                $bearToken, $token, $fiTokenRepository,
                $title, 'Cadeau de nouveau disponible : ' . $obj->getName(), $obj->getImageFile()
            );
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }
}
