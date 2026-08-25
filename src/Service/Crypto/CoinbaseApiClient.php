<?php

namespace App\Service\Crypto;

use Firebase\JWT\JWT;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Talks to Coinbase's v2 "App API" (api.coinbase.com/v2/*) using a Coinbase Developer Platform (CDP) API
 * key: a key name ("organizations/{org}/apiKeys/{id}") plus a private key, used to sign a short-lived JWT
 * per request (uri claim = "METHOD host/path", no query string; JWT valid 120s; nonce + kid in the
 * header; aud: ['cdp_service']).
 *
 * The CDP portal currently issues two different private key shapes depending on the key type chosen at
 * creation time, and there's no separate flag telling you which one you got — only the string shape:
 *   - "Secret API Key" (Ed25519, the current default): a bare base64 string (no PEM wrapper), decoding to
 *     64 bytes (32-byte seed + 32-byte public key) — signed as EdDSA.
 *   - Legacy/"Wallet Secret" (EC): a PEM string ("-----BEGIN EC PRIVATE KEY-----...") — signed as ES256.
 * buildJwt() detects which one it got by checking for the PEM header.
 *
 * Never throws for a failed HTTP call from the public methods below other than via CoinbaseApiException,
 * whose message is safe to show the user — mirrors the never-throw philosophy of CrPriceService.
 */
class CoinbaseApiClient
{
    private const HOST = 'api.coinbase.com';
    private const CB_VERSION = '2024-01-01';

    public function __construct(
        private readonly HttpClientInterface $coinbaseClient,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return bool|string true if the key works, or a human-readable error message
     */
    public function testConnection(string $keyName, string $privateKey): bool|string
    {
        try {
            $this->request('GET', '/v2/user', $keyName, $privateKey);

            return true;
        } catch (CoinbaseApiException $e) {
            return $e->getMessage();
        }
    }

    /**
     * type => plural path segment of the sub-resource that carries the subtotal/fee/total breakdown,
     * for every Coinbase transaction type whose top-level 'amount' alone isn't enough to build a CrTrade.
     */
    private const DETAIL_ENDPOINTS = [
        'buy' => 'buys',
        'sell' => 'sells',
        'fiat_deposit' => 'deposits',
        'fiat_withdrawal' => 'withdrawals',
    ];

    /**
     * Fetches every transaction across every Coinbase account/wallet for this key. Buy/sell/fiat_deposit/
     * fiat_withdrawal transactions are enriched with their linked sub-resource ('detail': subtotal/fee/
     * total), which CoinbaseApiTransactionMapper needs to build a CrTrade with the SEPA/card fee Coinbase
     * charges on those, instead of silently reporting costPrice 0.
     *
     * @return list<array<string, mixed>>
     *
     * @throws CoinbaseApiException
     */
    public function fetchTransactions(string $keyName, string $privateKey): array
    {
        $transactions = [];

        foreach ($this->fetchAllPages('/v2/accounts', $keyName, $privateKey) as $account) {
            $accountId = $account['id'];

            foreach ($this->fetchAllPages("/v2/accounts/{$accountId}/transactions", $keyName, $privateKey) as $transaction) {
                $type = $transaction['type'] ?? null;
                if (isset(self::DETAIL_ENDPOINTS[$type])) {
                    $transaction['detail'] = $this->fetchDetail($accountId, $type, $transaction, $keyName, $privateKey);
                }

                $transactions[] = $transaction;
            }
        }

        return $transactions;
    }

    private function fetchDetail(string $accountId, string $type, array $transaction, string $keyName, string $privateKey): ?array
    {
        $subResourceId = $transaction[$type]['id'] ?? null;
        if ($subResourceId === null) {
            return null;
        }

        $endpoint = self::DETAIL_ENDPOINTS[$type];

        try {
            $response = $this->request('GET', "/v2/accounts/{$accountId}/{$endpoint}/{$subResourceId}", $keyName, $privateKey);

            return $response['data'] ?? null;
        } catch (CoinbaseApiException $e) {
            $this->logger->warning('Coinbase API: échec récupération détail {type} {id} : {message}', [
                'type' => $type,
                'id' => $subResourceId,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * @return list<array<string, mixed>>
     *
     * @throws CoinbaseApiException
     */
    private function fetchAllPages(string $path, string $keyName, string $privateKey): array
    {
        $items = [];
        $nextUri = $path;

        while ($nextUri !== null) {
            $response = $this->request('GET', $nextUri, $keyName, $privateKey);
            $items = array_merge($items, $response['data'] ?? []);
            $nextUri = $response['pagination']['next_uri'] ?? null;
        }

        return $items;
    }

    /**
     * @throws CoinbaseApiException
     */
    private function request(string $method, string $path, string $keyName, string $privateKey): array
    {
        try {
            $jwt = $this->buildJwt($method, $path, $keyName, $privateKey);
        } catch (\Throwable $e) {
            $this->logger->warning('Coinbase API: échec de signature du JWT : {message}', ['message' => $e->getMessage()]);

            throw new CoinbaseApiException('Clé privée Coinbase illisible : vérifie que tu as bien copié tout le champ "privateKey" du JSON téléchargé.');
        }

        try {
            $response = $this->coinbaseClient->request($method, $path, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $jwt,
                    'CB-VERSION' => self::CB_VERSION,
                ],
            ]);

            $status = $response->getStatusCode();
            $data = $response->toArray(false);

            if ($status >= 400) {
                $message = $data['errors'][0]['message'] ?? $data['error_description'] ?? "Erreur HTTP {$status}";

                throw new CoinbaseApiException("Coinbase a refusé la requête : {$message}");
            }

            return $data;
        } catch (CoinbaseApiException $e) {
            throw $e;
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Coinbase API: appel {method} {path} échoué : {message}', [
                'method' => $method,
                'path' => $path,
                'message' => $e->getMessage(),
            ]);

            throw new CoinbaseApiException('Impossible de contacter Coinbase, réessaie plus tard.');
        }
    }

    private function buildJwt(string $method, string $path, string $keyName, string $privateKey): string
    {
        $requestPath = parse_url($path, PHP_URL_PATH) ?: $path;

        $payload = [
            'sub' => $keyName,
            'iss' => 'cdp',
            'aud' => ['cdp_service'],
            'nbf' => time(),
            'exp' => time() + 120,
            'uri' => sprintf('%s %s%s', $method, self::HOST, $requestPath),
        ];

        $alg = str_starts_with(trim($privateKey), '-----BEGIN') ? 'ES256' : 'EdDSA';

        return JWT::encode($payload, $privateKey, $alg, $keyName, ['nonce' => bin2hex(random_bytes(16))]);
    }
}
