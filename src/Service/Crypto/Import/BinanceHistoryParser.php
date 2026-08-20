<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Binance "Historique des transactions" CSV export — a flat per-token-movement ledger (one row per
 * balance change: User ID, UTC time, Account, Operation, Coin, signed Change, Remark), covering every
 * product (Spot, Simple Earn, Staking, Launchpool...), not just trades. Binance's own export tool
 * currently lists ~50 distinct "Opération" values across a real multi-year account history; this parser
 * buckets them into a handful of CrTrade types rather than hardcoding every one:
 *
 *  - A real spot conversion (market order or Binance Convert) isn't one row — it's 2 or 3 rows sharing
 *    the same timestamp: one outflow leg (Sell / Transaction Spend / Transaction Sold / the negative
 *    side of a Binance Convert pair), one inflow leg (Buy / Transaction Buy / Transaction Revenue / the
 *    positive Convert leg), and an optional Fee/Transaction Fee leg. Several unrelated trades can also
 *    share the exact same timestamp (down to the second) — and, confirmed against a real export, their
 *    legs aren't always interleaved per-trade ("sell, fee, buy" three times over); they can just as well
 *    be batched by role instead ("fee, buy, fee, buy, sell, sell"), so pairing can't rely on file-order
 *    contiguity. Instead, every trade-leg row sharing one timestamp is bucketed by role (outflows,
 *    inflows, fees) preserving each bucket's own relative order, then zipped positionally — i-th outflow
 *    with i-th inflow (and i-th fee, if there is one) — which reconstructs both orderings correctly and
 *    degrades gracefully (a stray unpaired leg is kept as its own ACategoriser entry) when the counts
 *    don't line up.
 *  - Recurring yield (Simple Earn/Staking/ETH2/BNB Vault interest) → Stacking. One-off bonuses (airdrops,
 *    cashback, commission rebates, distributions) → Recuperation. Moving funds into/out of a locked
 *    product or another Binance wallet (Earn/Staking subscriptions & redemptions, Spot↔Funding transfers)
 *    doesn't change what the user owns, so it's recorded as Transfert — CrTrade's running-balance math
 *    ignores that type, same as a same-coin transfer between exchanges.
 *  - "Small Assets Exchange BNB" (Binance's automatic dust-to-BNB sweep) can bundle many unrelated small
 *    token disposals and several partial BNB credits under one timestamp with no reliable 1:1 pairing —
 *    each row is kept individually as an ACategoriser entry for manual review rather than guessing wrong.
 *  - "Deposit"/"Withdraw" rows are skipped for crypto (already covered, with a real transaction id and
 *    more detail, by BinanceDepositParser/BinanceWithdrawalParser) — only fiat (EUR) deposits are kept
 *    here, since Binance's dedicated deposit export is on-chain/crypto only. "Fiat Withdrawal" is its own
 *    separate operation label and isn't covered by the dedicated withdrawal export, so it's kept too.
 *  - Anything not recognized above is kept as ACategoriser with Binance's own operation label, never
 *    silently dropped.
 *
 * There's no per-row transaction id in this export, so importedId is a hash of each entry's own content
 * (or of the paired legs, for a trade), with a per-signature occurrence counter for exact duplicates —
 * stable across re-imports of a re-downloaded (growing) export as long as row order for already-seen
 * rows doesn't change, which holds since this export is the full account history in chronological order.
 */
class BinanceHistoryParser implements CryptoImportParserInterface
{
    private const OUTFLOW_OPS = ['Sell', 'Transaction Spend', 'Transaction Sold'];
    private const INFLOW_OPS = ['Buy', 'Transaction Buy', 'Transaction Revenue'];
    private const FEE_OPS = ['Fee', 'Transaction Fee'];

    private const STACKING_OPS = [
        'Simple Earn Flexible Interest', 'Staking Rewards', 'Simple Earn Locked Rewards',
        'ETH 2.0 Staking Rewards', 'BNB Vault Rewards',
    ];

    private const BONUS_OPS = [
        'Simple Earn Flexible Airdrop', 'HODLer Airdrops Distribution', 'Airdrop Assets',
        'Airdrop Reward Distribution', 'Launchpool Airdrop - User Claim Distribution',
        'Launchpool Airdrop - System Distribution', 'Commission Rebate', 'Cashback',
        'Distribution', 'Token Swap - Distribution', 'DOT Slot Auction Rewards',
    ];

    private const TRANSFER_OPS = [
        'Simple Earn Flexible Subscription', 'Simple Earn Flexible Redemption',
        'Simple Earn Locked Subscription', 'Simple Earn Locked Redemption',
        'Staking Purchase', 'Staking Redemption', 'Launchpool Subscription/Redemption',
        'ETH 2.0 Staking', 'ETH 2.0 Staking Withdrawals', 'DOT Slot Auction Staking',
        'DOT Slot Auction Redemption', 'Transfer Between Spot and Funding', 'Transfer',
    ];

    private const FIAT_COINS = ['EUR', 'USD', 'GBP', 'CHF'];

    /** @var array<string, int> content signature => number of times already seen, for stable dedup ids */
    private array $idOccurrences = [];

    public function getSourceName(): string
    {
        return 'Binance';
    }

    public function supports(array $rows): bool
    {
        $header = $rows[0] ?? [];

        return ($header[0] ?? null) === 'Identifiant utilisateur'
            && ($header[1] ?? null) === 'Durée'
            && ($header[3] ?? null) === 'Opération'
            && ($header[4] ?? null) === 'Jeton'
            && ($header[5] ?? null) === 'Change';
    }

    public function parse(array $rows): array
    {
        if (!$this->supports($rows)) {
            return [];
        }

        $this->idOccurrences = [];

        $entries = [];
        foreach (array_slice($rows, 1) as $row) {
            if (count($row) < 6 || $row[1] === '') {
                continue;
            }

            $entries[] = [
                'time' => $row[1],
                'op' => $row[3],
                'coin' => $row[4],
                'change' => (float) $row[5],
            ];
        }

        // Every trade-leg row is bucketed by exact timestamp — file-order contiguity between legs of the
        // same trade isn't guaranteed (see class docblock), so this can't be a single streaming pass.
        $clusterGroups = [];
        foreach ($entries as $entry) {
            if ($this->isTradeLeg($entry['op'])) {
                $clusterGroups[$entry['time']][] = $entry;
            }
        }
        $clusterHandled = [];

        // Same idea for "Binance Convert" pairs, which share one operation label for both legs instead
        // of the Sell/Buy/Fee distinction above.
        $convertGroups = [];
        foreach ($entries as $entry) {
            if ($entry['op'] === 'Binance Convert') {
                $convertGroups[$entry['time']][] = $entry;
            }
        }
        $convertHandled = [];

        $trades = [];
        foreach ($entries as $entry) {
            if ($this->isTradeLeg($entry['op'])) {
                if (isset($clusterHandled[$entry['time']])) {
                    continue;
                }
                $clusterHandled[$entry['time']] = true;

                $trades[] = $this->buildFromCluster($clusterGroups[$entry['time']]);
                continue;
            }

            $trades[] = $this->buildStandaloneEntry($entry, $convertGroups, $convertHandled);
        }

        return array_merge(...$trades);
    }

    private function isTradeLeg(string $op): bool
    {
        return in_array($op, self::OUTFLOW_OPS, true) || in_array($op, self::INFLOW_OPS, true) || in_array($op, self::FEE_OPS, true);
    }

    /**
     * Every trade-leg row sharing one timestamp, which can hold more than one real trade's worth of legs
     * (see class docblock) — bucketed by role, then zipped positionally: i-th outflow with i-th inflow
     * (and i-th fee, if any). A leg left over once its role's bucket runs out of counterparts (mismatched
     * counts — rare/malformed data) is kept as its own ACategoriser entry instead of being dropped.
     *
     * @param list<array{time: string, op: string, coin: string, change: float}> $legs
     * @return list<array>
     */
    private function buildFromCluster(array $legs): array
    {
        $outflows = array_values(array_filter($legs, fn ($leg) => in_array($leg['op'], self::OUTFLOW_OPS, true)));
        $inflows = array_values(array_filter($legs, fn ($leg) => in_array($leg['op'], self::INFLOW_OPS, true)));
        $fees = array_values(array_filter($legs, fn ($leg) => in_array($leg['op'], self::FEE_OPS, true)));

        $pairCount = min(count($outflows), count($inflows));

        $trades = [];
        for ($i = 0; $i < $pairCount; $i++) {
            $trades[] = $this->buildPairedTrade($outflows[$i], $inflows[$i], $fees[$i] ?? null);
        }

        foreach (array_slice($outflows, $pairCount) as $leg) {
            $trades[] = $this->buildSingleLeg($leg['time'], $leg['coin'], $leg['change'], TypeType::ACategoriser, $leg['op']);
        }
        foreach (array_slice($inflows, $pairCount) as $leg) {
            $trades[] = $this->buildSingleLeg($leg['time'], $leg['coin'], $leg['change'], TypeType::ACategoriser, $leg['op']);
        }
        foreach (array_slice($fees, $pairCount) as $leg) {
            $trades[] = $this->buildSingleLeg($leg['time'], $leg['coin'], $leg['change'], TypeType::ACategoriser, $leg['op']);
        }

        return array_merge(...$trades);
    }

    /**
     * @param array{time: string, op: string, coin: string, change: float} $outflow
     * @param array{time: string, op: string, coin: string, change: float} $inflow
     * @param array{time: string, op: string, coin: string, change: float}|null $fee
     * @return list<array> exactly 1 trade
     */
    private function buildPairedTrade(array $outflow, array $inflow, ?array $fee): array
    {
        $type = $inflow['coin'] === 'EUR' ? TypeType::Vente : TypeType::Achat;

        return [[
            'importedId' => $this->makeImportedId(sprintf('%s|trade|%s|%s|%s|%s', $outflow['time'], $outflow['coin'], $outflow['change'], $inflow['coin'], $inflow['change'])),
            'tradeAt' => new \DateTimeImmutable($outflow['time']),
            'type' => $type,
            'fromCoin' => $outflow['coin'],
            'fromNbToken' => abs($outflow['change']),
            'toCoin' => $inflow['coin'],
            'toNbToken' => $inflow['change'],
            'costPrice' => $fee !== null ? abs($fee['change']) : 0.0,
            'costCoin' => $fee !== null ? $fee['coin'] : $inflow['coin'],
            'totalReal' => 0.0,
            'total' => 0.0,
        ]];
    }

    /**
     * @param array{time: string, op: string, coin: string, change: float} $entry
     * @param array<string, list<array>> $convertGroups
     * @param array<string, true> $convertHandled
     * @return list<array>
     */
    private function buildStandaloneEntry(array $entry, array $convertGroups, array &$convertHandled): array
    {
        $time = $entry['time'];
        $op = $entry['op'];
        $coin = $entry['coin'];
        $change = $entry['change'];

        if ($op === 'Binance Convert') {
            return $this->buildConvertPair($time, $convertGroups[$time] ?? [$entry], $convertHandled);
        }

        if ($op === 'Small Assets Exchange BNB') {
            // A single dust-sweep timestamp can bundle several unrelated small disposals and several
            // partial BNB credits with no reliable 1:1 pairing — kept individually for manual review.
            return $this->buildSingleLeg($time, $coin, $change, TypeType::ACategoriser, $op);
        }

        if ($op === 'Deposit') {
            if (!in_array($coin, self::FIAT_COINS, true)) {
                return []; // crypto deposits are covered by BinanceDepositParser
            }

            return $this->buildSingleLeg($time, $coin, $change, TypeType::Depot);
        }

        if ($op === 'Withdraw') {
            return []; // covered by BinanceWithdrawalParser
        }

        if ($op === 'Fiat Withdrawal') {
            return $this->buildSingleLeg($time, $coin, $change, TypeType::Retrait);
        }

        if (in_array($op, self::STACKING_OPS, true)) {
            return $this->buildSingleLeg($time, $coin, $change, TypeType::Stacking);
        }

        if (in_array($op, self::BONUS_OPS, true)) {
            return $this->buildSingleLeg($time, $coin, $change, TypeType::Recuperation);
        }

        if (in_array($op, self::TRANSFER_OPS, true)) {
            return $this->buildSingleLeg($time, $coin, $change, TypeType::Transfert);
        }

        return $this->buildSingleLeg($time, $coin, $change, TypeType::ACategoriser, $op);
    }

    /**
     * @param list<array{time: string, op: string, coin: string, change: float}> $legs
     * @param array<string, true> $convertHandled
     * @return list<array>
     */
    private function buildConvertPair(string $time, array $legs, array &$convertHandled): array
    {
        if (isset($convertHandled[$time])) {
            return [];
        }
        $convertHandled[$time] = true;

        $outflow = null;
        $inflow = null;
        foreach ($legs as $leg) {
            if ($outflow === null && $leg['change'] < 0) {
                $outflow = $leg;
            } elseif ($inflow === null && $leg['change'] > 0) {
                $inflow = $leg;
            }
        }

        if (count($legs) !== 2 || $outflow === null || $inflow === null) {
            $trades = [];
            foreach ($legs as $leg) {
                $trades[] = $this->buildSingleLeg($leg['time'], $leg['coin'], $leg['change'], TypeType::ACategoriser, $leg['op']);
            }

            return array_merge(...$trades);
        }

        $type = $inflow['coin'] === 'EUR' ? TypeType::Vente : TypeType::Achat;

        return [[
            'importedId' => $this->makeImportedId(sprintf('%s|convert|%s|%s|%s|%s', $time, $outflow['coin'], $outflow['change'], $inflow['coin'], $inflow['change'])),
            'tradeAt' => new \DateTimeImmutable($time),
            'type' => $type,
            'fromCoin' => $outflow['coin'],
            'fromNbToken' => abs($outflow['change']),
            'toCoin' => $inflow['coin'],
            'toNbToken' => $inflow['change'],
            'costPrice' => 0.0,
            'costCoin' => $inflow['coin'],
            'totalReal' => 0.0,
            'total' => 0.0,
        ]];
    }

    /**
     * @return list<array> 0 or 1 trade (dropped if the moved quantity is negligible)
     */
    private function buildSingleLeg(string $time, string $coin, float $change, int $type, ?string $rawCategory = null): array
    {
        $qty = abs($change);
        if ($qty < 0.00000001) {
            return [];
        }

        return [[
            'importedId' => $this->makeImportedId(sprintf('%s|%s|%s|%s', $time, $rawCategory ?? $type, $coin, $change)),
            'tradeAt' => new \DateTimeImmutable($time),
            'type' => $type,
            'fromCoin' => $coin,
            'fromNbToken' => $qty,
            'toCoin' => $coin,
            'toNbToken' => $qty,
            'costPrice' => 0.0,
            'costCoin' => $coin,
            'totalReal' => 0.0,
            'total' => 0.0,
            'rawCategory' => $rawCategory,
        ]];
    }

    private function makeImportedId(string $signature): string
    {
        $occurrence = $this->idOccurrences[$signature] ?? 0;
        $this->idOccurrences[$signature] = $occurrence + 1;

        return hash('sha1', $signature . '#' . $occurrence);
    }
}
