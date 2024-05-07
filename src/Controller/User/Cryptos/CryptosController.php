<?php

namespace App\Controller\User\Cryptos;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/espace-membre/cryptos', name: 'user_cryptos_')]
class CryptosController extends AbstractController
{
    #[Route('/', name: 'index')]
    public function list(): Response
    {
        return $this->render('user/pages/cryptos/index.html.twig');
    }
}
