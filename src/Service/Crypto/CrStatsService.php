<?php

namespace App\Service\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
use App\Entity\Main\User;
use App\Repository\Crypto\CrPriceHistoryRepository;
use App\Repository\Crypto\CrTradeRepository;

/**
 * "Statistiques" tab: the portfolio replayed week by week (same holdings rules as "Cryptos restantes",
 * via CrTradeReplayService::applyHolding) and valued with the shared CrPriceHistory cache (filled from
 * Binance by CrPriceService::importDailyHistory). Weekly = every Sunday from the first trade, plus today.
 */
class CrStatsService
{
    public const TOP_COINS = 8;
    public const OTHERS = 'Autres';

    /** A price older than this (relative to the sample day) is considered stale → coin left unvalued. */
    private const MAX_PRICE_AGE_DAYS = 14;
    private const EPSILON = 0.00000001;

    public function __construct(
        private readonly CrTradeRepository $tradeRepository,
        private readonly CrTradeReplayService $replayService,
        private readonly CrPriceHistoryRepository $priceHistoryRepository,
        private readonly CrPriceService $priceService,
    ) {}

    /**
     * Imports missing daily prices for every coin of $user (all users when null), from each coin's first
     * trade (incremental — see importDailyHistory()). $heldOnly (the UI button) skips coins no longer held:
     * their history is already complete, and each one would cost a Binance round trip.
     *
     * @return array<string, int> coin => rows written
     */
    public function refreshPrices(?User $user, ?string $onlyCoin = null, ?callable $onCoin = null, bool $heldOnly = false): array
    {
        $held = $heldOnly && $user !== null ? array_column($this->replayService->computeHoldings($user)['holdings'], 'coin') : null;

        $written = [];
        foreach ($this->tradeRepository->findCoinFirstDates($user) as $coin => $firstDate) {
            if (($onlyCoin !== null && strtoupper($onlyCoin) !== $coin) || ($held !== null && !in_array($coin, $held, true))) {
                continue;
            }
            $written[$coin] = $this->priceService->importDailyHistory($coin, new \DateTimeImmutable($firstDate));
            if ($onCoin !== null) {
                $onCoin($coin, $written[$coin]);
            }
        }

        return $written;
    }

    public function build(User $user, int $topN = self::TOP_COINS): array
    {
        $points = $this->sample($this->trades($user));
        if ($points === []) {
            return ['kpis' => null, 'series' => [], 'coins' => [], 'allocation' => []];
        }

        // Top N by the highest value they ever reached (not today's value), so a coin that mattered in
        // 2021 still gets its own band in the history chart; everything else is summed into "Autres".
        $maxByCoin = [];
        foreach ($points as $point) {
            foreach ($point['values'] as $coin => $value) {
                $maxByCoin[$coin] = max($maxByCoin[$coin] ?? 0, $value);
            }
        }
        arsort($maxByCoin);
        $top = array_slice(array_keys($maxByCoin), 0, $topN);

        $series = [];
        foreach ($points as $point) {
            $row = ['date' => $point['date'], 'total' => round(array_sum($point['values']), 2), 'invested' => round($point['invested'], 2)];
            $others = 0.0;
            foreach ($point['values'] as $coin => $value) {
                if (in_array($coin, $top, true)) {
                    $row[$coin] = round($value, 2);
                } else {
                    $others += $value;
                }
            }
            foreach ($top as $coin) {
                $row[$coin] ??= 0.0;
            }
            $row[self::OTHERS] = round($others, 2);
            $series[] = $row;
        }

        $last = end($points);
        $value = array_sum($last['values']);
        $allocation = [];
        foreach ($last['quantities'] as $coin => $qty) {
            $coinValue = $last['values'][$coin] ?? null;
            $allocation[] = [
                'coin' => $coin,
                'quantity' => $qty,
                'price' => $last['prices'][$coin] ?? null,
                'value' => $coinValue !== null ? round($coinValue, 2) : null,
                'percent' => $coinValue !== null && $value > 0 ? round($coinValue / $value * 100, 2) : null,
            ];
        }
        usort($allocation, fn (array $a, array $b) => ($b['value'] ?? -1) <=> ($a['value'] ?? -1));

        $yearData = $this->replayService->computeYearData($user, null);
        $cash = (float) ($yearData['yearStats']['dispoEnd'] ?? 0.0);

        return [
            'kpis' => [
                'value' => round($value, 2),
                'cash' => round($cash, 2),
                'invested' => round($last['invested'], 2),
                'result' => round($value + $cash - $last['invested'], 2),
                'heldCount' => count($last['quantities']),
                'unpricedCoins' => array_values(array_diff(array_keys($last['quantities']), array_keys($last['values']))),
                'pricesUpTo' => $this->latestPriceDate($last),
            ],
            'coins' => $top,
            'series' => $series,
            'allocation' => $allocation,
        ];
    }

