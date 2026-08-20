<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Maps Bitpanda's /v1/operations API entries (as fetched by BitpandaApiClient::fetchOperations) into the
 * same array shape as CryptoImportParserInterface::parse().
 *
 * Confirmed from a real logged response (see BitpandaApiClient's docblock): a single real trade produces
 * two legs sharing the same `trade.trade_id` — one with a `currency_id` (fiat) and one with an `asset_id`
 * (crypto) — regardless of which `operation_type` groups them (a "swap" chains two such trades: sell one
 * asset for EUR, then buy another with that EUR). Legs are paired by trade_id the same way
 * KrakenApiTransactionMapper pairs Kraken ledger rows by refid.
 *
 * Bitpanda charges its trade fee via a worse exchange rate (rate vs rate_with_fee) rather than as a
 * separate debit, so unlike Coinbase/Kraken this mapper does NOT add/subtract `trade.fee` to/from the
 * fiat leg's amount for totalReal/total — the leg's `asset_amount` already IS the real amount that moved;
 * fee is only recorded as CrTrade::costPrice for visibility.
 *
 * Legs without a `trade` (deposits, withdrawals, asset mergers, bonus/reward credits...) are mapped from
 * their parent `operation_type`. Confirmed from real data: 'merger_crypto', 'onetime_reward',
 * 'best_reward', 'trading_premium', 'giveaway' — 'deposit'/'withdrawal'/'staking_reward'/'transfer' are
 * still best-effort guesses at plausible values; any other `operation_type` (or a trade leg whose
 * `transaction_type` isn't 'buy'/'sell') falls back to TypeType::ACategoriser with `rawCategory` set to
 * Bitpanda's own type string, so the user can see and manually reclassify it instead of it being
 * silently dropped. A group of legs sharing a trade_id that can't be paired into a single buy/sell (see
 * mapUnpairedTradeLegs()) gets the same ACategoriser treatment, one entry per leg, instead of the whole
 * group vanishing from the import.
 */
class BitpandaApiTransactionMapper
{
    public function getSourceName(): string
    {
        return 'Bitpanda API';
    }

    /**
     * @param list<array<string, mixed>> $operations as returned by BitpandaApiClient::fetchOperations()
     * @param array<string, string> $symbolMap uuid => ticker, as returned by BitpandaApiClient::fetchAssetSymbols()
     * @return list<array{
     *     importedId: string,
     *     tradeAt: \DateTimeImmutable,
     *     type: int,
     *     fromCoin: string,
     *     fromNbToken: float,
     *     toCoin: string,
     *     toNbToken: ?float,
     *     costPrice: float,
     *     costCoin: string,
     *     totalReal: float,
     *     total: float,
     * }>
     */
    public function map(array $operations, array $symbolMap): array
    {
        $trades = [];
        $tradeLegsByTradeId = [];

        foreach ($operations as $operation) {
            $operationType = $operation['operation_type'] ?? null;

            foreach ($operation['transactions'] ?? [] as $leg) {
                $tradeId = $leg['trade']['trade_id'] ?? null;

                if ($tradeId !== null) {
                    $tradeLegsByTradeId[$tradeId][] = $leg;
                    continue;
                }

                $mapped = $this->mapNonTradeLeg($leg, $operationType, $symbolMap);
                if ($mapped !== null) {
                    $trades[] = $mapped;
                }
            }
        }

        foreach ($tradeLegsByTradeId as $tradeId => $legs) {
            $trades = array_merge($trades, $this->buildTradeFromPair((string) $tradeId, $legs, $symbolMap));
        }

        return $trades;
    }

    /**
     * @return list<array> 0, 1 (a matched trade) or up to count($legs) entries (see mapUnpairedTradeLegs())
     */
    private function buildTradeFromPair(string $tradeId, array $legs, array $symbolMap): array
    {
        if (count($legs) !== 2) {
            return $this->mapUnpairedTradeLegs($tradeId, $legs, $symbolMap);
        }

        $fiatLeg = isset($legs[0]['currency_id']) ? $legs[0] : (isset($legs[1]['currency_id']) ? $legs[1] : null);
        $cryptoLeg = $fiatLeg === $legs[0] ? $legs[1] : $legs[0];

        if ($fiatLeg === null || !isset($cryptoLeg['asset_id'])) {
            return $this->mapUnpairedTradeLegs($tradeId, $legs, $symbolMap);
        }

        $type = $fiatLeg['transaction_type'] ?? null;
        $tradeAt = $this->parseDate($fiatLeg['credited_at'] ?? $cryptoLeg['credited_at'] ?? null);
        if ($tradeAt === null) {
            return $this->mapUnpairedTradeLegs($tradeId, $legs, $symbolMap);
        }

        $fiatSymbol = $this->resolveSymbol($fiatLeg['currency_id'], $symbolMap);
        $cryptoSymbol = $this->resolveSymbol($cryptoLeg['asset_id'], $symbolMap);
        $fiatAmount = (float) ($fiatLeg['asset_amount']['value'] ?? 0);
        $cryptoAmount = (float) ($cryptoLeg['asset_amount']['value'] ?? 0);
        $fee = (float) ($fiatLeg['trade']['fee']['value'] ?? $cryptoLeg['trade']['fee']['value'] ?? 0);

        if ($type === 'buy') {
            return [[
                'importedId' => $tradeId,
                'tradeAt' => $tradeAt,
                'type' => TypeType::Achat,
                'fromCoin' => $fiatSymbol,
                'fromNbToken' => $fiatAmount,
                'toCoin' => $cryptoSymbol,
                'toNbToken' => $cryptoAmount,
                'costPrice' => $fee,
                'costCoin' => $fiatSymbol,
                'totalReal' => $fiatAmount,
                'total' => $fiatAmount,
            ]];
        }

        if ($type === 'sell') {
            return [[
                'importedId' => $tradeId,
                'tradeAt' => $tradeAt,
                'type' => TypeType::Vente,
                'fromCoin' => $cryptoSymbol,
                'fromNbToken' => $cryptoAmount,
                'toCoin' => $fiatSymbol,
                'toNbToken' => $fiatAmount,
                'costPrice' => $fee,
                'costCoin' => $fiatSymbol,
                'totalReal' => $fiatAmount,
                'total' => $fiatAmount,
            ]];
        }

        return [[
            'importedId' => $tradeId,
            'tradeAt' => $tradeAt,
            'type' => TypeType::ACategoriser,
            'fromCoin' => $cryptoSymbol,
            'fromNbToken' => $cryptoAmount,
            'toCoin' => $fiatSymbol,
            'toNbToken' => $fiatAmount,
            'costPrice' => $fee,
            'costCoin' => $fiatSymbol,
            'totalReal' => $fiatAmount,
            'total' => $fiatAmount,
            'rawCategory' => $type,
        ]];
    }

    /**
     * Fallback when a group of legs sharing a trade_id can't be paired into a single buy/sell (wrong leg
     * count, no fiat leg, or an unparseable date) — emits one best-effort ACategoriser entry per leg
     * instead of dropping the whole group.
     *
     * @return list<array>
     */
    private function mapUnpairedTradeLegs(string $tradeId, array $legs, array $symbolMap): array
    {
        $trades = [];

        foreach ($legs as $index => $leg) {
            $tradeAt = $this->parseDate($leg['credited_at'] ?? null);
            $assetOrCurrencyId = $leg['asset_id'] ?? $leg['currency_id'] ?? null;
            $qty = (float) ($leg['asset_amount']['value'] ?? 0);

            if ($tradeAt === null || $assetOrCurrencyId === null || abs($qty) < 0.00000001) {
                continue;
            }

            $coin = $this->resolveSymbol($assetOrCurrencyId, $symbolMap);

            $trades[] = [
                'importedId' => $tradeId . '-' . $index,
                'tradeAt' => $tradeAt,
                'type' => TypeType::ACategoriser,
                'fromCoin' => $coin,
                'fromNbToken' => $qty,
                'toCoin' => $coin,
                'toNbToken' => $qty,
                'costPrice' => 0.0,
                'costCoin' => $coin,
                'totalReal' => $coin === 'EUR' ? $qty : 0.0,
                'total' => $coin === 'EUR' ? $qty : 0.0,
                'rawCategory' => $leg['transaction_type'] ?? 'trade (non apparié)',
            ];
        }

        return $trades;
    }

    private function mapNonTradeLeg(array $leg, ?string $operationType, array $symbolMap): ?array
    {
        $id = $leg['transaction_id'] ?? null;
        $tradeAt = $this->parseDate($leg['credited_at'] ?? null);
        $assetOrCurrencyId = $leg['asset_id'] ?? $leg['currency_id'] ?? null;
        $qty = (float) ($leg['asset_amount']['value'] ?? 0);

        if ($id === null || $tradeAt === null || $assetOrCurrencyId === null || abs($qty) < 0.00000001) {
            return null;
        }

        $coin = $this->resolveSymbol($assetOrCurrencyId, $symbolMap);

        $type = match ($operationType) {
            'deposit', 'card_deposit', 'wire_deposit' => TypeType::Depot,
            'withdrawal', 'wire_withdrawal' => TypeType::Retrait,
            'staking_reward', 'staking' => TypeType::Stacking,
            'merger_crypto', 'transfer' => TypeType::Transfert,
            // Free credits (bonus/referral/cashback programs) — no cost basis, same semantics as
            // Coinbase's "Receive"/"Staking Income" or Kraken's unpaired dust rows.
            'onetime_reward', 'best_reward', 'trading_premium', 'giveaway' => TypeType::Recuperation,
            default => TypeType::ACategoriser,
        };

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
            'rawCategory' => $type === TypeType::ACategoriser ? $operationType : null,
        ];
    }

    private function resolveSymbol(string $uuid, array $symbolMap): string
    {
        return $symbolMap[$uuid] ?? $uuid;
    }

    private function parseDate(?string $iso): ?\DateTimeImmutable
    {
        if ($iso === null) {
            return null;
        }

        try {
            return new \DateTimeImmutable($iso);
        } catch (\Throwable) {
            return null;
        }
    }
}
