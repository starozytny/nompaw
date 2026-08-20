<?php

namespace App\Controller\InternApi\Cryptos;

use App\Entity\Crypto\CrCryptocomCredential;
use App\Repository\Crypto\CrCryptocomCredentialRepository;
use App\Service\Api\ApiResponse;
use App\Service\Crypto\CredentialEncryptionService;
use App\Service\Crypto\CryptocomApiClient;
use App\Service\Crypto\CryptoImportService;
use App\Service\Crypto\Import\CryptocomApiTransactionMapper;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cryptos/cryptocom', name: 'intern_api_cryptos_cryptocom_')]
class CryptocomController extends AbstractController
{
    #[Route('/status', name: 'status', options: ['expose' => true], methods: 'GET')]
    public function status(CrCryptocomCredentialRepository $credentialRepository, ApiResponse $apiResponse): Response
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
        CrCryptocomCredentialRepository $credentialRepository,
        CryptocomApiClient $cryptocomApiClient,
        CredentialEncryptionService $encryptionService,
        ApiResponse $apiResponse,
    ): Response {
        $payload = json_decode($request->getContent(), true);

        $apiKey = $payload['apiKey'] ?? null;
        $apiSecret = $payload['apiSecret'] ?? null;

        if (!is_string($apiKey) || !is_string($apiSecret) || $apiKey === '' || $apiSecret === '') {
            return $apiResponse->apiJsonResponseBadRequest("La clé API et la clé secrète sont toutes les deux requises.");
        }

        $connectionResult = $cryptocomApiClient->testConnection($apiKey, $apiSecret);
        if ($connectionResult !== true) {
            return $apiResponse->apiJsonResponseBadRequest($connectionResult);
        }

        $user = $this->getUser();
        $credential = $credentialRepository->findOneByUser($user) ?? (new CrCryptocomCredential())
            ->setUser($user)
            ->setConnectedAt(new \DateTimeImmutable())
        ;

        $credential
            ->setApiKey($apiKey)
            ->setApiSecretEncrypted($encryptionService->encrypt($apiSecret))
            ->setLastSyncError(null)
        ;

        $credentialRepository->save($credential, true);

        return $apiResponse->apiJsonResponseSuccessful('Compte Crypto.com Exchange connecté.');
    }

    #[Route('/sync', name: 'sync', options: ['expose' => true], methods: 'POST')]
    public function sync(
        CrCryptocomCredentialRepository $credentialRepository,
        CryptocomApiClient $cryptocomApiClient,
        CryptocomApiTransactionMapper $mapper,
        CredentialEncryptionService $encryptionService,
        CryptoImportService $importService,
        ApiResponse $apiResponse,
    ): Response {
        $user = $this->getUser();
        $credential = $credentialRepository->findOneByUser($user);
        if ($credential === null) {
            return $apiResponse->apiJsonResponseBadRequest('Aucun compte Crypto.com Exchange connecté.');
        }

        try {
            $apiSecret = $encryptionService->decrypt($credential->getApiSecretEncrypted());
            $symbolMap = $cryptocomApiClient->fetchSymbolMap();
            $trades = $cryptocomApiClient->fetchTrades($credential->getApiKey(), $apiSecret);
            $deposits = $cryptocomApiClient->fetchDepositHistory($credential->getApiKey(), $apiSecret);
            $withdrawals = $cryptocomApiClient->fetchWithdrawHistory($credential->getApiKey(), $apiSecret);
        } catch (\Throwable $e) {
            $credential->setLastSyncError($e->getMessage());
            $credentialRepository->save($credential, true);

            return $apiResponse->apiJsonResponseBadRequest($e->getMessage());
        }

        $summary = $importService->importFromApi($user, $mapper->getSourceName(), $mapper->map($trades, $deposits, $withdrawals, $symbolMap));

        $credential
            ->setLastSyncedAt(new \DateTimeImmutable())
            ->setLastSyncError(null)
        ;
        $credentialRepository->save($credential, true);

        return $apiResponse->apiJsonResponseCustom($summary);
    }

    #[Route('/disconnect', name: 'disconnect', options: ['expose' => true], methods: 'DELETE')]
    public function disconnect(CrCryptocomCredentialRepository $credentialRepository, ApiResponse $apiResponse): Response
    {
        $credential = $credentialRepository->findOneByUser($this->getUser());
        if ($credential !== null) {
            $credentialRepository->remove($credential, true);
        }

        return $apiResponse->apiJsonResponseSuccessful('Compte Crypto.com Exchange déconnecté.');
    }
}
