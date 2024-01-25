<?php

namespace App\Controller;

use App\Entity\Main\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class ApiLoginController extends AbstractController
{
    #[Route('/api/login_check', name: 'api_login_check', methods: 'POST')]
    public function index(#[CurrentUser] ?User $user): Response
    {
        if (null === $user) {
            return $this->json([
                'message' => 'missing credentials',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'message' => 'Welcome to your new controller!',
            'path' => 'src/Controller/ApiLoginController.php',
            'user' => $user->getUserIdentifier(),
//            'token' => $user->getToken()
        ]);
    }

    #[Route('/api/test', name: 'api_test', methods: 'GET')]
    public function test(): Response
    {
        return $this->json([
            'message' => 'TEST',
        ]);
    }
}
