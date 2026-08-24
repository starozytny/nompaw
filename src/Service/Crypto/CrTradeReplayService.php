<?php

namespace App\Service\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
use App\Entity\Main\User;
use App\Repository\Crypto\CrTradeRepository;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

/**
 * Server-side replacement for the client-side chronological replay that used to live in
 * assets/user/js/functions/cryptoHoldings.js (computeHoldingsAndAlerts/computeTransactionValidity) and
 * the "Dispo" running-total switch in TradesList.jsx — moved here so the full trade history (which only
 * grows, via manual entry + bulk exchange imports) never has to be shipped to the browser just to compute
 * a running balance, current holdings, or flag impossible transactions. Mirrors the full-history-replay
 * pattern CrTaxReportService already uses for the fiscal report.
 *
 * Business rules below are ported as-is from the JS originals (kept in one place now instead of two):
 * - "Dispo" (EUR cash running total): Vente +totalReal, Depot +total, Achat -total, Retrait -totalReal,
 *   Recuperation/Stacking -> bonus only (no Dispo effect), Transfert/ACategoriser -> no effect.
 * - Holdings (replayHoldings, valuation-oriented, EUR untracked): Achat +toCoin; Vente -fromCoin (+toCoin
 *   too if toCoin isn't EUR, i.e. a crypto-to-crypto swap); Depot/Retrait only move the balance if the
 *   coin involved isn't EUR (a real external crypto deposit/withdrawal); Recuperation/Stacking +fromCoin
 *   (a reward); Transfert -> no net holdings impact (moves between the user's own wallets).
 * - Validity check (checkValidity, every coin including EUR, Achat DOES debit fromCoin): flags a
 *   transaction that couldn't physically have happened given what was available right before it.
 */
class CrTradeReplayService
{
    private const DEFICIT_EPSILON = 0.00000001;

    public function __construct(
        private readonly CrTradeRepository $tradeRepository,
        private readonly NormalizerInterface $normalizer,
    ) {}

    /**
     * Whole payload for the "Transactions" table: one year's trades (each annotated with the running
     * `dispoAfter` balance and an `invalid` deficit flag, computed from a single pass over the FULL
     * history), plus the list of years that have data and that year's aggregate stats.
     */
    public function computeYearData(User $user, ?int $year): array
    {
        $trades = $this->tradeRepository->findBy(['user' => $user], ['tradeAt' => 'ASC', 'id' => 'ASC']);

        if (empty($trades)) {
            return ['trades' => [], 'years' => [], 'yearStats' => null, 'year' => null];
        }

        $validityBalances = [];
        // dispo/cumDepot/cumRetrait/cumBonus are ALL-TIME running totals (since account inception, not
        // year-scoped) — TradesList.jsx's per-month header shows these four cumulative figures (as of
        // the end of that month), separate from $statsByYear below which is scoped to a single year for
        // the stat cards. Note: Retrait's dispo effect uses getTotal() (fee-inclusive) while its own
        // cumulative/year stat uses getTotalReal() (net received) — an intentional asymmetry already
        // present in TradesList.jsx (fee still leaves the platform balance, but was never actually
        // received in hand), mirrored here exactly rather than "corrected".
        $dispo = 0.0;
        $cumDepot = 0.0;
        $cumRetrait = 0.0;
        $cumBonus = 0.0;

        $years = [];
        $rowsByYear = [];
        $statsByYear = [];

        foreach ($trades as $trade) {
            $tradeYear = (int) $trade->getTradeAt()->format('Y');
            if (!isset($statsByYear[$tradeYear])) {
                $years[] = $tradeYear;
                $statsByYear[$tradeYear] = ['count' => 0, 'depot' => 0.0, 'retrait' => 0.0, 'achat' => 0.0, 'vente' => 0.0, 'bonus' => 0.0];
            }

            $invalid = $this->checkValidity($trade, $validityBalances);

            switch ($trade->getType()) {
                case TypeType::Vente:
                    $dispo += $trade->getTotalReal();
                    $statsByYear[$tradeYear]['vente'] += $trade->getTotalReal();
                    break;
                case TypeType::Depot:
                    $dispo += $trade->getTotal();
                    $cumDepot += $trade->getTotal();
                    $statsByYear[$tradeYear]['depot'] += $trade->getTotal();
                    break;
                case TypeType::Achat:
                    $dispo -= $trade->getTotal();
                    $statsByYear[$tradeYear]['achat'] += $trade->getTotal();
                    break;
                case TypeType::Retrait:
                    $dispo -= $trade->getTotal();
                    $cumRetrait += $trade->getTotalReal();
                    $statsByYear[$tradeYear]['retrait'] += $trade->getTotalReal();
                    break;
                case TypeType::Recuperation:
                case TypeType::Stacking:
                    $cumBonus += $trade->getTotal();
                    $statsByYear[$tradeYear]['bonus'] += $trade->getTotal();
                    break;
                default:
                    break;
            }

            $statsByYear[$tradeYear]['count']++;
            $dispo = round($dispo, 2);
            $cumDepot = round($cumDepot, 2);
            $cumRetrait = round($cumRetrait, 2);
            $cumBonus = round($cumBonus, 2);

            $rowsByYear[$tradeYear][] = [
                'trade' => $trade,
                'dispoAfter' => $dispo,
                'depotAfter' => $cumDepot,
                'retraitAfter' => $cumRetrait,
                'bonusAfter' => $cumBonus,
                'invalid' => $invalid,
            ];
        }

        rsort($years);
        $effectiveYear = ($year !== null && in_array($year, $years, true)) ? $year : $years[0];

        $rows = $rowsByYear[$effectiveYear] ?? [];
        $tradesOut = array_map(function (array $row) {
            $data = $this->normalizer->normalize($row['trade'], null, ['groups' => CrTrade::LIST]);
            $data['dispoAfter'] = $row['dispoAfter'];
            $data['depotAfter'] = $row['depotAfter'];
            $data['retraitAfter'] = $row['retraitAfter'];
            $data['bonusAfter'] = $row['bonusAfter'];
            $data['invalid'] = $row['invalid'];

            return $data;
        }, $rows);

        $rawStats = $statsByYear[$effectiveYear] ?? null;
        $yearStats = $rawStats === null ? null : [
            'count' => $rawStats['count'],
            'depot' => round($rawStats['depot'], 2),
            'retrait' => round($rawStats['retrait'], 2),
            'achat' => round($rawStats['achat'], 2),
            'vente' => round($rawStats['vente'], 2),
            'bonus' => round($rawStats['bonus'], 2),
            'dispoEnd' => end($rows)['dispoAfter'],
        ];

        return [
            'trades' => $tradesOut,
            'years' => $years,
            'yearStats' => $yearStats,
            'year' => $effectiveYear,
        ];
    }

