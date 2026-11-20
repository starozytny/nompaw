<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Single source of truth for the EUR totalReal/total of a Binance Achat/Vente — shared by every Binance
 * importer (BinanceHistoryParser, BinanceFiatPurchaseParser, BinanceApiTransactionMapper) and by the
 * app:crypto:binance:fix-totals backfill, so already-imported trades end up exactly as a fresh import would.
 *
 * Follows the same convention as the other platforms (see KrakenApiTransactionMapper):
 * - Only a trade with an EUR leg gets an EUR total. A crypto-to-crypto (or crypto-to-stablecoin, e.g.
 *   BTC/USDT) trade keeps 0/0: CrTaxReportService adds every Achat's total to the acquisition cost and
 *   CrTradeReplayService moves "Dispo" by totalReal, so valuing a swap in EUR would double-count money
 *   that was already counted when the EUR first came in.
 * - Achat EUR → crypto: total = EUR that left the balance (fromNbToken, fees included — the acquisition
 *   cost), totalReal = that minus an EUR fee. Binance only charges an EUR fee on a buy for "Buy Crypto"
 *   fiat purchases, where the fee is already included in the spent amount; spot buys are charged in the
 *   received asset or BNB.
 * - Vente crypto → EUR: Binance reports the gross EUR proceeds (toNbToken) with the fee as a separate
 *   amount, so total = gross, totalReal = gross minus an EUR fee (net received — the "prix de cession").
 */
final class BinanceEurTotals
{
    /**
     * @return array{totalReal: float, total: float}
     */
    public static function compute(int $type, string $fromCoin, float $fromNbToken, string $toCoin, ?float $toNbToken, float $costPrice, string $costCoin): array
    {
        $eurFee = $costCoin === 'EUR' ? abs($costPrice) : 0.0;

        if ($type === TypeType::Achat && $fromCoin === 'EUR') {
            $total = abs($fromNbToken);

            return ['totalReal' => round($total - $eurFee, 2), 'total' => round($total, 2)];
        }

        if ($type === TypeType::Vente && $toCoin === 'EUR') {
            $total = abs((float) $toNbToken);

            return ['totalReal' => round($total - $eurFee, 2), 'total' => round($total, 2)];
        }

        return ['totalReal' => 0.0, 'total' => 0.0];
    }
}
