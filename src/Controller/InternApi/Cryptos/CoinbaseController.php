<?php

namespace App\Controller\InternApi\Cryptos;

use App\Entity\Crypto\CrCoinbaseCredential;
use App\Repository\Crypto\CrCoinbaseCredentialRepository;
use App\Service\Api\ApiResponse;
use App\Service\Crypto\CoinbaseApiClient;
use App\Service\Crypto\CredentialEncryptionService;
use App\Service\Crypto\CryptoImportService;
use App\Service\Crypto\Import\CoinbaseApiTransactionMapper;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cryptos/coinbase', name: 'intern_api_cryptos_coinbase_')]
class CoinbaseController extends AbstractController
{
    #[Route('/status', name: 'status', options: ['expose' => true], methods: 'GET')]
    public function status(CrCoinbaseCredentialRepository $credentialRepository, ApiResponse $apiResponse): Response
    {
        $credential = $credentialRepository->findOneByUser($this->getUser());

        return $apiResponse->apiJsonResponseCustom([
            'connected' => $credential !== null,
            'keyName' => $credential?->getKeyName(),
            'connectedAt' => $credential?->getConnectedAt()?->format('c'),
            'lastSyncedAt' => $credential?->getLastSyncedAt()?->format('c'),
            'lastSyncError' => $credential?->getLastSyncError(),
        ]);
    }

    #[Route('/connect', name: 'connect', options: ['expose' => true], methods: 'POST')]
    public function connect(
        Request $request,
        CrCoinbaseCredentialRepository $credentialRepository,
        CoinbaseApiClient $coinbaseApiClient,
        CredentialEncryptionService $encryptionService,
        ApiResponse $apiResponse,
        LoggerInterface $logger,
    ): Response {
        $payload = json_decode($request->getContent(), true);
        $keyJson = json_decode($payload['keyJson'] ?? '', true);

        $keyName = $keyJson['name'] ?? null;
        $privateKey = $keyJson['privateKey'] ?? null;

        if (!is_string($keyName) || !is_string($privateKey) || $keyName === '' || $privateKey === '') {
            return $apiResponse->apiJsonResponseBadRequest("Le JSON collé ne contient pas les champs \"name\" et \"privateKey\" attendus.");
        }

        try {
            $connectionResult = $coinbaseApiClient->testConnection($keyName, $privateKey);
            if ($connectionResult !== true) {
                return $apiResponse->apiJsonResponseBadRequest($connectionResult);
            }

            $user = $this->getUser();
            $credential = $credentialRepository->findOneByUser($user) ?? (new CrCoinbaseCredential())
                ->setUser($user)
                ->setConnectedAt(new \DateTimeImmutable())
            ;

            $credential
                ->setKeyName($keyName)
                ->setPrivateKeyEncrypted($encryptionService->encrypt($privateKey))
                ->setLastSyncError(null)
            ;

            $credentialRepository->save($credential, true);
        } catch (\Throwable $e) {
            $logger->error('Coinbase connect: échec pour l\'utilisateur {userId} : {message}', [
                'userId' => $this->getUser()?->getId(),
                'keyName' => $keyName,
                'exception' => $e,
                'message' => $e->getMessage(),
            ]);

            return $apiResponse->apiJsonResponseBadRequest('Impossible de connecter le compte Coinbase : ' . $e->getMessage());
        }

        return $apiResponse->apiJsonResponseSuccessful('Compte Coinbase connecté.');
    }

    #[Route('/sync', name: 'sync', options: ['expose' => true], methods: 'POST')]
    public function sync(
        CrCoinbaseCredentialRepository $credentialRepository,
        CoinbaseApiClient $coinbaseApiClient,
        CoinbaseApiTransactionMapper $mapper,
        CredentialEncryptionService $encryptionService,
        CryptoImportService $importService,
        ApiResponse $apiResponse,
    ): Response {
        $user = $this->getUser();
        $credential = $credentialRepository->findOneByUser($user);
        if ($credential === null) {
            return $apiResponse->apiJsonResponseBadRequest('Aucun compte Coinbase connecté.');
        }

        try {
            $privateKey = $encryptionService->decrypt($credential->getPrivateKeyEncrypted());
            $transactions = $coinbaseApiClient->fetchTransactions($credential->getKeyName(), $privateKey);
        } catch (\Throwable $e) {
            $credential->setLastSyncError($e->getMessage());
            $credentialRepository->save($credential, true);

            return $apiResponse->apiJsonResponseBadRequest($e->getMessage());
        }

        $summary = $importService->importFromApi($user, $mapper->getSourceName(), $mapper->map($transactions));

        $credential
            ->setLastSyncedAt(new \DateTimeImmutable())
            ->setLastSyncError(null)
        ;
        $credentialRepository->save($credential, true);

        return $apiResponse->apiJsonResponseCustom($summary);
    }

    #[Route('/disconnect', name: 'disconnect', options: ['expose' => true], methods: 'DELETE')]
    public function disconnect(CrCoinbaseCredentialRepository $credentialRepository, ApiResponse $apiResponse): Response
    {
        $credential = $credentialRepository->findOneByUser($this->getUser());
        if ($credential !== null) {
            $credentialRepository->remove($credential, true);
        }

        return $apiResponse->apiJsonResponseSuccessful('Compte Coinbase déconnecté.');
    }
}
