<?php

namespace App\Controller\InternApi\Cryptos;

use App\Entity\Crypto\CrTrade;
use App\Repository\Crypto\CrTradeRepository;
use App\Service\Api\ApiResponse;
use App\Service\Data\DataCrypto;
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
    #[Route('/list', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function cover(ApiResponse $apiResponse, CrTradeRepository $repository): Response
    {
        return $apiResponse->apiJsonResponse($repository->findBy(['user' => $this->getUser()], ['tradeAt' => 'ASC']), CrTrade::LIST);
    }

    /**
     * @throws Exception
     */
    public function submitForm($type, CrTradeRepository $repository, CrTrade $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataCrypto $dataEntity): JsonResponse
    {
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
        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful("ok");
    }
}
