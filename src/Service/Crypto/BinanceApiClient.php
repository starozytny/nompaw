<?php

namespace App\Service\Crypto;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Talks to Binance's Spot REST API (api.binance.com) using a Binance API key pair, per Binance's signing
 * spec (https://binance-docs.github.io/apidocs/spot/en/#signed-endpoint-security-type):
 *   queryString = http_build_query(params incl. timestamp)
 *   signature   = hex(hmac_sha256(queryString, apiSecret))
 * appended as a 'signature' query param, with the key itself sent as the 'X-MBX-APIKEY' header. The
 * signature is computed over the exact query string sent on the wire (built and appended manually here,
 * not delegated to the HTTP client's own query serialization) so it can never drift from what Binance
 * receives — same precision concern as KrakenApiClient's raw postdata body.
 *
 * Unlike Kraken/Coinbase, Binance has no endpoint that returns every trade across every pair —
 * GET /api/v3/myTrades requires a 'symbol'. This client only fetches data given a symbol/asset list;
 * discovering which symbols to sync is BinanceController::sync()'s job.
 *
 * Two of Binance's own endpoints cap how much history a single call can return, so full-history sync
 * requires exhaustive pagination rather than one call:
 *   - GET /api/v3/myTrades only returns the most recent `limit` trades unless a `fromId` cursor is given
 *     (and `fromId` can't be combined with startTime/endTime) — fetchMyTrades() pages forward from
 *     fromId=0 until a page comes back short.
 *   - GET /sapi/v1/capital/{deposit/hisrec,withdraw/history} cap startTime..endTime at 90 days per call
 *     (undocumented on Binance's own page but enforced server-side — see
 *     https://github.com/ccxt/ccxt/issues/6495) and default to a recent window when omitted, so
 *     fetchDepositHistory()/fetchWithdrawHistory() walk 90-day windows back to Binance's launch.
 *
 * Never throws for a failed HTTP call from the public methods below other than via BinanceApiException,
 * whose message is safe to show the user — mirrors the never-throw philosophy of KrakenApiClient.
 */
class BinanceApiClient
{
    private const TRADES_PAGE_LIMIT = 1000;
    private const HISTORY_PAGE_LIMIT = 1000;

    /** Binance's capital history endpoints cap the startTime..endTime span at 90 days per call. */
    private const HISTORY_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

    /** 2017-01-01 UTC — safely before Binance launched (2017-07-14), used as the walk-back floor. */
    private const HISTORY_FLOOR_MS = 1_483_228_800_000;

    public function __construct(
        private readonly HttpClientInterface $binanceClient,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return bool|string true if the key works, or a human-readable error message
     */
    public function testConnection(string $apiKey, string $apiSecret): bool|string
    {
        try {
            $this->request('GET', '/api/v3/account', [], $apiKey, $apiSecret);

            return true;
        } catch (BinanceApiException $e) {
            return $e->getMessage();
        }
    }

    /**
     * @return array<string, float> asset => free+locked balance, for every asset with a non-zero balance
     *
     * @throws BinanceApiException
     */
    public function fetchNonZeroBalances(string $apiKey, string $apiSecret): array
    {
        $account = $this->request('GET', '/api/v3/account', [], $apiKey, $apiSecret);

        $balances = [];
        foreach ($account['balances'] ?? [] as $balance) {
            $total = (float) ($balance['free'] ?? 0) + (float) ($balance['locked'] ?? 0);
            if ($total > 0 && isset($balance['asset'])) {
                $balances[$balance['asset']] = $total;
            }
        }

        return $balances;
    }

    /**
     * Public endpoint (no signing needed) listing every spot symbol with its base/quote asset — used to
     * validate candidate pairs (auto-detected or manually entered) and to split a Binance trade's 'symbol'
     * back into the two coins BinanceApiTransactionMapper needs.
     *
     * @return array<string, array{base: string, quote: string}> symbol => base/quote asset codes
     *
     * @throws BinanceApiException
     */
    public function fetchSymbolMap(): array
    {
        $data = $this->publicRequest('/api/v3/exchangeInfo');

        $map = [];
        foreach ($data['symbols'] ?? [] as $symbol) {
            if (isset($symbol['symbol'], $symbol['baseAsset'], $symbol['quoteAsset'])) {
                $map[$symbol['symbol']] = ['base' => $symbol['baseAsset'], 'quote' => $symbol['quoteAsset']];
            }
        }

        return $map;
    }

    /**
     * Pages forward through every trade on this symbol via the `fromId` cursor (not time-bounded, so this
     * always returns the full history for the pair, not just the most recent 1000).
     *
     * @return list<array<string, mixed>>
     *
     * @throws BinanceApiException
     */
    public function fetchMyTrades(string $apiKey, string $apiSecret, string $symbol): array
    {
        $trades = [];
        $fromId = 0;

        do {
            $batch = $this->request('GET', '/api/v3/myTrades', [
                'symbol' => $symbol,
                'fromId' => $fromId,
                'limit' => self::TRADES_PAGE_LIMIT,
            ], $apiKey, $apiSecret);

            $trades = array_merge($trades, $batch);

            $hasMore = count($batch) >= self::TRADES_PAGE_LIMIT;
            if ($hasMore) {
                $lastTrade = end($batch);
                $fromId = (int) $lastTrade['id'] + 1;
                usleep(200_000); // stay well under the per-IP request-weight limit
            }
        } while ($hasMore);

        return $trades;
    }

    /**
     * @return list<array<string, mixed>>
     *
     * @throws BinanceApiException
     */
    public function fetchDepositHistory(string $apiKey, string $apiSecret): array
    {
        return $this->fetchWindowedHistory('/sapi/v1/capital/deposit/hisrec', $apiKey, $apiSecret);
    }

    /**
     * @return list<array<string, mixed>>
     *
     * @throws BinanceApiException
     */
    public function fetchWithdrawHistory(string $apiKey, string $apiSecret): array
    {
        return $this->fetchWindowedHistory('/sapi/v1/capital/withdraw/history', $apiKey, $apiSecret);
    }

    /**
     * Walks 90-day startTime/endTime windows backward from now to HISTORY_FLOOR_MS, since Binance caps the
     * span of a single call and defaults to a recent-only window when no bounds are given at all.
     *
     * @return list<array<string, mixed>>
     *
     * @throws BinanceApiException
     */
    private function fetchWindowedHistory(string $path, string $apiKey, string $apiSecret): array
    {
        $items = [];
        $endTime = (int) round(microtime(true) * 1000);

        while ($endTime > self::HISTORY_FLOOR_MS) {
            $startTime = max(self::HISTORY_FLOOR_MS, $endTime - self::HISTORY_WINDOW_MS);

            $batch = $this->request('GET', $path, [
                'startTime' => $startTime,
                'endTime' => $endTime,
                'limit' => self::HISTORY_PAGE_LIMIT,
            ], $apiKey, $apiSecret);

            $items = array_merge($items, $batch);
            $endTime = $startTime - 1;
        }

        return $items;
    }

    /**
     * @throws BinanceApiException
     */
    private function request(string $method, string $path, array $params, string $apiKey, string $apiSecret): array
    {
        $params['timestamp'] = (int) round(microtime(true) * 1000);
        $params['recvWindow'] = 10000;
        $queryString = http_build_query($params, '', '&');
        $signature = hash_hmac('sha256', $queryString, $apiSecret);

        try {
            $response = $this->binanceClient->request($method, $path . '?' . $queryString . '&signature=' . $signature, [
                'headers' => ['X-MBX-APIKEY' => $apiKey],
            ]);

            $status = $response->getStatusCode();
            $data = $response->toArray(false);
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Binance API: appel {path} échoué : {message}', [
                'path' => $path,
                'message' => $e->getMessage(),
            ]);

            throw new BinanceApiException('Impossible de contacter Binance, réessaie plus tard.');
        }

        if ($status >= 400) {
            $message = $data['msg'] ?? "Erreur HTTP {$status}";

            throw new BinanceApiException("Binance a refusé la requête : {$message}");
        }

        return $data;
    }

    /**
     * @throws BinanceApiException
     */
    private function publicRequest(string $path): array
    {
        try {
            return $this->binanceClient->request('GET', $path)->toArray(false);
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Binance API: appel public {path} échoué : {message}', [
                'path' => $path,
                'message' => $e->getMessage(),
            ]);

            throw new BinanceApiException('Impossible de contacter Binance, réessaie plus tard.');
        }
    }
}
