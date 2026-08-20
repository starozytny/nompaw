<?php

namespace App\Controller\InternApi\Cryptos;

use App\Entity\Crypto\CrImportLog;
use App\Repository\Crypto\CrImportLogRepository;
use App\Service\Api\ApiResponse;
use App\Service\Crypto\CryptoImportService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cryptos/import', name: 'intern_api_cryptos_import_')]
class ImportController extends AbstractController
{
    #[Route('', name: 'index', options: ['expose' => true], methods: 'POST')]
    public function index(Request $request, CryptoImportService $importService, ApiResponse $apiResponse): Response
    {
        $file = $request->files->get('file');
        if ($file === null) {
            return $apiResponse->apiJsonResponseBadRequest('Aucun fichier reçu.');
        }

        $summary = $importService->import($this->getUser(), $file);

        return $apiResponse->apiJsonResponseCustom($summary);
    }

    #[Route('/history', name: 'history', options: ['expose' => true], methods: 'GET')]
    public function history(CrImportLogRepository $importLogRepository, ApiResponse $apiResponse): Response
    {
        $logs = $importLogRepository->findRecentByUser($this->getUser());

        return $apiResponse->apiJsonResponse($logs, CrImportLog::LIST);
    }
}
