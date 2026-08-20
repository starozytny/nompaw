<?php

namespace App\Controller\InternApi\Cryptos;

use App\Entity\Crypto\CrKrakenCredential;
use App\Repository\Crypto\CrKrakenCredentialRepository;
use App\Service\Api\ApiResponse;
use App\Service\Crypto\CredentialEncryptionService;
use App\Service\Crypto\CryptoImportService;
use App\Service\Crypto\Import\KrakenApiTransactionMapper;
use App\Service\Crypto\KrakenApiClient;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cryptos/kraken', name: 'intern_api_cryptos_kraken_')]
class KrakenController extends AbstractController
{
    #[Route('/status', name: 'status', options: ['expose' => true], methods: 'GET')]
    public function status(CrKrakenCredentialRepository $credentialRepository, ApiResponse $apiResponse): Response
    {
        $credential = $credentialRepository->findOneByUser($this->getUser());

        return $apiResponse->apiJsonResponseCustom([
            'connected' => $credential !== null,
            'apiKey' => $credential?->getApiKey(),
            'connectedAt' => $credential?->getConnectedAt()?->format('c'),
            'lastSyncedAt' => $credential?->getLastSyncedAt()?->format('c'),
            'lastSyncError' => $credential?->getLastSyncError(),
        ]);
    }

    #[Route('/connect', name: 'connect', options: ['expose' => true], methods: 'POST')]
    public function connect(
        Request $request,
        CrKrakenCredentialRepository $credentialRepository,
        KrakenApiClient $krakenApiClient,
        CredentialEncryptionService $encryptionService,
        ApiResponse $apiResponse,
    ): Response {
        $payload = json_decode($request->getContent(), true);

        $apiKey = $payload['apiKey'] ?? null;
        $apiSecret = $payload['apiSecret'] ?? null;

        if (!is_string($apiKey) || !is_string($apiSecret) || $apiKey === '' || $apiSecret === '') {
            return $apiResponse->apiJsonResponseBadRequest("La clé API et la clé privée sont toutes les deux requises.");
        }

        $connectionResult = $krakenApiClient->testConnection($apiKey, $apiSecret);
        if ($connectionResult !== true) {
            return $apiResponse->apiJsonResponseBadRequest($connectionResult);
        }

        $user = $this->getUser();
        $credential = $credentialRepository->findOneByUser($user) ?? (new CrKrakenCredential())
            ->setUser($user)
            ->setConnectedAt(new \DateTimeImmutable())
        ;

        $credential
            ->setApiKey($apiKey)
            ->setApiSecretEncrypted($encryptionService->encrypt($apiSecret))
            ->setLastSyncError(null)
        ;

        $credentialRepository->save($credential, true);

        return $apiResponse->apiJsonResponseSuccessful('Compte Kraken connecté.');
    }

    #[Route('/sync', name: 'sync', options: ['expose' => true], methods: 'POST')]
    public function sync(
        CrKrakenCredentialRepository $credentialRepository,
        KrakenApiClient $krakenApiClient,
        KrakenApiTransactionMapper $mapper,
        CredentialEncryptionService $encryptionService,
        CryptoImportService $importService,
        ApiResponse $apiResponse,
    ): Response {
        $user = $this->getUser();
        $credential = $credentialRepository->findOneByUser($user);
        if ($credential === null) {
            return $apiResponse->apiJsonResponseBadRequest('Aucun compte Kraken connecté.');
        }

        try {
            $apiSecret = $encryptionService->decrypt($credential->getApiSecretEncrypted());
            $entries = $krakenApiClient->fetchLedgerEntries($credential->getApiKey(), $apiSecret);
        } catch (\Throwable $e) {
            $credential->setLastSyncError($e->getMessage());
            $credentialRepository->save($credential, true);

            return $apiResponse->apiJsonResponseBadRequest($e->getMessage());
        }

        $summary = $importService->importFromApi($user, $mapper->getSourceName(), $mapper->map($entries));

        $credential
            ->setLastSyncedAt(new \DateTimeImmutable())
            ->setLastSyncError(null)
        ;
        $credentialRepository->save($credential, true);

        return $apiResponse->apiJsonResponseCustom($summary);
    }

    #[Route('/disconnect', name: 'disconnect', options: ['expose' => true], methods: 'DELETE')]
    public function disconnect(CrKrakenCredentialRepository $credentialRepository, ApiResponse $apiResponse): Response
    {
        $credential = $credentialRepository->findOneByUser($this->getUser());
        if ($credential !== null) {
            $credentialRepository->remove($credential, true);
        }

        return $apiResponse->apiJsonResponseSuccessful('Compte Kraken déconnecté.');
    }
}
