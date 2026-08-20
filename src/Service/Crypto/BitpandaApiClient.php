<?php

namespace App\Service\Crypto;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Talks to Bitpanda's public API (api.public.bitpanda.com/v1) using a personal API key, sent as the
 * 'x-api-key' header (confirmed directly from Bitpanda's interactive API docs — NOT 'Authorization:
 * Bearer', which several third-party write-ups suggested but is wrong for this API).
 *
 * GET /operations is a single unified, cursor-paginated feed of every operation (trades, deposits,
 * withdrawals, staking, asset mergers...). Confirmed from a real response (logged during development):
 * each item is {operation_id, operation_type, transactions: [...]}, and each entry in `transactions[]`
 * carries either a `currency_id` (fiat) or `asset_id` (crypto) UUID — never both — plus `asset_amount`,
 * `fee_amount`, `flow` (INCOMING/OUTGOING), `credited_at`, and for actual trade legs a `transaction_type`
 * (buy/sell) and a nested `trade` object (`trade_id`, `fee`, rates) shared by the two legs of the same
 * trade. GET /assets and /currencies resolve those UUIDs to tickers.
 *
 * Never throws for a failed HTTP call from the public methods below other than via BitpandaApiException,
 * whose message is safe to show the user — mirrors the never-throw philosophy of the other exchange
 * clients.
 */
class BitpandaApiClient
{
    private const PAGE_SIZE = 100;

    public function __construct(
        private readonly HttpClientInterface $bitpandaClient,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return bool|string true if the key works, or a human-readable error message
     */
    public function testConnection(string $apiKey): bool|string
    {
        try {
            $this->request('operations', ['page_size' => 1], $apiKey);

            return true;
        } catch (BitpandaApiException $e) {
            return $e->getMessage();
        }
    }

    /**
     * Fetches every raw operation for this key, paginating via the opaque 'cursor' the API hands back
     * (never constructed client-side).
     *
     * @return list<array<string, mixed>>
     *
     * @throws BitpandaApiException
     */
    public function fetchOperations(string $apiKey): array
    {
        return $this->paginate('operations', $apiKey);
    }

    /**
     * Builds a UUID => ticker map from /assets (crypto) and /currencies (fiat), used to resolve the
     * currency_id/asset_id on each operation leg into something CrTrade can store. Never throws: if
     * either reference list can't be fetched, resolution just falls back to the raw UUID for that entry
     * (which then fails CrTrade's length validation and surfaces as a reported error rather than
     * silently storing a wrong ticker — see BitpandaApiTransactionMapper).
     *
     * @return array<string, string> uuid => ticker symbol
     */
    public function fetchAssetSymbols(string $apiKey): array
    {
        $map = [];

        foreach (['assets', 'currencies'] as $path) {
            try {
                foreach ($this->paginate($path, $apiKey) as $item) {
                    $id = $item['id'] ?? null;
                    $symbol = $item['symbol'] ?? $item['code'] ?? null;
                    if ($id !== null && $symbol !== null) {
                        $map[$id] = $symbol;
                    }
                }
            } catch (BitpandaApiException $e) {
                $this->logger->warning('Bitpanda API: échec de récupération de {path} (résolution des tickers dégradée) : {message}', [
                    'path' => $path,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return $map;
    }

    /**
     * @return list<array<string, mixed>>
     *
     * @throws BitpandaApiException
     */
    private function paginate(string $path, string $apiKey): array
    {
        $items = [];
        $cursor = null;

        do {
            $params = ['page_size' => self::PAGE_SIZE];
            if ($cursor !== null) {
                $params['cursor'] = $cursor;
            }

            $result = $this->request($path, $params, $apiKey);

            foreach ($result['data'] ?? [] as $item) {
                $items[] = $item;
            }

            $hasNext = (bool) ($result['has_next_page'] ?? false);
            $cursor = $result['next_cursor'] ?? null;
        } while ($hasNext && $cursor !== null);

        return $items;
    }

    /**
     * @throws BitpandaApiException
     */
    private function request(string $path, array $params, string $apiKey): array
    {
        try {
            $response = $this->bitpandaClient->request('GET', $path, [
                'headers' => ['x-api-key' => $apiKey],
                'query' => $params,
            ]);

            $status = $response->getStatusCode();
            $data = $response->toArray(false);

            if ($status >= 400) {
                $message = $data['error'] ?? $data['message'] ?? "Erreur HTTP {$status}";

                throw new BitpandaApiException("Bitpanda a refusé la requête : {$message}");
            }

            return $data;
        } catch (BitpandaApiException $e) {
            throw $e;
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Bitpanda API: appel /{path} échoué : {message}', ['path' => $path, 'message' => $e->getMessage()]);

            throw new BitpandaApiException('Impossible de contacter Bitpanda, réessaie plus tard.');
        }
    }
}
