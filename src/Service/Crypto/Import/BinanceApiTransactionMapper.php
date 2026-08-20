<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Maps Binance's private REST responses (BinanceApiClient::fetchMyTrades/fetchDepositHistory/
 * fetchWithdrawHistory) into the same array shape as CryptoImportParserInterface::parse(), so trades
 * imported via the API behave identically to ones imported via CSV once persisted as CrTrade.
 *
 * Unlike Kraken/Coinbase, Binance's commission on a trade can be charged in an asset that is neither the
 * base nor the quote coin of that trade (e.g. paid in BNB when the fee-discount option is enabled), so
 * costPrice/costCoin here track the fee honestly in whatever asset Binance actually charged it in, rather
 * than assuming it's always the quote/fiat currency — totalReal/total both hold the trade's gross quote
 * value (quoteQty) since netting a same-asset fee against it (as KrakenApiTransactionMapper does) isn't
 * meaningful when the fee is in a third asset.
 *
 * Only deposits with status 1 (success) and withdrawals with status 6 (completed) are mapped — pending/
 * failed/cancelled entries are skipped, matching how a manual CSV export would only ever show completed
 * movements.
 */
class BinanceApiTransactionMapper
{
    private const DEPOSIT_STATUS_SUCCESS = 1;
    private const WITHDRAW_STATUS_COMPLETED = 6;

    public function getSourceName(): string
    {
        return 'Binance API';
    }

    /**
     * @param list<array<string, mixed>> $trades as returned by BinanceApiClient::fetchMyTrades(), each
     *                                            still carrying its 'symbol'
     * @param list<array<string, mixed>> $deposits as returned by BinanceApiClient::fetchDepositHistory()
     * @param list<array<string, mixed>> $withdrawals as returned by BinanceApiClient::fetchWithdrawHistory()
     * @param array<string, array{base: string, quote: string}> $symbolMap as returned by
     *                                                                     BinanceApiClient::fetchSymbolMap()
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
        $symbol = $trade['symbol'] ?? null;
        $id = $trade['id'] ?? null;
        $pair = $symbol !== null ? ($symbolMap[$symbol] ?? null) : null;

        if ($id === null || $pair === null) {
            return null;
        }

        $qty = abs((float) ($trade['qty'] ?? 0));
        $quoteQty = abs((float) ($trade['quoteQty'] ?? 0));
        if ($qty < 0.00000001 || $quoteQty < 0.00000001) {
            return null;
        }

        $tradeAt = new \DateTimeImmutable('@' . intdiv((int) ($trade['time'] ?? 0), 1000));
        $commission = abs((float) ($trade['commission'] ?? 0));
        $commissionAsset = $trade['commissionAsset'] ?? $pair['quote'];
        $isBuyer = (bool) ($trade['isBuyer'] ?? false);

        if ($isBuyer) {
            return [
                'importedId' => 't-' . $symbol . '-' . $id,
                'tradeAt' => $tradeAt,
                'type' => TypeType::Achat,
                'fromCoin' => $pair['quote'],
                'fromNbToken' => $quoteQty,
                'toCoin' => $pair['base'],
                'toNbToken' => $qty,
                'costPrice' => $commission,
                'costCoin' => $commissionAsset,
                'totalReal' => $quoteQty,
                'total' => $quoteQty,
            ];
        }

        return [
            'importedId' => 't-' . $symbol . '-' . $id,
            'tradeAt' => $tradeAt,
            'type' => TypeType::Vente,
            'fromCoin' => $pair['base'],
            'fromNbToken' => $qty,
            'toCoin' => $pair['quote'],
            'toNbToken' => $quoteQty,
            'costPrice' => $commission,
            'costCoin' => $commissionAsset,
            'totalReal' => $quoteQty,
            'total' => $quoteQty,
        ];
    }

    private function mapDeposit(array $deposit): ?array
    {
        if ((int) ($deposit['status'] ?? -1) !== self::DEPOSIT_STATUS_SUCCESS) {
            return null;
        }

        $id = $deposit['id'] ?? $deposit['txId'] ?? null;
        $coin = $deposit['coin'] ?? null;
        $amount = abs((float) ($deposit['amount'] ?? 0));

        if ($id === null || $coin === null || $amount < 0.00000001) {
            return null;
        }

        $tradeAt = new \DateTimeImmutable('@' . intdiv((int) ($deposit['insertTime'] ?? 0), 1000));

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
        if ((int) ($withdrawal['status'] ?? -1) !== self::WITHDRAW_STATUS_COMPLETED) {
            return null;
        }

        $id = $withdrawal['id'] ?? null;
        $coin = $withdrawal['coin'] ?? null;
        $amount = abs((float) ($withdrawal['amount'] ?? 0)) + abs((float) ($withdrawal['transactionFee'] ?? 0));

        if ($id === null || $coin === null || $amount < 0.00000001) {
            return null;
        }

        $applyTime = $withdrawal['applyTime'] ?? $withdrawal['completeTime'] ?? null;
        $tradeAt = $applyTime !== null ? new \DateTimeImmutable((string) $applyTime) : new \DateTimeImmutable();

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
