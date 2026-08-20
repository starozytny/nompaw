<?php

namespace App\Controller\InternApi\Cryptos;

use App\Entity\Crypto\CrBitpandaCredential;
use App\Repository\Crypto\CrBitpandaCredentialRepository;
use App\Service\Api\ApiResponse;
use App\Service\Crypto\BitpandaApiClient;
use App\Service\Crypto\CredentialEncryptionService;
use App\Service\Crypto\CryptoImportService;
use App\Service\Crypto\Import\BitpandaApiTransactionMapper;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cryptos/bitpanda', name: 'intern_api_cryptos_bitpanda_')]
class BitpandaController extends AbstractController
{
    #[Route('/status', name: 'status', options: ['expose' => true], methods: 'GET')]
    public function status(CrBitpandaCredentialRepository $credentialRepository, ApiResponse $apiResponse): Response
    {
        $credential = $credentialRepository->findOneByUser($this->getUser());

        return $apiResponse->apiJsonResponseCustom([
            'connected' => $credential !== null,
            'apiKeyPreview' => $credential?->getApiKeyPreview(),
            'connectedAt' => $credential?->getConnectedAt()?->format('c'),
            'lastSyncedAt' => $credential?->getLastSyncedAt()?->format('c'),
            'lastSyncError' => $credential?->getLastSyncError(),
        ]);
    }

    #[Route('/connect', name: 'connect', options: ['expose' => true], methods: 'POST')]
    public function connect(
        Request $request,
        CrBitpandaCredentialRepository $credentialRepository,
        BitpandaApiClient $bitpandaApiClient,
        CredentialEncryptionService $encryptionService,
        ApiResponse $apiResponse,
    ): Response {
        $payload = json_decode($request->getContent(), true);
        $apiKey = $payload['apiKey'] ?? null;

        if (!is_string($apiKey) || $apiKey === '') {
            return $apiResponse->apiJsonResponseBadRequest('La clé API est requise.');
        }

        $connectionResult = $bitpandaApiClient->testConnection($apiKey);
        if ($connectionResult !== true) {
            return $apiResponse->apiJsonResponseBadRequest($connectionResult);
        }

        $user = $this->getUser();
        $credential = $credentialRepository->findOneByUser($user) ?? (new CrBitpandaCredential())
            ->setUser($user)
            ->setConnectedAt(new \DateTimeImmutable())
        ;

        $credential
            ->setApiKeyEncrypted($encryptionService->encrypt($apiKey))
            ->setApiKeyPreview('••••' . substr($apiKey, -4))
            ->setLastSyncError(null)
        ;

        $credentialRepository->save($credential, true);

        return $apiResponse->apiJsonResponseSuccessful('Compte Bitpanda connecté.');
    }

    #[Route('/sync', name: 'sync', options: ['expose' => true], methods: 'POST')]
    public function sync(
        CrBitpandaCredentialRepository $credentialRepository,
        BitpandaApiClient $bitpandaApiClient,
        BitpandaApiTransactionMapper $mapper,
        CredentialEncryptionService $encryptionService,
        CryptoImportService $importService,
        ApiResponse $apiResponse,
    ): Response {
        $user = $this->getUser();
        $credential = $credentialRepository->findOneByUser($user);
        if ($credential === null) {
            return $apiResponse->apiJsonResponseBadRequest('Aucun compte Bitpanda connecté.');
        }

        try {
            $apiKey = $encryptionService->decrypt($credential->getApiKeyEncrypted());
            $operations = $bitpandaApiClient->fetchOperations($apiKey);
            $symbolMap = $bitpandaApiClient->fetchAssetSymbols($apiKey);
        } catch (\Throwable $e) {
            $credential->setLastSyncError($e->getMessage());
            $credentialRepository->save($credential, true);

            return $apiResponse->apiJsonResponseBadRequest($e->getMessage());
        }

        $summary = $importService->importFromApi($user, $mapper->getSourceName(), $mapper->map($operations, $symbolMap));

        $credential
            ->setLastSyncedAt(new \DateTimeImmutable())
            ->setLastSyncError(null)
        ;
        $credentialRepository->save($credential, true);

        return $apiResponse->apiJsonResponseCustom($summary);
    }

    #[Route('/disconnect', name: 'disconnect', options: ['expose' => true], methods: 'DELETE')]
    public function disconnect(CrBitpandaCredentialRepository $credentialRepository, ApiResponse $apiResponse): Response
    {
        $credential = $credentialRepository->findOneByUser($this->getUser());
        if ($credential !== null) {
            $credentialRepository->remove($credential, true);
        }

        return $apiResponse->apiJsonResponseSuccessful('Compte Bitpanda déconnecté.');
    }
}
