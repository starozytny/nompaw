<?php

namespace App\Controller\User\Running;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/espace-membre/running', name: 'user_running_')]
class RunningController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true], methods: 'GET')]
    public function index(): Response
    {
        return $this->render('user/pages/running/index.html.twig');
    }
}
