<?php

namespace App\Controller\User\Crypto;

use App\Repository\Crypto\CrTradeRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/espace-membre/cryptos', name: 'user_cryptos_')]
class CryptoController extends AbstractController
{
    #[Route('/', name: 'index')]
    public function list(CrTradeRepository $repository): Response
    {
        return $this->render('user/pages/cryptos/index.html.twig', ['data' => $repository->findAll()]);
    }
}