    /**
     * Current holdings + inconsistency alerts (full history), and the all-time "Net investi" figures
     * (total ever deposited / withdrawn) shown on the Trades.jsx summary card.
     */
    public function computeHoldings(User $user): array
    {
        $trades = $this->tradeRepository->findBy(['user' => $user], ['tradeAt' => 'ASC', 'id' => 'ASC']);

        $netDepot = 0.0;
        $netRetrait = 0.0;
        foreach ($trades as $trade) {
            if ($trade->getType() === TypeType::Depot) {
                $netDepot += $trade->getTotal();
            } elseif ($trade->getType() === TypeType::Retrait) {
                $netRetrait += $trade->getTotalReal();
            }
        }

        return [
            ...$this->replayHoldings($trades),
            'netInvested' => ['depot' => round($netDepot, 2), 'retrait' => round($netRetrait, 2)],
        ];
    }

    /**
     * Holdings replayed strictly before $asOf (optionally skipping one trade, typically the one being
     * edited) — powers TradesForm's "solde à cette date" display. Mirrors cryptoHoldings.js's
     * `asOf`/`excludeId` options.
     */
    public function computeHoldingsAsOf(User $user, \DateTimeInterface $asOf, ?int $excludeId): array
    {
        $trades = $this->tradeRepository->findBy(['user' => $user], ['tradeAt' => 'ASC', 'id' => 'ASC']);

        $scoped = array_values(array_filter($trades, function (CrTrade $trade) use ($asOf, $excludeId) {
            if ($excludeId !== null && $trade->getId() === $excludeId) {
                return false;
            }

            return $trade->getTradeAt() <= $asOf;
        }));

        return ['holdings' => $this->replayHoldings($scoped)['holdings']];
    }

    /**
     * Filter option lists for the Transactions table (platform/token multi-selects) — from cheap DISTINCT
     * queries, independent of how much trade history the user has.
     */
    public function getFilterOptions(User $user): array
    {
        return [
            'platforms' => $this->tradeRepository->findDistinctPlatforms($user),
            'tokens' => $this->tradeRepository->findDistinctTokens($user),
            'hasManual' => $this->tradeRepository->hasManualEntry($user),
        ];
    }

