<?php

namespace App\Service\Crypto;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Talks to Kraken's private REST API (api.kraken.com/0/private/*) using a Kraken API key pair, per
 * Kraken's official signing spec (https://docs.kraken.com/api/docs/guides/spot-rest-auth):
 *   postdata  = http_build_query(params incl. nonce)
 *   message   = path . sha256(nonce . postdata)
 *   API-Sign  = base64(hmac_sha512(base64_decode(apiSecret), message))
 * sent as the 'API-Key' / 'API-Sign' headers on a POST with the same postdata as the body.
 *
 * Never throws for a failed HTTP call from the public methods below other than via KrakenApiException,
 * whose message is safe to show the user — mirrors the never-throw philosophy of CrPriceService /
 * CoinbaseApiClient.
 */
class KrakenApiClient
{
    private const LEDGERS_PAGE_SIZE = 50;

    public function __construct(
        private readonly HttpClientInterface $krakenClient,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return bool|string true if the key works, or a human-readable error message
     */
    public function testConnection(string $apiKey, string $apiSecret): bool|string
    {
        try {
            $this->request('/0/private/Balance', [], $apiKey, $apiSecret);

            return true;
        } catch (KrakenApiException $e) {
            return $e->getMessage();
        }
    }

    /**
     * Fetches every ledger entry (trades, deposits, withdrawals, transfers, staking...) for this key,
     * paginated via 'ofs'. Each entry gets a 'txid' key added (the ledger id, which is the dict key in
     * Kraken's raw response) so it lines up with the shape KrakenApiTransactionMapper expects — the same
     * refid/type/subtype/asset/amount/fee columns as the Kraken "ledgers" CSV export KrakenParser reads.
     *
     * @return list<array<string, mixed>>
     *
     * @throws KrakenApiException
     */
    public function fetchLedgerEntries(string $apiKey, string $apiSecret): array
    {
        $entries = [];
        $ofs = 0;

        do {
            $result = $this->request('/0/private/Ledgers', ['ofs' => $ofs], $apiKey, $apiSecret);

            $ledger = $result['ledger'] ?? [];
            foreach ($ledger as $id => $entry) {
                $entry['txid'] = $id;
                $entries[] = $entry;
            }

            $count = (int) ($result['count'] ?? 0);
            $ofs += count($ledger);

            if (count($ledger) > 0 && $ofs < $count) {
                usleep(1_000_000); // Kraken's API counter is limited; pace successive pages
            }
        } while (count($ledger) > 0 && $ofs < $count);

        return $entries;
    }

    /**
     * @throws KrakenApiException
     */
    private function request(string $path, array $params, string $apiKey, string $apiSecret): array
    {
        $params['nonce'] = $this->nextNonce();
        $postdata = http_build_query($params, '', '&');

        $sha256 = hash('sha256', $params['nonce'] . $postdata, true);
        $signature = base64_encode(hash_hmac('sha512', $path . $sha256, base64_decode($apiSecret), true));

        try {
            $response = $this->krakenClient->request('POST', $path, [
                'headers' => [
                    'API-Key' => $apiKey,
                    'API-Sign' => $signature,
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'body' => $postdata,
            ]);

            $data = $response->toArray(false);
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Kraken API: appel {path} échoué : {message}', [
                'path' => $path,
                'message' => $e->getMessage(),
            ]);

            throw new KrakenApiException('Impossible de contacter Kraken, réessaie plus tard.');
        }

        if (!empty($data['error'])) {
            throw new KrakenApiException('Kraken a refusé la requête : ' . implode(', ', $data['error']));
        }

        return $data['result'] ?? [];
    }

    private function nextNonce(): string
    {
        static $last = 0;

        $now = (int) (microtime(true) * 1_000_000);
        $nonce = $now > $last ? $now : $last + 1;
        $last = $nonce;

        return (string) $nonce;
    }
}
