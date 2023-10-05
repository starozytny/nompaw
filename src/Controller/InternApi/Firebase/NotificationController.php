<?php

namespace App\Controller\InternApi\Firebase;

use App\Entity\Firebase\FiToken;
use App\Repository\Firebase\FiTokenRepository;
use App\Service\ApiResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/firebase/notifications', name: 'api_firebase_notifs_')]
class NotificationController extends AbstractController
{
    #[Route('/create/token/{type}/{id}', name: 'create_token_birthday', options: ['expose' => true], methods: 'POST')]
    public function tokens(Request $request, $type, $id, FiTokenRepository $repository, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());

        if(!$repository->findOneBy(['token' => $data->token])){
            $token = (new FiToken())->setToken($data->token);

            if($type == "birthday"){
                $token->setBirthdayId($id);
            }

            $repository->save($token, true);
        }

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }
}
