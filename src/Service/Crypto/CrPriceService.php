<?php

namespace App\Service\Crypto;

use App\Entity\Crypto\CrPriceHistory;
use App\Repository\Crypto\CrPriceHistoryRepository;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Resolves a coin's historical EUR price for a given day, via CoinGecko's free history endpoint,
 * with a persistent cache (CrPriceHistory) so the same coin/date is never fetched twice.
 *
 * Manual per-coin prices entered on the "Rapport fiscal" page are NOT stored here — they live on the
 * individual disposal (CrTrade::manualCoinPrices), scoped to that one cession, and CrTaxReportService
 * prefers them over this cache. This service is CoinGecko-only.
 *
 * Never throws: any failure (unknown ticker, transport error, unexpected payload) is logged and
 * results in a null return, so CrTaxReportService can degrade a single report line to "needs a
 * manual value" instead of failing the whole report.
 */
class CrPriceService
{
    /**
     * A failed lookup (rate-limited, transport error, no price in the response) is cached too — as a
     * 'failed' row, not just skipped — so a persistently-unresolvable coin/date isn't re-hit on every
     * single report computation (year switch, opening the price-edit panel: each replays the full trade
     * history and can ask for the same coin/date dozens of times). Retried after this cooldown so a
     * transient failure (rate limit) or a later-added COINGECKO_API_KEY eventually recovers on its own.
     */
    private const FAILURE_RETRY_COOLDOWN = 'P1D';

    public function __construct(
        private readonly HttpClientInterface $coingeckoClient,
        private readonly CrPriceHistoryRepository $priceHistoryRepository,
        private readonly LoggerInterface $logger,
        private readonly string $coingeckoApiKey = '',
        private readonly ?HttpClientInterface $binanceClient = null,
    ) {}

    /** Dollar and stablecoins valued straight from the EUR/USDT rate (USDC & co treated as 1 USDT). */
    private const USD_STABLES = ['USD', 'USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD', 'DAI'];

    /** @var array<string, float>|null EUR/USDT daily open, loaded once per service instance */
    private ?array $eurUsdt = null;

    /**
     * Imports daily EUR prices for $coin from Binance's public klines (free, no key, full history — unlike
     * CoinGecko's demo key, which refuses anything older than 365 days) into the shared CrPriceHistory
     * cache as source 'binance'. Price = the day's OPEN (00:00 UTC), the same instant CoinGecko's /history
     * endpoint returns, so the tax report reads it with unchanged semantics. Uses the {COIN}EUR pair, and
     * fills the days it doesn't cover (pair listed later, or missing) from {COIN}USDT / EURUSDT. Incremental:
     * starts after the last 'binance' day already stored. Never throws; returns the number of rows written.
     */
    public function importDailyHistory(string $coin, \DateTimeInterface $from): int
    {
        $coin = strtoupper($coin);
        if ($coin === 'EUR' || $this->binanceClient === null) {
            return 0;
        }

        $start = \DateTimeImmutable::createFromInterface($from)->setTime(0, 0);
        $last = $this->priceHistoryRepository->findLastDate($coin, 'binance');
        if ($last !== null && $last >= $start) {
            $start = $last->modify('+1 day');
        }
        if ($start > new \DateTimeImmutable('today')) {
            return 0;
        }

        $eurUsdt = $this->eurUsdt ??= ($this->fetchDailyOpens('EURUSDT', new \DateTimeImmutable('2019-01-01')) ?? []);

        if (in_array($coin, self::USD_STABLES, true)) {
            $prices = array_map(fn (float $rate) => 1 / $rate, array_filter($eurUsdt, fn ($d) => $d >= $start->format('Y-m-d'), ARRAY_FILTER_USE_KEY));
        } else {
            $prices = $this->fetchDailyOpens($coin . 'EUR', $start) ?? [];
            $firstEurDay = array_key_first($prices);
            if ($firstEurDay === null || $firstEurDay > $start->format('Y-m-d')) {
                foreach ($this->fetchDailyOpens($coin . 'USDT', $start) ?? [] as $day => $usdt) {
                    if (!isset($prices[$day]) && isset($eurUsdt[$day])) {
                        $prices[$day] = $usdt / $eurUsdt[$day];
                    }
                }
            }
        }

        if ($prices === []) {
            $this->logger->info('Crypto prices: no Binance EUR/USDT market for "{coin}".', ['coin' => $coin]);

            return 0;
        }

        ksort($prices);

        return $this->priceHistoryRepository->upsertImported($coin, $prices, 'binance');
    }

