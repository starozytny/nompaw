<?php

namespace App\Controller\InternApi\Cryptos;

use App\Service\Api\ApiResponse;
use App\Service\Crypto\CrStatsService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cryptos/stats', name: 'intern_api_cryptos_stats_')]
class StatsController extends AbstractController
{
    #[Route('', name: 'index', options: ['expose' => true], methods: 'GET')]
    public function index(CrStatsService $statsService, ApiResponse $apiResponse): Response
    {
        return $apiResponse->apiJsonResponseCustom($statsService->build($this->getUser()));
    }

    #[Route('/coin/{coin}', name: 'coin', requirements: ['coin' => '[A-Za-z0-9]{1,10}'], options: ['expose' => true], methods: 'GET')]
    public function coin(string $coin, CrStatsService $statsService, ApiResponse $apiResponse): Response
    {
        return $apiResponse->apiJsonResponseCustom(['coin' => strtoupper($coin), 'points' => $statsService->coinSeries($this->getUser(), $coin)]);
    }

    #[Route('/refresh-prices', name: 'refresh_prices', options: ['expose' => true], methods: 'POST')]
    public function refreshPrices(CrStatsService $statsService, ApiResponse $apiResponse): Response
    {
        $written = $statsService->refreshPrices($this->getUser(), heldOnly: true);

        return $apiResponse->apiJsonResponseCustom([
            'written' => array_sum($written),
            ...$statsService->build($this->getUser()),
        ]);
    }
}
