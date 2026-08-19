<?php

namespace App\Service\Crypto;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Talks to the Crypto.com Exchange API v1 (api.crypto.com/exchange/v1), which — unlike Kraken/Coinbase/
 * Binance's per-resource REST paths — is JSON-RPC-shaped: every private call is a POST to a path equal to
 * its own method name (e.g. 'private/get-trades'), with the method repeated inside the JSON body alongside
 * 'id'/'api_key'/'params'/'nonce'/'sig', per the official signing spec
 * (https://exchange-developer.crypto.com/exchange/v1/docs/api/rest-common-api-reference):
 *   paramString = params sorted by key ascending, concatenated as key+value (no separators)
 *   sig         = hex(hmac_sha256(method + id + apiKey + paramString + nonce, apiSecret))
 * 'id' and 'nonce' are sent as JSON strings (their own docs say "all numbers must be strings", but in
 * practice only id/nonce actually need to be — sending integer params like 'limit' as a quoted string
 * trips their int32 validation with a generic "Invalid limit" (code 40003); reference implementations
 * (e.g. ccxt) send every other param in its natural JSON type, which is what this client does too).
 *
 * Unlike Binance, GET /private/get-trades has no per-symbol requirement — 'instrument_name' is optional
 * ("Omit for 'all'") — so this client never needs to discover which pairs to sync; it just pages through
 * time (get-trades) or page number (deposit/withdrawal history) until a request returns fewer than a full
 * page. get-trades is rate-limited to 1 request/second (per the API's own published limits), hence the
 * pacing sleep between pages.
 *
 * Never throws for a failed HTTP call from the public methods below other than via CryptocomApiException,
 * whose message is safe to show the user — mirrors the never-throw philosophy of KrakenApiClient.
 */
class CryptocomApiClient
{
    private const TRADES_PAGE_LIMIT = 100;
    private const HISTORY_PAGE_SIZE = 200;

    /**
     * Crypto.com only retains transaction history for 6 months ("History will be stored for recent 6
     * months record only" per their docs), and start_time/start_ts must be a plausible timestamp — passing
     * 0 is rejected outright ("invalid start_time") rather than treated as "since the beginning". Using
     * this as the lower bound is therefore both safe (never excludes real history) and valid.
     */
    private const RETENTION_WINDOW_MS = 180 * 24 * 60 * 60 * 1000;

    public function __construct(
        private readonly HttpClientInterface $cryptocomClient,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return bool|string true if the key works, or a human-readable error message
     */
    public function testConnection(string $apiKey, string $apiSecret): bool|string
    {
        try {
            $this->request('private/user-balance', [], $apiKey, $apiSecret);

            return true;
        } catch (CryptocomApiException $e) {
            return $e->getMessage();
        }
    }

    /**
     * Public endpoint (no signing needed) listing every instrument with its base/quote currency — used to
     * split a Crypto.com trade's 'instrument_name' back into the two coins CryptocomApiTransactionMapper
     * needs.
     *
     * @return array<string, array{base: string, quote: string}> symbol => base/quote currency codes
     *
     * @throws CryptocomApiException
     */
    public function fetchSymbolMap(): array
    {
        $result = $this->publicRequest('public/get-instruments');

        $map = [];
        foreach ($result['data'] ?? [] as $instrument) {
            if (isset($instrument['symbol'], $instrument['base_ccy'], $instrument['quote_ccy'])) {
                $map[$instrument['symbol']] = ['base' => $instrument['base_ccy'], 'quote' => $instrument['quote_ccy']];
            }
        }

        return $map;
    }

    /**
     * Fetches every executed trade across every instrument, paging backwards in time (end_time narrowed to
     * the oldest trade seen in each page) since private/get-trades caps each response at 100 rows.
     *
     * @return list<array<string, mixed>>
     *
     * @throws CryptocomApiException
     */
    public function fetchTrades(string $apiKey, string $apiSecret): array
    {
        $trades = [];
        $seenIds = [];
        $endTime = (int) round(microtime(true) * 1000);
        $earliestTime = $endTime - self::RETENTION_WINDOW_MS;

        do {
            $result = $this->request('private/get-trades', [
                'start_time' => $earliestTime,
                'end_time' => $endTime,
                'limit' => self::TRADES_PAGE_LIMIT,
            ], $apiKey, $apiSecret);

            $batch = $result['data'] ?? [];
            $oldestTime = null;

            foreach ($batch as $trade) {
                $tradeId = $trade['trade_id'] ?? null;
                if ($tradeId !== null && !isset($seenIds[$tradeId])) {
                    $seenIds[$tradeId] = true;
                    $trades[] = $trade;
                }

                $createTime = (int) ($trade['create_time'] ?? 0);
                if ($oldestTime === null || $createTime < $oldestTime) {
                    $oldestTime = $createTime;
                }
            }

            $hasMore = count($batch) >= self::TRADES_PAGE_LIMIT && $oldestTime !== null && $oldestTime < $endTime && $oldestTime > $earliestTime;
            if ($hasMore) {
                usleep(1_000_000); // private/get-trades is rate-limited to 1 request/second
                $endTime = $oldestTime; // end_time is exclusive, so the next page stops strictly before this trade
            }
        } while ($hasMore);

        return $trades;
    }

    /**
     * @return list<array<string, mixed>>
     *
     * @throws CryptocomApiException
     */
    public function fetchDepositHistory(string $apiKey, string $apiSecret): array
    {
        return $this->fetchPaginatedHistory('private/get-deposit-history', 'deposit_list', $apiKey, $apiSecret);
    }

    /**
     * @return list<array<string, mixed>>
     *
     * @throws CryptocomApiException
     */
    public function fetchWithdrawHistory(string $apiKey, string $apiSecret): array
    {
        return $this->fetchPaginatedHistory('private/get-withdrawal-history', 'withdrawal_list', $apiKey, $apiSecret);
    }

    /**
     * @return list<array<string, mixed>>
     *
     * @throws CryptocomApiException
     */
    private function fetchPaginatedHistory(string $method, string $listKey, string $apiKey, string $apiSecret): array
    {
        $items = [];
        $page = 0;
        $endTs = (int) round(microtime(true) * 1000);
        $startTs = $endTs - self::RETENTION_WINDOW_MS;

        do {
            $result = $this->request($method, [
                'start_ts' => $startTs,
                'end_ts' => $endTs,
                'page_size' => self::HISTORY_PAGE_SIZE,
                'page' => $page,
            ], $apiKey, $apiSecret);

            $batch = $result[$listKey] ?? [];
            $items = array_merge($items, $batch);
            $page++;
        } while (count($batch) >= self::HISTORY_PAGE_SIZE);

        return $items;
    }

    /**
     * @throws CryptocomApiException
     */
    private function request(string $method, array $params, string $apiKey, string $apiSecret): array
    {
        // id and nonce share the same millisecond timestamp, matching the reference ccxt implementation
        $id = (string) ((int) round(microtime(true) * 1000));
        $nonce = $id;

        $sorted = $params;
        ksort($sorted);
        $paramString = '';
        foreach ($sorted as $key => $value) {
            $paramString .= $key . (is_bool($value) ? ($value ? 'true' : 'false') : (string) $value);
        }

        $signature = hash_hmac('sha256', $method . $id . $apiKey . $paramString . $nonce, $apiSecret);

        $body = [
            'id' => $id,
            'method' => $method,
            'api_key' => $apiKey,
            'params' => (object) $params,
            'nonce' => $nonce,
            'sig' => $signature,
        ];

        try {
            $response = $this->cryptocomClient->request('POST', $method, ['json' => $body]);

            $status = $response->getStatusCode();
            $data = $response->toArray(false);
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Crypto.com API: appel {method} échoué : {message}', [
                'method' => $method,
                'message' => $e->getMessage(),
            ]);

            throw new CryptocomApiException('Impossible de contacter Crypto.com, réessaie plus tard.');
        }

        $code = (int) ($data['code'] ?? -1);
        if ($status >= 400 || $code !== 0) {
            $message = $data['message'] ?? "Erreur HTTP {$status}";

            throw new CryptocomApiException("Crypto.com a refusé la requête : {$message}");
        }

        return $data['result'] ?? [];
    }

    /**
     * @throws CryptocomApiException
     */
    private function publicRequest(string $method): array
    {
        try {
            $response = $this->cryptocomClient->request('GET', $method);

            $status = $response->getStatusCode();
            $data = $response->toArray(false);
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Crypto.com API: appel public {method} échoué : {message}', [
                'method' => $method,
                'message' => $e->getMessage(),
            ]);

            throw new CryptocomApiException('Impossible de contacter Crypto.com, réessaie plus tard.');
        }

        $code = (int) ($data['code'] ?? -1);
        if ($status >= 400 || $code !== 0) {
            throw new CryptocomApiException('Impossible de contacter Crypto.com, réessaie plus tard.');
        }

        return $data['result'] ?? [];
    }
}