    /**
     * One coin's weekly quantity, EUR price and value, plus how much was bought/sold during each week
     * (aggregated per week rather than one marker per trade: some coins have 400+ trades).
     */
    public function coinSeries(User $user, string $coin): array
    {
        $coin = strtoupper($coin);
        $points = $this->sample($this->trades($user), $coin);

        return array_map(fn (array $p) => [
            'date' => $p['date'],
            'quantity' => $p['quantities'][$coin] ?? 0.0,
            'price' => $p['prices'][$coin] ?? null,
            'value' => isset($p['values'][$coin]) ? round($p['values'][$coin], 2) : null,
            'bought' => $p['bought'],
            'sold' => $p['sold'],
        ], $points);
    }

    /** @return CrTrade[] */
    private function trades(User $user): array
    {
        return $this->tradeRepository->findBy(['user' => $user], ['tradeAt' => 'ASC', 'id' => 'ASC']);
    }

    /**
     * Replays $trades and snapshots the holdings at the end of every Sunday from the first trade, plus
     * today. $focusCoin additionally sums that coin's buys/sells within each period.
     *
     * @param CrTrade[] $trades chronological
     * @return list<array{date: string, quantities: array<string, float>, prices: array<string, float>, values: array<string, float>, invested: float, bought: float, sold: float}>
     */
    private function sample(array $trades, ?string $focusCoin = null): array
    {
        if ($trades === []) {
            return [];
        }

        $today = new \DateTimeImmutable('today');
        $dates = [];
        for ($d = \DateTimeImmutable::createFromInterface($trades[0]->getTradeAt())->modify('sunday this week')->setTime(0, 0); $d < $today; $d = $d->modify('+7 days')) {
            $dates[] = $d;
        }
        $dates[] = $today;

        $coins = [];
        foreach ($trades as $trade) {
            foreach ([$trade->getFromCoin(), $trade->getToCoin()] as $c) {
                if ($c !== 'EUR' && ($focusCoin === null || $c === $focusCoin)) {
                    $coins[$c] = true;
                }
            }
        }
        $priceTable = $this->priceHistoryRepository->findWeeklyPrices(array_keys($coins), $today->modify('-' . self::MAX_PRICE_AGE_DAYS . ' days'));

        $balances = [];
        $invested = 0.0;
        $lastPrice = []; // coin => [Y-m-d, price]
        $points = [];
        $i = 0;
        $count = count($trades);

        foreach ($dates as $date) {
            $endOfDay = $date->modify('+1 day');
            $bought = 0.0;
            $sold = 0.0;

            for (; $i < $count && $trades[$i]->getTradeAt() < $endOfDay; $i++) {
                $trade = $trades[$i];
                $this->replayService->applyHolding($balances, $trade);

                // Same "Net investi" definition as CrTradeReplayService::computeHoldings().
                if ($trade->getType() === TypeType::Depot) {
                    $invested += (float) $trade->getTotal();
                } elseif ($trade->getType() === TypeType::Retrait) {
                    $invested -= (float) $trade->getTotalReal();
                }

                if ($focusCoin !== null) {
                    if ($trade->getToCoin() === $focusCoin && in_array($trade->getType(), [TypeType::Achat, TypeType::Vente, TypeType::Depot], true)) {
                        $bought += (float) $trade->getToNbToken();
                    } elseif ($trade->getFromCoin() === $focusCoin && in_array($trade->getType(), [TypeType::Vente, TypeType::Retrait], true)) {
                        $sold += (float) $trade->getFromNbToken();
                    }
                }
            }

            $day = $date->format('Y-m-d');
            $isToday = $date == $today;
            foreach ($priceTable as $coin => $byDay) {
                // Sundays are the sampled days; "today" looks back over the recent daily rows instead.
                for ($back = 0; $back <= ($isToday ? self::MAX_PRICE_AGE_DAYS : 0); $back++) {
                    $key = $back === 0 ? $day : $date->modify("-$back days")->format('Y-m-d');
                    if (isset($byDay[$key])) {
                        $lastPrice[$coin] = [$key, $byDay[$key]];
                        break;
                    }
                }
            }

            $quantities = [];
            $prices = [];
            $values = [];
            foreach ($balances as $coin => $qty) {
                if ($coin === 'EUR' || $qty <= self::EPSILON || ($focusCoin !== null && $coin !== $focusCoin)) {
                    continue;
                }
                $quantities[$coin] = $qty;
                if (isset($lastPrice[$coin]) && (new \DateTimeImmutable($lastPrice[$coin][0]))->diff($date)->days <= self::MAX_PRICE_AGE_DAYS) {
                    $prices[$coin] = $lastPrice[$coin][1];
                    $values[$coin] = $qty * $lastPrice[$coin][1];
                }
            }

            $points[] = [
                'date' => $day,
                'quantities' => $quantities,
                'prices' => $prices,
                'values' => $values,
                'invested' => $invested,
                'bought' => $bought,
                'sold' => $sold,
                'priceDates' => array_map(fn (array $p) => $p[0], array_intersect_key($lastPrice, $values)),
            ];
        }

        return $points;
    }

    private function latestPriceDate(array $point): ?string
    {
        return $point['priceDates'] === [] ? null : max($point['priceDates']);
    }
}
