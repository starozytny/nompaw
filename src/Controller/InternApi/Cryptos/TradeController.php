<?php

namespace App\Controller\InternApi\Cryptos;

use App\Entity\Crypto\CrTrade;
use App\Repository\Crypto\CrTradeRepository;
use App\Service\Api\ApiResponse;
use App\Service\Crypto\CrTradeReplayService;
use App\Service\Data\DataCrypto;
use App\Service\SanitizeData;
use App\Service\ValidatorService;
use Exception;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cryptos/trades', name: 'intern_api_cryptos_trades_')]
class TradeController extends AbstractController
{
    /**
     * One year's trades (each annotated server-side with the running "Dispo" balance and an "invalid"
     * deficit flag), plus the list of years with data and that year's aggregate stats — replaces returning
     * the user's entire trade history on every load, see CrTradeReplayService.
     */
    #[Route('/list', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function cover(Request $request, ApiResponse $apiResponse, CrTradeReplayService $replayService): Response
    {
        $year = $request->query->get('year');

        return $apiResponse->apiJsonResponseCustom(
            $replayService->computeYearData($this->getUser(), $year !== null ? (int) $year : null)
        );
    }

    #[Route('/holdings', name: 'holdings', options: ['expose' => true], methods: 'GET')]
    public function holdings(ApiResponse $apiResponse, CrTradeReplayService $replayService): Response
    {
        return $apiResponse->apiJsonResponseCustom($replayService->computeHoldings($this->getUser()));
    }

    /**
     * Powers the "Cryptos" year stat card/modal: per coin, quantity held at year-end plus how much was
     * bought/sold during $year — see CrTradeReplayService::computeYearCryptoBreakdown().
     */
    #[Route('/holdings-year/{year}', name: 'holdings_year', requirements: ['year' => '\d{4}'], options: ['expose' => true], methods: 'GET')]
    public function holdingsYear(int $year, ApiResponse $apiResponse, CrTradeReplayService $replayService): Response
    {
        return $apiResponse->apiJsonResponseCustom($replayService->computeYearCryptoBreakdown($this->getUser(), $year));
    }

    #[Route('/holdings-as-of', name: 'holdings_as_of', options: ['expose' => true], methods: 'GET')]
    public function holdingsAsOf(Request $request, ApiResponse $apiResponse, CrTradeReplayService $replayService, SanitizeData $sanitizeData): Response
    {
        $date = $sanitizeData->createDateTime($request->query->get('date'));
        if ($date === null) {
            return $apiResponse->apiJsonResponseBadRequest('Date manquante ou invalide.');
        }

        $excludeId = $request->query->get('excludeId');

        return $apiResponse->apiJsonResponseCustom(
            $replayService->computeHoldingsAsOf($this->getUser(), $date, $excludeId !== null ? (int) $excludeId : null)
        );
    }

    #[Route('/filters', name: 'filters', options: ['expose' => true], methods: 'GET')]
    public function filters(ApiResponse $apiResponse, CrTradeReplayService $replayService): Response
    {
        return $apiResponse->apiJsonResponseCustom($replayService->getFilterOptions($this->getUser()));
    }

    /**
     * @throws Exception
     */
    public function submitForm($type, CrTradeRepository $repository, CrTrade $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataCrypto $dataEntity): JsonResponse
    {
        if ($type == "update" && $obj->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden('Accès non autorisé.');
        }

        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataTrade($obj, $data);
        $obj->setUser($this->getUser());

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, CrTrade::LIST);
    }

    /**
     * @throws Exception
     */
    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataCrypto $dataEntity, CrTradeRepository $repository): Response
    {
        return $this->submitForm("create", $repository, new CrTrade(), $request, $apiResponse, $validator, $dataEntity);
    }

    /**
     * @throws Exception
     */
    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, CrTrade $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataCrypto $dataEntity, CrTradeRepository $repository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(CrTrade $obj, CrTradeRepository $repository, ApiResponse $apiResponse): Response
    {
        if ($obj->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden('Accès non autorisé.');
        }

        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }
}
