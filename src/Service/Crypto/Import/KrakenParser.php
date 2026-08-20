<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Kraken "ledgers" CSV export. Unlike the app's other transaction types, a single real trade produces
 * TWO ledger rows sharing the same `refid` (one negative — given up, one positive — received), so
 * this parser groups by refid before building trades (the previous, now-unused AdminCryptoKrakenCommand
 * did not do this pairing at all).
 *
 * Columns (0-indexed): txid(0), refid(1), time(2), type(3), subtype(4), aclass(5), asset(6),
 * wallet(7), amount(8), fee(9), balance(10).
 *
 * Verified against real data: Kraken's `balance` column subtracts the fee IN ADDITION to `amount`,
 * so the real cash impact of a leg is `amount - fee` (sell proceeds net of fee) or, for the leg being
 * spent, `abs(amount) + fee` (full debit including fee) — matches this app's existing totalReal/total
 * convention (totalReal = net for Vente, total = totalReal + fee for Achat).
 */
class KrakenParser implements CryptoImportParserInterface
{
    public function getSourceName(): string
    {
        return 'Kraken';
    }

    public function supports(array $rows): bool
    {
        $header = $rows[0] ?? [];

        return ($header[0] ?? null) === 'txid' && ($header[1] ?? null) === 'refid' && ($header[3] ?? null) === 'type';
    }

    public function parse(array $rows): array
    {
        $dataRows = array_slice($rows, 1);
        $trades = [];
        $tradeGroups = [];

        foreach ($dataRows as $row) {
            if (count($row) < 11) {
                continue;
            }

            $type = $row[3];

            if ($type === 'trade') {
                $tradeGroups[$row[1]][] = $row;
                continue;
            }

            $tradeAt = new \DateTimeImmutable($row[2]);
            $asset = $row[6];
            $amount = (float) $row[8];
            $fee = (float) $row[9];

            if ($type === 'deposit') {
                $qty = abs($amount) - $fee;
                $trades[] = $this->buildSingleCoinTrade($row[0], $tradeAt, TypeType::Depot, $asset, $qty);
            } elseif ($type === 'withdrawal') {
                $qty = abs($amount) + $fee;
                $trades[] = $this->buildSingleCoinTrade($row[0], $tradeAt, TypeType::Retrait, $asset, $qty);
            } elseif ($type === 'transfer') {
                $trades[] = $this->buildSingleCoinTrade($row[0], $tradeAt, TypeType::Recuperation, $asset, abs($amount));
            } else {
                // Any other ledger type (e.g. "staking", "adjustment") isn't dropped — kept as
                // ACategoriser with Kraken's own type string so the user can see and reclassify it
                // instead of it silently vanishing from the import.
                $trades[] = $this->buildSingleCoinTrade($row[0], $tradeAt, TypeType::ACategoriser, $asset, abs($amount), $type);
            }
        }

        foreach ($tradeGroups as $refid => $group) {
            if (count($group) !== 2) {
                // Unpaired dust row (seen once in real data: a ~1e-7 residual with no matching leg) —
                // treat as a free credit rather than silently dropping it.
                foreach ($group as $row) {
                    $trades[] = $this->buildSingleCoinTrade($row[0], new \DateTimeImmutable($row[2]), TypeType::Recuperation, $row[6], abs((float) $row[8]));
                }
                continue;
            }

            $trades[] = $this->buildTradeFromPair($refid, $group[0], $group[1]);
        }

        return array_values(array_filter($trades));
    }

    private function buildTradeFromPair(string $refid, array $rowA, array $rowB): ?array
    {
        $eurLeg = $rowA[6] === 'EUR' ? $rowA : ($rowB[6] === 'EUR' ? $rowB : null);
        $cryptoLeg = $eurLeg === $rowA ? $rowB : $rowA;

        if ($eurLeg === null) {
            // no EUR leg in real data, but handle defensively as a crypto-to-crypto swap
            $negative = ((float) $rowA[8]) < 0 ? $rowA : $rowB;
            $positive = $negative === $rowA ? $rowB : $rowA;

            return [
                'importedId' => $refid,
                'tradeAt' => new \DateTimeImmutable($negative[2]),
                'type' => TypeType::Vente,
                'fromCoin' => $negative[6],
                'fromNbToken' => abs((float) $negative[8]),
                'toCoin' => $positive[6],
                'toNbToken' => (float) $positive[8],
                'costPrice' => 0.0,
                'costCoin' => $positive[6],
                'totalReal' => 0.0,
                'total' => 0.0,
            ];
        }

        $eurAmount = (float) $eurLeg[8];
        $eurFee = (float) $eurLeg[9];
        $cryptoAmount = (float) $cryptoLeg[8];
        $tradeAt = new \DateTimeImmutable($eurLeg[2]);

        if ($cryptoAmount > 0) {
            // Achat: EUR leg is negative (spent). fromNbToken is the full EUR amount debited
            // (subtotal + fee), matching the already-imported Coinbase data's convention where
            // fromNbToken == "Total (inclusive of fees)", not the pre-fee subtotal.
            $totalReal = abs($eurAmount);
            $total = $totalReal + $eurFee;

            return [
                'importedId' => $refid,
                'tradeAt' => $tradeAt,
                'type' => TypeType::Achat,
                'fromCoin' => 'EUR',
                'fromNbToken' => $total,
                'toCoin' => $cryptoLeg[6],
                'toNbToken' => $cryptoAmount,
                'costPrice' => $eurFee,
                'costCoin' => 'EUR',
                'totalReal' => $totalReal,
                'total' => $total,
            ];
        }

        // Vente: EUR leg is positive (received), net of fee per this app's totalReal convention
        $totalReal = $eurAmount - $eurFee;

        return [
            'importedId' => $refid,
            'tradeAt' => $tradeAt,
            'type' => TypeType::Vente,
            'fromCoin' => $cryptoLeg[6],
            'fromNbToken' => abs($cryptoAmount),
            'toCoin' => 'EUR',
            'toNbToken' => $totalReal,
            'costPrice' => $eurFee,
            'costCoin' => 'EUR',
            'totalReal' => $totalReal,
            'total' => $totalReal + $eurFee,
        ];
    }

    private function buildSingleCoinTrade(string $id, \DateTimeImmutable $tradeAt, int $type, string $coin, float $qty, ?string $rawCategory = null): ?array
    {
        if (abs($qty) < 0.00000001) {
            return null;
        }

        return [
            'importedId' => $id,
            'tradeAt' => $tradeAt,
            'type' => $type,
            'fromCoin' => $coin,
            'fromNbToken' => $qty,
            'toCoin' => $coin,
            'toNbToken' => $qty,
            'costPrice' => 0.0,
            'costCoin' => $coin,
            'totalReal' => $coin === 'EUR' ? $qty : 0.0,
            'total' => $coin === 'EUR' ? $qty : 0.0,
            'rawCategory' => $rawCategory,
        ];
    }
}
