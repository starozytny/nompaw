<?php

namespace App\Controller\Api;

use App\Entity\Main\User;
use App\Service\ApiResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/users', name: 'api_users_')]
class UserController extends AbstractController
{
    #[Route('/infos/me', name: 'infos_me', methods: 'GET')]
    public function infosMe(Request $request, ApiResponse $apiResponse): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        return $apiResponse->apiJsonResponseCustom([
            'avatarUrl' => $request->getSchemeAndHttpHost() . $user->getAvatarFile()
        ]);
    }
}
