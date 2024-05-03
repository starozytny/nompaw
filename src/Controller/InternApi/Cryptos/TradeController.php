<?php

namespace App\Controller\InternApi\Cryptos;

use App\Entity\Crypto\CrTrade;
use App\Repository\Crypto\CrTradeRepository;
use App\Service\ApiResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cryptos/trades', name: 'intern_api_cryptos_trades_')]
class TradeController extends AbstractController
{
    #[Route('/list', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function cover(ApiResponse $apiResponse, CrTradeRepository $repository): Response
    {
        return $apiResponse->apiJsonResponse($repository->findAll(), CrTrade::LIST);
    }
}
