<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Maps Crypto.com Exchange's private REST responses (CryptocomApiClient::fetchTrades/
 * fetchDepositHistory/fetchWithdrawHistory) into the same array shape as
 * CryptoImportParserInterface::parse(), so trades imported via the API behave identically to ones
 * imported via CSV once persisted as CrTrade.
 *
 * Like BinanceApiTransactionMapper, a trade's fee ('fees', 'fee_instrument_name') can be in an asset
 * other than the trade's base/quote coin, so costPrice/costCoin track it honestly instead of assuming
 * it's always the quote/fiat currency; totalReal/total both hold the trade's gross quote value
 * (traded_quantity * traded_price) for the same reason netting wouldn't be meaningful.
 *
 * Only deposits with status 1 (Arrived) and withdrawals with status 5 (Completed) are mapped — pending/
 * failed/cancelled entries are skipped, matching how a manual CSV export would only ever show completed
 * movements.
 */
class CryptocomApiTransactionMapper
{
    private const DEPOSIT_STATUS_ARRIVED = '1';
    private const WITHDRAWAL_STATUS_COMPLETED = '5';

    public function getSourceName(): string
    {
        return 'Crypto.com Exchange API';
    }

    /**
     * @param list<array<string, mixed>> $trades as returned by CryptocomApiClient::fetchTrades()
     * @param list<array<string, mixed>> $deposits as returned by CryptocomApiClient::fetchDepositHistory()
     * @param list<array<string, mixed>> $withdrawals as returned by CryptocomApiClient::fetchWithdrawHistory()
     * @param array<string, array{base: string, quote: string}> $symbolMap as returned by
     *                                                                     CryptocomApiClient::fetchSymbolMap()
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
    public function map(array $trades, array $deposits, array $withdrawals, array $symbolMap): array
    {
        $result = [];

        foreach ($trades as $trade) {
            $mapped = $this->mapTrade($trade, $symbolMap);
            if ($mapped !== null) {
                $result[] = $mapped;
            }
        }

        foreach ($deposits as $deposit) {
            $mapped = $this->mapDeposit($deposit);
            if ($mapped !== null) {
                $result[] = $mapped;
            }
        }

        foreach ($withdrawals as $withdrawal) {
            $mapped = $this->mapWithdrawal($withdrawal);
            if ($mapped !== null) {
                $result[] = $mapped;
            }
        }

        return $result;
    }

    private function mapTrade(array $trade, array $symbolMap): ?array
    {
        $instrument = $trade['instrument_name'] ?? null;
        $tradeId = $trade['trade_id'] ?? null;
        $pair = $instrument !== null ? ($symbolMap[$instrument] ?? null) : null;

        if ($tradeId === null || $pair === null) {
            return null;
        }

        $qty = abs((float) ($trade['traded_quantity'] ?? 0));
        $price = abs((float) ($trade['traded_price'] ?? 0));
        $quoteQty = $qty * $price;
        if ($qty < 0.00000001 || $quoteQty < 0.00000001) {
            return null;
        }

        $tradeAt = new \DateTimeImmutable('@' . intdiv((int) ($trade['create_time'] ?? 0), 1000));
        $fee = abs((float) ($trade['fees'] ?? 0));
        $feeCoin = $trade['fee_instrument_name'] ?? $pair['quote'];
        $importedId = 't-' . $instrument . '-' . $tradeId;

        if (($trade['side'] ?? null) === 'BUY') {
            return [
                'importedId' => $importedId,
                'tradeAt' => $tradeAt,
                'type' => TypeType::Achat,
                'fromCoin' => $pair['quote'],
                'fromNbToken' => $quoteQty,
                'toCoin' => $pair['base'],
                'toNbToken' => $qty,
                'costPrice' => $fee,
                'costCoin' => $feeCoin,
                'totalReal' => $quoteQty,
                'total' => $quoteQty,
            ];
        }

        if (($trade['side'] ?? null) === 'SELL') {
            return [
                'importedId' => $importedId,
                'tradeAt' => $tradeAt,
                'type' => TypeType::Vente,
                'fromCoin' => $pair['base'],
                'fromNbToken' => $qty,
                'toCoin' => $pair['quote'],
                'toNbToken' => $quoteQty,
                'costPrice' => $fee,
                'costCoin' => $feeCoin,
                'totalReal' => $quoteQty,
                'total' => $quoteQty,
            ];
        }

        return null;
    }

    private function mapDeposit(array $deposit): ?array
    {
        if ((string) ($deposit['status'] ?? '') !== self::DEPOSIT_STATUS_ARRIVED) {
            return null;
        }

        $id = $deposit['id'] ?? null;
        $coin = $deposit['currency'] ?? null;
        $amount = abs((float) ($deposit['amount'] ?? 0));

        if ($id === null || $coin === null || $amount < 0.00000001) {
            return null;
        }

        $tradeAt = new \DateTimeImmutable('@' . intdiv((int) ($deposit['create_time'] ?? 0), 1000));

        return [
            'importedId' => 'd-' . $id,
            'tradeAt' => $tradeAt,
            'type' => TypeType::Depot,
            'fromCoin' => $coin,
            'fromNbToken' => $amount,
            'toCoin' => $coin,
            'toNbToken' => $amount,
            'costPrice' => 0.0,
            'costCoin' => $coin,
            'totalReal' => $coin === 'EUR' ? $amount : 0.0,
            'total' => $coin === 'EUR' ? $amount : 0.0,
        ];
    }

    private function mapWithdrawal(array $withdrawal): ?array
    {
        if ((string) ($withdrawal['status'] ?? '') !== self::WITHDRAWAL_STATUS_COMPLETED) {
            return null;
        }

        $id = $withdrawal['id'] ?? null;
        $coin = $withdrawal['currency'] ?? null;
        $amount = abs((float) ($withdrawal['amount'] ?? 0)) + abs((float) ($withdrawal['fee'] ?? 0));

        if ($id === null || $coin === null || $amount < 0.00000001) {
            return null;
        }

        $tradeAt = new \DateTimeImmutable('@' . intdiv((int) ($withdrawal['create_time'] ?? 0), 1000));

        return [
            'importedId' => 'w-' . $id,
            'tradeAt' => $tradeAt,
            'type' => TypeType::Retrait,
            'fromCoin' => $coin,
            'fromNbToken' => $amount,
            'toCoin' => $coin,
            'toNbToken' => $amount,
            'costPrice' => 0.0,
            'costCoin' => $coin,
            'totalReal' => $coin === 'EUR' ? $amount : 0.0,
            'total' => $coin === 'EUR' ? $amount : 0.0,
        ];
    }
}
