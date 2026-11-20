<?php

namespace App\Controller\User\Invest;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/espace-membre/investissements', name: 'user_invest_')]
class InvestController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true], methods: 'GET')]
    public function index(): Response
    {
        return $this->render('user/pages/invest/index.html.twig');
    }
}
