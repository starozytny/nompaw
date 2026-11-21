<?php

namespace App\Service\Crypto;

use App\Entity\Crypto\CrPriceHistory;
use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
use App\Repository\Crypto\CrPriceHistoryRepository;
use App\Repository\Crypto\CrTradeRepository;
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
        private readonly ?CrTradeRepository $tradeRepository = null,
    ) {}

    /** @var array<int, array<string, array<string, float>>> userId => COIN => Y-m-d => price, see manualPriceOn() */
    private array $manualPrices = [];

    /** Dollar and stablecoins valued straight from the EUR/USDT rate (USDC & co treated as 1 USDT). */
    private const USD_STABLES = ['USD', 'USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD', 'DAI'];

    /** CoinGecko plan: 100 calls/min → at least 0.6 s between two calls (all CoinGecko calls of this instance). */
    private const COINGECKO_MIN_INTERVAL = 0.6;

    /** History depth allowed by the CoinGecko plan (older ranges answer 401). One day of margin. */
    private const COINGECKO_HISTORY_DAYS = 364;

    private float $lastCoingeckoCallAt = 0.0;

    /** CoinGecko calls made by this instance (1 call = 1 credit), for the caller's budget/report. */
    public int $coingeckoCalls = 0;

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
            $data = $this->coingeckoGet("coins/{$coingeckoId}/history", [
                'date' => $day->format('d-m-Y'),
                'localization' => 'false',
            ]);
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


    /**
     * EUR price of $coin set by hand on one of the user's disposals of that same day in the "Rapport fiscal"
     * (CrTrade::manualCoinPrices: the portfolio valued at the moment of a sale). Loaded once per user.
     */
    private function manualPriceOn(CrTrade $trade, string $coin): ?float
    {
        $user = $trade->getUser();
        if ($user === null || $this->tradeRepository === null) {
            return null;
        }

        if (!isset($this->manualPrices[$user->getId()])) {
            $index = [];
            $rows = $this->tradeRepository->createQueryBuilder('t')
                ->select('t.tradeAt, t.manualCoinPrices')
                ->where('t.user = :user AND t.manualCoinPrices IS NOT NULL')
                ->setParameter('user', $user)
                ->getQuery()->getArrayResult();
            foreach ($rows as $row) {
                foreach ($row['manualCoinPrices'] ?? [] as $ticker => $price) {
                    $index[strtoupper($ticker)][$row['tradeAt']->format('Y-m-d')] ??= (float) $price;
                }
            }
            $this->manualPrices[$user->getId()] = $index;
        }

        return $this->manualPrices[$user->getId()][strtoupper($coin)][$trade->getTradeAt()->format('Y-m-d')] ?? null;
    }

    /**
     * Prices for a trade's empty (null/0) fromPrice/toPrice, without touching the trade: a price set the
     * same day in the "Rapport fiscal" (same precedence as the report itself), else the coin's EUR
     * price of the day, else implied from the other leg (otherQty × otherPrice / qty — e.g. 5 CRO bought
     * for 100 EUR → 20 €). Same-coin legs (stacking, rewards) can't be implied. Shared by the import and
     * app:crypto:trades:fill-prices.
     *
     * @return array{prices: array<'from'|'to', array{0: float, 1: 'cours'|'déduit'}>, missing: list<string>}
     */
    public function resolveMissingPrices(CrTrade $trade, bool $liveFetch = false): array
    {
        $legs = [
            'from' => ['coin' => $trade->getFromCoin(), 'qty' => (float) $trade->getFromNbToken(), 'price' => (float) $trade->getFromPrice()],
            'to' => ['coin' => $trade->getToCoin(), 'qty' => (float) $trade->getToNbToken(), 'price' => (float) $trade->getToPrice()],
        ];
        $prices = [];

        foreach ($legs as $side => $leg) {
            if ($leg['coin'] && $leg['price'] == 0.0) {
                $manual = strtoupper($leg['coin']) === 'EUR' ? null : $this->manualPriceOn($trade, $leg['coin']);
                $price = $manual ?? $this->getPriceEur($leg['coin'], $trade->getTradeAt(), $liveFetch);
                if ($price !== null) {
                    $prices[$side] = [$price, $manual !== null ? 'rapport fiscal' : 'cours'];
                    $legs[$side]['price'] = $price;
                }
            }
        }

        $missing = [];
        foreach ($legs as $side => $leg) {
            if (!$leg['coin'] || $leg['price'] != 0.0) {
                continue;
            }
            $other = $legs[$side === 'from' ? 'to' : 'from'];
            if ($leg['qty'] > 0 && $other['qty'] > 0 && $other['price'] > 0 && strtoupper((string) $other['coin']) !== strtoupper($leg['coin'])) {
                $prices[$side] = [$other['qty'] * $other['price'] / $leg['qty'], 'déduit'];
            } else {
                $missing[] = strtoupper($leg['coin']);
            }
        }

        return ['prices' => $prices, 'missing' => $missing];
    }

    /**
     * Daily EUR prices of $coin between two days in ONE CoinGecko call (market_chart/range) — 1 credit
     * for a whole year instead of one /history call per day. Keeps each day's first point (00:00 UTC
     * when the range is > 90 days, same "open" semantics as Binance) and stores them as 'coingecko'.
     *
     * @return int|string rows written, or the reason nothing was fetched
     */
    public function importCoinGeckoRange(string $coin, \DateTimeInterface $from, \DateTimeInterface $to): int|string
    {
        $coingeckoId = CoinGeckoIdMap::resolve($coin);
        if ($coingeckoId === null) {
            return 'ticker non mappé (CoinGeckoIdMap)';
        }

        // The plan refuses (401, credit still spent) anything older than 365 days: clip, or skip without a call.
        $oldest = new \DateTimeImmutable('-' . self::COINGECKO_HISTORY_DAYS . ' days midnight');
        if ($to < $oldest) {
            return 'plus vieux que ' . self::COINGECKO_HISTORY_DAYS . ' jours (limite du plan CoinGecko), pas d\'appel';
        }
        if ($from < $oldest) {
            $from = $oldest;
        }

        try {
            $data = $this->coingeckoGet("coins/{$coingeckoId}/market_chart/range", [
                'vs_currency' => 'eur',
                'from' => \DateTimeImmutable::createFromInterface($from)->setTime(0, 0)->getTimestamp(),
                'to' => \DateTimeImmutable::createFromInterface($to)->setTime(23, 59, 59)->getTimestamp(),
            ]);
        } catch (\Throwable $e) {
            $this->logger->warning('Crypto prices: CoinGecko range failed for {coin}: {message}', ['coin' => $coin, 'message' => $e->getMessage()]);

            return 'erreur CoinGecko (' . substr($e->getMessage(), 0, 80) . ')';
        }

        $prices = [];
        foreach ($data['prices'] ?? [] as [$ms, $price]) {
            $day = gmdate('Y-m-d', (int) ($ms / 1000));
            if (!isset($prices[$day]) && is_numeric($price)) {
                $prices[$day] = (float) $price;
            }
        }

        return $prices === [] ? 'aucun cours renvoyé' : $this->priceHistoryRepository->upsertImported(strtoupper($coin), $prices, 'coingecko');
    }

    /**
     * Every CoinGecko call goes through here: spaced to respect the per-minute limit, counted, and
     * retried once after a minute when the API still answers 429 (limit shared with other uses).
     */
    private function coingeckoGet(string $path, array $query): array
    {
        for ($attempt = 0; ; $attempt++) {
            $wait = $this->lastCoingeckoCallAt + self::COINGECKO_MIN_INTERVAL - microtime(true);
            if ($wait > 0) {
                usleep((int) ($wait * 1_000_000));
            }
            $this->lastCoingeckoCallAt = microtime(true);
            $this->coingeckoCalls++;

            $response = $this->coingeckoClient->request('GET', $path, [
                'query' => $query,
                'headers' => $this->coingeckoApiKey !== '' ? ['x-cg-demo-api-key' => $this->coingeckoApiKey] : [],
                'timeout' => 15,
            ]);
            if ($response->getStatusCode() === 429 && $attempt === 0) {
                sleep(60);
                continue;
            }

            return $response->toArray();
        }
    }

    /**
     * Fills what's empty on a trade, from cached prices only (no network): fromPrice/toPrice via
     * resolveMissingPrices(), then totalReal = EUR value of what was received (like the trade form;
     * total = totalReal + EUR fee when also empty). totalReal is only derived for Achat/Vente/rewards:
     * on Dépôt/Retrait/Transfert it would count a crypto move as euros in "Net investi".
     * Shared by the import and app:crypto:trades:fill-prices.
     *
     * @return array{prices: array<'from'|'to', array{0: float, 1: string}>, missing: list<string>, totalReal: ?float}
     */
    public function fillMissingValues(CrTrade $trade): array
    {
        $resolved = $this->resolveMissingPrices($trade);
        foreach ($resolved['prices'] as $side => [$price]) {
            $side === 'from' ? $trade->setFromPrice($price) : $trade->setToPrice($price);
        }

        $resolved['totalReal'] = null;
        if ((float) $trade->getTotalReal() == 0.0 && in_array($trade->getType(), self::TOTAL_TYPES, true)) {
            $value = (float) $trade->getToNbToken() * (float) $trade->getToPrice() ?: (float) $trade->getFromNbToken() * (float) $trade->getFromPrice();
            if ($value > 0) {
                $resolved['totalReal'] = round($value, 2);
                $trade->setTotalReal($resolved['totalReal']);
                if ((float) $trade->getTotal() == 0.0) {
                    $trade->setTotal(round($value + ($trade->getCostCoin() === 'EUR' ? (float) $trade->getCostPrice() : 0.0), 2));
                }
            }
        }

        return $resolved;
    }

    public const TOTAL_TYPES = [TypeType::Achat, TypeType::Vente, TypeType::Recuperation, TypeType::Stacking];
}
