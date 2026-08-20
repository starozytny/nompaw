<?php

namespace App\Controller\InternApi\Cryptos;

use App\Entity\Crypto\CrBinanceCredential;
use App\Repository\Crypto\CrBinanceCredentialRepository;
use App\Service\Api\ApiResponse;
use App\Service\Crypto\BinanceApiClient;
use App\Service\Crypto\BinanceApiException;
use App\Service\Crypto\CredentialEncryptionService;
use App\Service\Crypto\CryptoImportService;
use App\Service\Crypto\Import\BinanceApiTransactionMapper;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Binance's GET /api/v3/myTrades has no "all pairs" mode — it requires a symbol. sync() works around this
 * by combining two symbol sources: auto-detection from the user's current non-zero balances (paired
 * against a fixed list of common quote assets) and CrBinanceCredential::manualSymbols, a user-maintained
 * list covering positions that were fully closed (bought then fully sold) and so no longer show up in the
 * balance-based detection.
 */
#[Route('/intern/api/cryptos/binance', name: 'intern_api_cryptos_binance_')]
class BinanceController extends AbstractController
{
    /** Quote assets tried against each held asset when auto-detecting tradeable pairs from balances. */
    private const QUOTE_ASSETS = ['USDT', 'EUR', 'FDUSD', 'BUSD', 'USDC', 'BNB', 'BTC'];

    #[Route('/status', name: 'status', options: ['expose' => true], methods: 'GET')]
    public function status(CrBinanceCredentialRepository $credentialRepository, ApiResponse $apiResponse): Response
    {
        $credential = $credentialRepository->findOneByUser($this->getUser());

        return $apiResponse->apiJsonResponseCustom([
            'connected' => $credential !== null,
            'apiKey' => $credential?->getApiKey(),
            'manualSymbols' => $credential?->getManualSymbols(),
            'connectedAt' => $credential?->getConnectedAt()?->format('c'),
            'lastSyncedAt' => $credential?->getLastSyncedAt()?->format('c'),
            'lastSyncError' => $credential?->getLastSyncError(),
        ]);
    }

    #[Route('/connect', name: 'connect', options: ['expose' => true], methods: 'POST')]
    public function connect(
        Request $request,
        CrBinanceCredentialRepository $credentialRepository,
        BinanceApiClient $binanceApiClient,
        CredentialEncryptionService $encryptionService,
        ApiResponse $apiResponse,
    ): Response {
        $payload = json_decode($request->getContent(), true);

        $apiKey = $payload['apiKey'] ?? null;
        $apiSecret = $payload['apiSecret'] ?? null;

        if (!is_string($apiKey) || !is_string($apiSecret) || $apiKey === '' || $apiSecret === '') {
            return $apiResponse->apiJsonResponseBadRequest("La clé API et la clé secrète sont toutes les deux requises.");
        }

        $manualSymbols = $this->sanitizeManualSymbols($payload['manualSymbols'] ?? null);
        if ($manualSymbols === false) {
            return $apiResponse->apiJsonResponseBadRequest("La liste de paires n'est pas valide : utilise des paires séparées par des virgules (ex: BTCUSDT,ETHUSDT).");
        }

        $connectionResult = $binanceApiClient->testConnection($apiKey, $apiSecret);
        if ($connectionResult !== true) {
            return $apiResponse->apiJsonResponseBadRequest($connectionResult);
        }

        $user = $this->getUser();
        $credential = $credentialRepository->findOneByUser($user) ?? (new CrBinanceCredential())
            ->setUser($user)
            ->setConnectedAt(new \DateTimeImmutable())
        ;

        $credential
            ->setApiKey($apiKey)
            ->setApiSecretEncrypted($encryptionService->encrypt($apiSecret))
            ->setManualSymbols($manualSymbols)
            ->setLastSyncError(null)
        ;

        $credentialRepository->save($credential, true);

        return $apiResponse->apiJsonResponseSuccessful('Compte Binance connecté.');
    }

    #[Route('/symbols', name: 'symbols', options: ['expose' => true], methods: 'PATCH')]
    public function symbols(
        Request $request,
        CrBinanceCredentialRepository $credentialRepository,
        ApiResponse $apiResponse,
    ): Response {
        $credential = $credentialRepository->findOneByUser($this->getUser());
        if ($credential === null) {
            return $apiResponse->apiJsonResponseBadRequest('Aucun compte Binance connecté.');
        }

        $payload = json_decode($request->getContent(), true);
        $manualSymbols = $this->sanitizeManualSymbols($payload['manualSymbols'] ?? null);
        if ($manualSymbols === false) {
            return $apiResponse->apiJsonResponseBadRequest("La liste de paires n'est pas valide : utilise des paires séparées par des virgules (ex: BTCUSDT,ETHUSDT).");
        }

        $credential->setManualSymbols($manualSymbols);
        $credentialRepository->save($credential, true);

        return $apiResponse->apiJsonResponseSuccessful('Liste de paires mise à jour.');
    }