    /**
     * @param CrTrade[] $trades already ordered chronologically
     * @return array{holdings: list<array{coin: string, quantity: float}>, alerts: list<array>}
     */
    private function replayHoldings(array $trades): array
    {
        $balances = [];
        $alerts = [];

        foreach ($trades as $trade) {
            switch ($trade->getType()) {
                case TypeType::Achat:
                    $this->credit($balances, $trade->getToCoin(), $trade->getToNbToken());
                    break;
                case TypeType::Vente:
                    $this->credit($balances, $trade->getFromCoin(), -$trade->getFromNbToken());
                    $deficit = $this->deficitOf($balances, $trade->getFromCoin());
                    if ($deficit !== null) {
                        $alerts[] = $this->alert($trade, $trade->getFromCoin(), 'vente', $trade->getFromNbToken(), $deficit);
                    }
                    if ($trade->getToCoin() !== 'EUR') {
                        $this->credit($balances, $trade->getToCoin(), $trade->getToNbToken());
                    }
                    break;
                case TypeType::Depot:
                    if ($trade->getToCoin() !== 'EUR') {
                        $this->credit($balances, $trade->getToCoin(), $trade->getToNbToken());
                    }
                    break;
                case TypeType::Retrait:
                    if ($trade->getFromCoin() !== 'EUR') {
                        $this->credit($balances, $trade->getFromCoin(), -$trade->getFromNbToken());
                        $deficit = $this->deficitOf($balances, $trade->getFromCoin());
                        if ($deficit !== null) {
                            $alerts[] = $this->alert($trade, $trade->getFromCoin(), 'retrait', $trade->getFromNbToken(), $deficit);
                        }
                    }
                    break;
                case TypeType::Recuperation:
                case TypeType::Stacking:
                    $this->credit($balances, $trade->getFromCoin(), $trade->getFromNbToken());
                    break;
                default:
                    break;
            }
        }

        $holdings = [];
        foreach ($balances as $coin => $quantity) {
            if (abs($quantity) > self::DEFICIT_EPSILON) {
                $holdings[] = ['coin' => $coin, 'quantity' => $quantity];
            }
        }
        usort($holdings, fn (array $a, array $b) => $b['quantity'] <=> $a['quantity']);

        return ['holdings' => $holdings, 'alerts' => $alerts];
    }

    /**
     * Every coin including EUR, and Achat DOES debit fromCoin (unlike replayHoldings) — see class docblock.
     */
    private function checkValidity(CrTrade $trade, array &$balances): ?array
    {
        $invalid = null;

        switch ($trade->getType()) {
            case TypeType::Achat:
                $invalid = $this->debitAndCheck($balances, $trade, $trade->getFromCoin(), $trade->getFromNbToken(), 'achat');
                $this->credit($balances, $trade->getToCoin(), $trade->getToNbToken());
                break;
            case TypeType::Vente:
                $invalid = $this->debitAndCheck($balances, $trade, $trade->getFromCoin(), $trade->getFromNbToken(), 'vente');
                $this->credit($balances, $trade->getToCoin(), $trade->getToNbToken());
                break;
            case TypeType::Depot:
                $this->credit($balances, $trade->getToCoin(), $trade->getToNbToken());
                break;
            case TypeType::Retrait:
                $invalid = $this->debitAndCheck($balances, $trade, $trade->getFromCoin(), $trade->getFromNbToken(), 'retrait');
                break;
            case TypeType::Recuperation:
            case TypeType::Stacking:
                $this->credit($balances, $trade->getFromCoin(), $trade->getFromNbToken());
                break;
            default:
                break;
        }

        return $invalid;
    }

    private function debitAndCheck(array &$balances, CrTrade $trade, ?string $coin, ?float $qty, string $action): ?array
    {
        $this->credit($balances, $coin, $qty === null ? null : -$qty);
        $deficit = $this->deficitOf($balances, $coin);

        return $deficit === null ? null : $this->alert($trade, $coin, $action, $qty, $deficit);
    }

    private function credit(array &$balances, ?string $coin, ?float $qty): void
    {
        if (!$coin || $qty === null) {
            return;
        }

        $balances[$coin] = ($balances[$coin] ?? 0.0) + $qty;
    }

    private function deficitOf(array $balances, ?string $coin): ?float
    {
        if (!$coin || !isset($balances[$coin]) || $balances[$coin] >= -self::DEFICIT_EPSILON) {
            return null;
        }

        return -$balances[$coin];
    }

    private function alert(CrTrade $trade, string $coin, string $action, ?float $qty, float $deficit): array
    {
        return [
            'id' => $trade->getId(),
            'tradeAt' => $trade->getTradeAt()->format(DATE_ATOM),
            'coin' => $coin,
            'action' => $action,
            'qty' => $qty,
            'deficit' => $deficit,
        ];
    }
}