    /**
     * @return array<string, float>|null [Y-m-d => open], null when the symbol doesn't exist on Binance
     *         (or the request failed — logged)
     */
    private function fetchDailyOpens(string $symbol, \DateTimeInterface $start): ?array
    {
        $opens = [];
        $startMs = $start->getTimestamp() * 1000;

        try {
            do {
                $response = $this->binanceClient->request('GET', 'api/v3/klines', [
                    'query' => ['symbol' => $symbol, 'interval' => '1d', 'startTime' => $startMs, 'limit' => 1000],
                    'timeout' => 10,
                ]);
                if ($response->getStatusCode() === 400) {
                    return null; // "Invalid symbol": no such market
                }

                $klines = $response->toArray();
                foreach ($klines as $kline) {
                    $opens[gmdate('Y-m-d', intdiv((int) $kline[0], 1000))] = (float) $kline[1];
                }
                $startMs = $klines === [] ? null : (int) end($klines)[0] + 86_400_000;
            } while (count($klines) === 1000);
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Crypto prices: Binance klines failed for {symbol}: {message}', ['symbol' => $symbol, 'message' => $e->getMessage()]);

            return $opens === [] ? null : $opens;
        }

        return $opens;
    }

    /**
     * $liveFetch = false restricts this to whatever is already in the persistent cache (a plain DB read,
     * no network call at all) — used by CrTaxReportService's normal report view so opening/switching years
     * on the "Rapport fiscal" page stays fast even when dozens of coin/date pairs have never been resolved
     * yet; the user then hits "Actualiser" (liveFetch: true) to deliberately pay for the CoinGecko round
     * trips (and the free tier's rate limit) when they actually want fresh/missing prices filled in.
     */
    public function getPriceEur(string $coin, \DateTimeInterface $date, bool $liveFetch = true): ?float
    {
        $coin = strtoupper($coin);

        if ($coin === 'EUR') {
            return 1.0;
        }

        $day = \DateTime::createFromInterface($date)->setTime(0, 0);

        $cached = $this->priceHistoryRepository->findOneByCoinAndDate($coin, $day);
        if ($cached !== null && $cached->getSource() !== 'failed') {
            return $cached->getPriceEur();
        }

        if (!$liveFetch) {
            return null;
        }

        if ($cached !== null && $cached->getSource() === 'failed') {
            $retryAfter = (clone $cached->getFetchedAt())->add(new \DateInterval(self::FAILURE_RETRY_COOLDOWN));
            if (new \DateTimeImmutable() < $retryAfter) {
                return null;
            }
        }

        $coingeckoId = CoinGeckoIdMap::resolve($coin);
        if ($coingeckoId === null) {
            $this->logger->info('Crypto tax report: no CoinGecko id mapped for ticker "{coin}".', ['coin' => $coin]);

            return null;
        }

        try {
            $response = $this->coingeckoClient->request('GET', "coins/{$coingeckoId}/history", [
                'query' => [
                    'date' => $day->format('d-m-Y'),
                    'localization' => 'false',
                ],
                'headers' => $this->coingeckoApiKey !== ''
                    ? ['x-cg-demo-api-key' => $this->coingeckoApiKey]
                    : [],
                'timeout' => 5,
            ]);

            $data = $response->toArray();
            $priceEur = $data['market_data']['current_price']['eur'] ?? null;
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Crypto tax report: CoinGecko price lookup failed for {coin} on {date}: {message}', [
                'coin' => $coin,
                'date' => $day->format('Y-m-d'),
                'message' => $e->getMessage(),
            ]);

            $this->rememberFailure($cached, $coin, $day);

            return null;
        }

        if (!is_numeric($priceEur)) {
            $this->logger->warning('Crypto tax report: CoinGecko returned no EUR price for {coin} on {date}.', [
                'coin' => $coin,
                'date' => $day->format('Y-m-d'),
            ]);

            $this->rememberFailure($cached, $coin, $day);

            return null;
        }

        $priceEur = (float) $priceEur;

        $history = ($cached ?? (new CrPriceHistory())->setCoin($coin)->setPriceDate($day))
            ->setPriceEur($priceEur)
            ->setSource('coingecko')
            ->setFetchedAt(new \DateTimeImmutable())
        ;
        $this->priceHistoryRepository->save($history, true);

        return $priceEur;
    }

    /**
     * Upserts a 'failed' marker on the same (coin, date) row a success would have used, so the unique
     * constraint is never hit and a later successful retry just overwrites it in place.
     */
    private function rememberFailure(?CrPriceHistory $existing, string $coin, \DateTimeInterface $day): void
    {
        $history = ($existing ?? (new CrPriceHistory())->setCoin($coin)->setPriceDate($day))
            ->setPriceEur(0.0)
            ->setSource('failed')
            ->setFetchedAt(new \DateTimeImmutable())
        ;
        $this->priceHistoryRepository->save($history, true);
    }

}