    #[Route('/sync', name: 'sync', options: ['expose' => true], methods: 'POST')]
    public function sync(
        CrBinanceCredentialRepository $credentialRepository,
        BinanceApiClient $binanceApiClient,
        BinanceApiTransactionMapper $mapper,
        CredentialEncryptionService $encryptionService,
        CryptoImportService $importService,
        ApiResponse $apiResponse,
    ): Response {
        $user = $this->getUser();
        $credential = $credentialRepository->findOneByUser($user);
        if ($credential === null) {
            return $apiResponse->apiJsonResponseBadRequest('Aucun compte Binance connecté.');
        }

        $symbolWarnings = [];

        try {
            $apiSecret = $encryptionService->decrypt($credential->getApiSecretEncrypted());
            $symbolMap = $binanceApiClient->fetchSymbolMap();
            $balances = $binanceApiClient->fetchNonZeroBalances($credential->getApiKey(), $apiSecret);

            $symbols = $this->resolveSymbols($balances, $credential->getManualSymbols(), $symbolMap);

            $trades = [];
            foreach ($symbols as $symbol) {
                try {
                    $trades = array_merge($trades, $binanceApiClient->fetchMyTrades($credential->getApiKey(), $apiSecret, $symbol));
                } catch (BinanceApiException $e) {
                    $symbolWarnings[] = ['file' => $symbol, 'importedId' => null, 'message' => $e->getMessage()];
                }

                usleep(150_000); // Binance's request-weight limit is IP-wide; pace successive per-symbol calls
            }

            $deposits = $binanceApiClient->fetchDepositHistory($credential->getApiKey(), $apiSecret);
            $withdrawals = $binanceApiClient->fetchWithdrawHistory($credential->getApiKey(), $apiSecret);
        } catch (\Throwable $e) {
            $credential->setLastSyncError($e->getMessage());
            $credentialRepository->save($credential, true);

            return $apiResponse->apiJsonResponseBadRequest($e->getMessage());
        }

        $summary = $importService->importFromApi($user, $mapper->getSourceName(), $mapper->map($trades, $deposits, $withdrawals, $symbolMap));
        $summary['errors'] = array_merge($summary['errors'], $symbolWarnings);

        $credential
            ->setLastSyncedAt(new \DateTimeImmutable())
            ->setLastSyncError(null)
        ;
        $credentialRepository->save($credential, true);

        return $apiResponse->apiJsonResponseCustom($summary);
    }

    #[Route('/disconnect', name: 'disconnect', options: ['expose' => true], methods: 'DELETE')]
    public function disconnect(CrBinanceCredentialRepository $credentialRepository, ApiResponse $apiResponse): Response
    {
        $credential = $credentialRepository->findOneByUser($this->getUser());
        if ($credential !== null) {
            $credentialRepository->remove($credential, true);
        }

        return $apiResponse->apiJsonResponseSuccessful('Compte Binance déconnecté.');
    }

    /**
     * @param array<string, float> $balances asset => balance, as returned by fetchNonZeroBalances()
     * @param array<string, array{base: string, quote: string}> $symbolMap as returned by fetchSymbolMap()
     * @return list<string> deduplicated tradeable symbols to sync
     */
    private function resolveSymbols(array $balances, ?string $manualSymbolsRaw, array $symbolMap): array
    {
        $symbols = [];

        foreach (array_keys($balances) as $asset) {
            foreach (self::QUOTE_ASSETS as $quote) {
                if ($asset === $quote) {
                    continue;
                }

                foreach ([$asset . $quote, $quote . $asset] as $candidate) {
                    if (isset($symbolMap[$candidate])) {
                        $symbols[$candidate] = true;
                    }
                }
            }
        }

        foreach (explode(',', (string) $manualSymbolsRaw) as $manual) {
            $manual = strtoupper(trim($manual));
            if ($manual !== '' && isset($symbolMap[$manual])) {
                $symbols[$manual] = true;
            }
        }

        return array_keys($symbols);
    }

    /**
     * @return string|null|false the normalized comma-separated list, null if empty/absent, or false if malformed
     */
    private function sanitizeManualSymbols(mixed $raw): string|null|false
    {
        if ($raw === null || $raw === '') {
            return null;
        }

        if (!is_string($raw)) {
            return false;
        }

        $symbols = [];
        foreach (explode(',', $raw) as $part) {
            $symbol = strtoupper(trim($part));
            if ($symbol === '') {
                continue;
            }

            if (!preg_match('/^[A-Z0-9]{5,20}$/', $symbol)) {
                return false;
            }

            $symbols[$symbol] = true;
        }

        if (count($symbols) > 50) {
            return false;
        }

        return $symbols === [] ? null : implode(',', array_keys($symbols));
    }
}
