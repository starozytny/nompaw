<?php

namespace App\Controller\InternApi\Cryptos;

use App\Service\Api\ApiResponse;
use App\Service\Crypto\CrFxRateService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cryptos/fx-rate', name: 'intern_api_cryptos_fx_rate_')]
class FxRateController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true], methods: 'GET')]
    public function index(Request $request, CrFxRateService $fxRateService, ApiResponse $apiResponse): Response
    {
        $from = strtoupper((string) $request->query->get('from'));
        $to = strtoupper((string) $request->query->get('to'));
        $amount = $request->query->get('amount');
        $date = $request->query->get('date');

        if ($from === '' || $to === '' || !is_numeric($amount) || $date === null) {
            return $apiResponse->apiJsonResponseBadRequest('Paramètres invalides.');
        }

        try {
            $dateTime = new \DateTimeImmutable($date);
        } catch (\Exception) {
            return $apiResponse->apiJsonResponseBadRequest('Date invalide.');
        }

        $result = $fxRateService->convert($from, $to, (float) $amount, $dateTime);
        if ($result === null) {
            return $apiResponse->apiJsonResponseBadRequest("Taux de change introuvable pour {$from} → {$to} à cette date.");
        }

        return $apiResponse->apiJsonResponseCustom($result);
    }
}
