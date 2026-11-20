<?php

namespace App\Service\Garmin;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Talks to Garmin Connect's "Personal API" (developer.garmin.com/gc-developer-program/personal/) using a
 * personal API key created in Garmin Connect (Paramètres > Personal API Token, see GARMIN_API_KEY in
 * .env.local). The key itself is long-lived — its own expiration is chosen at creation — but every call
 * needs a short-lived access token obtained by exchanging it; that token is cached and refreshed
 * transparently here.
 *
 * Never throws for a failed HTTP call from the public methods below other than via GarminApiException,
 * whose message is safe to show the user — mirrors the Crypto exchange clients (KrakenApiClient etc.).
 */
class GarminApiClient
{
    private const TOKEN_CACHE_KEY = 'garmin_personal_api_access_token';
    private const TOKEN_TTL_FALLBACK = 1200; // seconds, used if the token response carries no usable expiry

    public function __construct(
        private readonly HttpClientInterface $garminTokenClient,
        private readonly HttpClientInterface $garminClient,
        private readonly CacheInterface $cache,
        private readonly string $garminApiKey,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return list<array<string, mixed>> raw Garmin activity-summary objects
     *
     * @throws GarminApiException
     */
    public function fetchActivitySummaries(string $fromDate, string $untilDate): array
    {
        $data = $this->request('/activitylist-service/activities/search/activities', [
            'startDate' => $fromDate,
            'endDate' => $untilDate,
            'start' => 0,
            'limit' => 200,
        ]);

        return array_is_list($data) ? $data : [];
    }

    /**
     * @return list<array<string, mixed>> raw Garmin daily-weight-summary objects
     *
     * @throws GarminApiException
     */
    public function fetchWeights(string $startDate, string $endDate): array
    {
        $data = $this->request('/weight-service/weight/range/' . $startDate . '/' . $endDate);

        return array_is_list($data) ? $data : ($data['dailyWeightSummaries'] ?? []);
    }

    /**
     * @throws GarminApiException
     */
    private function request(string $path, array $query = []): array
    {
        $token = $this->getAccessToken();
        $options = ['headers' => ['Authorization' => 'Bearer ' . $token]];
        if ($query) {
            $options['query'] = $query;
        }

        try {
            $response = $this->garminClient->request('GET', $path, $options);

            if ($response->getStatusCode() === 401) {
                // the cached token may have just expired — refresh once and retry
                $this->cache->delete(self::TOKEN_CACHE_KEY);
                $options['headers']['Authorization'] = 'Bearer ' . $this->getAccessToken();
                $response = $this->garminClient->request('GET', $path, $options);
            }

            return $response->toArray(false);
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Garmin API: appel {path} échoué : {message}', [
                'path' => $path,
                'message' => $e->getMessage(),
            ]);

            throw new GarminApiException('Impossible de contacter Garmin, réessaie plus tard.');
        }
    }

    /**
     * @throws GarminApiException
     */
    private function getAccessToken(): string
    {
        return $this->cache->get(self::TOKEN_CACHE_KEY, function (ItemInterface $item) {
            $token = $this->exchangeToken();
            $item->expiresAfter(max(60, $token['ttl'] - 60));

            return $token['access_token'];
        });
    }

    /**
     * @return array{access_token: string, ttl: int}
     *
     * @throws GarminApiException
     */
    private function exchangeToken(): array
    {
        if ($this->garminApiKey === '') {
            throw new GarminApiException(
                'Aucune clé Garmin configurée — crée-en une dans Garmin Connect (Paramètres > Personal API '
                . 'Token) et renseigne GARMIN_API_KEY dans .env.local.'
            );
        }

        try {
            $response = $this->garminTokenClient->request(
                'POST',
                '/personalapitoken-service/personal-api/personal-api-key/token',
                ['headers' => ['Authorization' => 'ApiKey ' . $this->garminApiKey]]
            );

            if (in_array($response->getStatusCode(), [401, 403], true)) {
                throw new GarminApiException(
                    'Clé Garmin invalide ou expirée — régénère-la dans Garmin Connect (Paramètres > Personal '
                    . 'API Token) puis mets à jour GARMIN_API_KEY dans .env.local.'
                );
            }

            $rawBody = $response->getContent(false);
        } catch (GarminApiException $e) {
            throw $e;
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Garmin API: échange du token échoué : {message}', ['message' => $e->getMessage()]);

            throw new GarminApiException('Impossible de contacter Garmin, réessaie plus tard.');
        }

        // Garmin's token endpoint returns the bare access token as plain text (not JSON-wrapped) — fall
        // back to treating the body as the token itself when it doesn't parse as a JSON object.
        $data = json_decode($rawBody, true);
        if (is_array($data)) {
            $accessToken = $data['access_token'] ?? $data['accessToken'] ?? null;
            $ttl = (int) ($data['expires_in'] ?? $data['expiresIn'] ?? self::TOKEN_TTL_FALLBACK);
        } else {
            $accessToken = trim($rawBody, " \t\n\r\0\x0B\"");
            $ttl = self::TOKEN_TTL_FALLBACK;
        }

        if (!$accessToken) {
            throw new GarminApiException("Réponse Garmin inattendue lors de l'échange du token.");
        }

        return ['access_token' => $accessToken, 'ttl' => $ttl > 0 ? $ttl : self::TOKEN_TTL_FALLBACK];
    }
}
