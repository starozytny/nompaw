<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Maps Coinbase v2 API transaction objects (as fetched by CoinbaseApiClient::fetchTransactions, which
 * enriches buy/sell entries with their linked sub-resource under 'detail') into the same array shape as
 * CryptoImportParserInterface::parse(), so trades imported via the API behave identically to ones imported
 * via CSV once persisted as CrTrade.
 *
 * transfer/exchange_deposit/exchange_withdrawal/pro_deposit/pro_withdrawal/vault_withdrawal don't appear in
 * the CSV export at all (they come from Coinbase Exchange/Pro/Vault, only visible via the API) but are
 * genuine movements between the user's own accounts, not disposals — mapped to TypeType::Transfert (defined
 * in the enum but never produced by the CSV parser) rather than dropped, so they stay visible for review.
 *
 * Any other Coinbase transaction `type` value not explicitly handled above falls back to
 * TypeType::ACategoriser with `rawCategory` set to Coinbase's own type string, so the user can see and
 * manually reclassify it instead of it being silently dropped. A buy/sell whose 'detail' sub-resource
 * fetch failed (CoinbaseApiClient::fetchBuySellDetail logs why) gets the same ACategoriser fallback
 * instead of vanishing from the import.
 */
class CoinbaseApiTransactionMapper
{
    private const TRANSFER_TYPES = ['transfer', 'exchange_deposit', 'exchange_withdrawal', 'pro_deposit', 'pro_withdrawal', 'vault_withdrawal'];

    public function getSourceName(): string
    {
        return 'Coinbase API';
    }

    /**
     * @param list<array<string, mixed>> $transactions as returned by CoinbaseApiClient::fetchTransactions()
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
    public function map(array $transactions): array
    {
        $trades = [];

        foreach ($transactions as $transaction) {
            $trade = $this->mapOne($transaction);
            if ($trade !== null) {
                $trades[] = $trade;
            }
        }

        return $trades;
    }

    private function mapOne(array $transaction): ?array
    {
        $id = $transaction['id'] ?? null;
        $type = $transaction['type'] ?? null;
        $createdAt = $transaction['created_at'] ?? null;
        $asset = $transaction['amount']['currency'] ?? null;

        if ($id === null || $type === null || $createdAt === null || $asset === null) {
            return null;
        }

        $tradeAt = new \DateTimeImmutable($createdAt);
        $quantity = abs((float) ($transaction['amount']['amount'] ?? 0));

        if ($type === 'buy') {
            return $this->buildBuy($id, $tradeAt, $asset, $quantity, $transaction['detail'] ?? null);
        }

        if ($type === 'sell') {
            return $this->buildSell($id, $tradeAt, $asset, $quantity, $transaction['detail'] ?? null);
        }

        if ($type === 'send') {
            $isIncoming = (float) ($transaction['amount']['amount'] ?? 0) > 0;

            return $this->buildSingleCoinTrade($id, $tradeAt, $isIncoming ? TypeType::Recuperation : TypeType::Retrait, $asset, $quantity);
        }

        if (in_array($type, ['staking_reward', 'inflation_reward'], true)) {
            return $this->buildSingleCoinTrade($id, $tradeAt, TypeType::Stacking, $asset, $quantity);
        }

        if ($type === 'fiat_deposit') {
            return $this->buildSingleCoinTrade($id, $tradeAt, TypeType::Depot, $asset, $quantity);
        }

        if ($type === 'fiat_withdrawal') {
            return $this->buildSingleCoinTrade($id, $tradeAt, TypeType::Retrait, $asset, $quantity);
        }

        if (in_array($type, self::TRANSFER_TYPES, true)) {
            return $this->buildSingleCoinTrade($id, $tradeAt, TypeType::Transfert, $asset, $quantity);
        }

        return $this->buildSingleCoinTrade($id, $tradeAt, TypeType::ACategoriser, $asset, $quantity, $type);
    }

    private function buildBuy(string $id, \DateTimeImmutable $tradeAt, string $asset, float $fallbackQuantity, ?array $detail): ?array
    {
        if ($detail === null) {
            // The sub-resource fetch failed (CoinbaseApiClient logs why) — rather than dropping the
            // trade entirely, keep a best-effort single-coin entry so the user notices it's missing its
            // EUR/fee breakdown instead of the trade silently vanishing from the import.
            return $this->buildSingleCoinTrade($id, $tradeAt, TypeType::ACategoriser, $asset, $fallbackQuantity, 'buy (détail indisponible)');
        }

        [$quantity, $subtotal, $total, $fee, $fiatCurrency] = $this->extractBuySellAmounts($detail);

        return [
            'importedId' => $id,
            'tradeAt' => $tradeAt,
            'type' => TypeType::Achat,
            'fromCoin' => $fiatCurrency,
            'fromNbToken' => $total,
            'toCoin' => $asset,
            'toNbToken' => $quantity,
            'costPrice' => $fee,
            'costCoin' => $fiatCurrency,
            'totalReal' => $subtotal,
            'total' => $total,
        ];
    }

    private function buildSell(string $id, \DateTimeImmutable $tradeAt, string $asset, float $fallbackQuantity, ?array $detail): ?array
    {
        if ($detail === null) {
            // Same fallback as buildBuy() — see comment there.
            return $this->buildSingleCoinTrade($id, $tradeAt, TypeType::ACategoriser, $asset, $fallbackQuantity, 'sell (détail indisponible)');
        }

        [$quantity, $subtotal, $total, $fee, $fiatCurrency] = $this->extractBuySellAmounts($detail);

        return [
            'importedId' => $id,
            'tradeAt' => $tradeAt,
            'type' => TypeType::Vente,
            'fromCoin' => $asset,
            'fromNbToken' => $quantity,
            'toCoin' => $fiatCurrency,
            'toNbToken' => $total,
            'costPrice' => $fee,
            'costCoin' => $fiatCurrency,
            'totalReal' => $total,
            'total' => $subtotal,
        ];
    }

    /**
     * @return array{0: float, 1: float, 2: float, 3: float, 4: string} [quantity, subtotal, total, fee, fiatCurrency]
     */
    private function extractBuySellAmounts(array $detail): array
    {
        return [
            abs((float) ($detail['amount']['amount'] ?? 0)),
            abs((float) ($detail['subtotal']['amount'] ?? 0)),
            abs((float) ($detail['total']['amount'] ?? 0)),
            abs((float) ($detail['fee']['amount'] ?? 0)),
            $detail['subtotal']['currency'] ?? $detail['total']['currency'] ?? 'EUR',
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
