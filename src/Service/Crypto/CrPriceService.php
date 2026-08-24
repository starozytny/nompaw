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
 * The same cache can also be filled in by hand (setManualPrice(), used by
 * TaxReportController::updatePrices() when the user fills in a per-coin value for a report line CoinGecko
 * couldn't resolve) — once saved, it's indistinguishable from a CoinGecko-sourced entry to getPriceEur(),
 * so a manually-entered price for a coin/date is never looked up twice either, and benefits every future
 * report line (any user's, any year) that needs that exact coin/date again.
 *
 * Never throws: any failure (unknown ticker, transport error, unexpected payload) is logged and
 * results in a null return, so CrTaxReportService can degrade a single report line to "needs a
 * manual value" instead of failing the whole report.
 */
class CrPriceService
{
    public function __construct(
        private readonly HttpClientInterface $coingeckoClient,
        private readonly CrPriceHistoryRepository $priceHistoryRepository,
        private readonly LoggerInterface $logger,
        private readonly string $coingeckoApiKey = '',
    ) {}

    public function getPriceEur(string $coin, \DateTimeInterface $date): ?float
    {
        $coin = strtoupper($coin);

        if ($coin === 'EUR') {
            return 1.0;
        }

        $day = \DateTime::createFromInterface($date)->setTime(0, 0);

        $cached = $this->priceHistoryRepository->findOneByCoinAndDate($coin, $day);
        if ($cached !== null) {
            return $cached->getPriceEur();
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
            ]);

            $data = $response->toArray();
            $priceEur = $data['market_data']['current_price']['eur'] ?? null;
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('Crypto tax report: CoinGecko price lookup failed for {coin} on {date}: {message}', [
                'coin' => $coin,
                'date' => $day->format('Y-m-d'),
                'message' => $e->getMessage(),
            ]);

            return null;
        }

        if (!is_numeric($priceEur)) {
            $this->logger->warning('Crypto tax report: CoinGecko returned no EUR price for {coin} on {date}.', [
                'coin' => $coin,
                'date' => $day->format('Y-m-d'),
            ]);

            return null;
        }

        $priceEur = (float) $priceEur;

        $history = (new CrPriceHistory())
            ->setCoin($coin)
            ->setPriceDate($day)
            ->setPriceEur($priceEur)
            ->setSource('coingecko')
        ;
        $this->priceHistoryRepository->save($history, true);

        return $priceEur;
    }

    /**
     * Records (or overwrites) a coin's price for one day by hand — see class docblock. Upserts on the
     * (coin, priceDate) unique constraint so re-editing an already-manual entry doesn't create a
     * duplicate row.
     */
    public function setManualPrice(string $coin, \DateTimeInterface $date, float $priceEur): void
    {
        $coin = strtoupper($coin);
        $day = \DateTime::createFromInterface($date)->setTime(0, 0);

        $history = $this->priceHistoryRepository->findOneByCoinAndDate($coin, $day) ?? (new CrPriceHistory())
            ->setCoin($coin)
            ->setPriceDate($day)
        ;
        $history->setPriceEur($priceEur)->setSource('manual');

        $this->priceHistoryRepository->save($history, true);
    }
}
