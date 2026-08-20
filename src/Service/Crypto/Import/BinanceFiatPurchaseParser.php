<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Binance "Historique d'achat de monnaies fiat" CSV export — "Buy Crypto" purchases funded from a fiat
 * balance/card/bank (Binance's fiat-to-crypto gateway), a separate product from Spot trading and not
 * covered anywhere in BinanceHistoryParser.
 *
 * Columns (0-indexed): Durée(0), Méthode(1), Montant à dépenser(2), Montant à recevoir(3), Frais(4),
 * Prix(5), Statut(6), ID de transaction(7). The amount columns combine a number and a currency code in
 * one cell (e.g. "250.00 EUR").
 */
class BinanceFiatPurchaseParser implements CryptoImportParserInterface
{
    public function getSourceName(): string
    {
        return 'Binance';
    }

    public function supports(array $rows): bool
    {
        $header = $rows[0] ?? [];

        return ($header[0] ?? null) === 'Durée'
            && ($header[2] ?? null) === 'Montant à dépenser'
            && ($header[7] ?? null) === 'ID de transaction';
    }

    public function parse(array $rows): array
    {
        $trades = [];

        foreach (array_slice($rows, 1) as $row) {
            if (count($row) < 8 || strtolower($row[6]) !== 'successful') {
                continue;
            }

            [$spentQty, $spentCoin] = $this->parseAmount($row[2]);
            [$receivedQty, $receivedCoin] = $this->parseAmount($row[3]);
            [$fee, $feeCoin] = $this->parseAmount($row[4]);
            if (abs($spentQty) < 0.00000001 || abs($receivedQty) < 0.00000001) {
                continue;
            }

            $trades[] = [
                'importedId' => $row[7],
                'tradeAt' => new \DateTimeImmutable($row[0]),
                'type' => TypeType::Achat,
                'fromCoin' => $spentCoin,
                'fromNbToken' => $spentQty,
                'toCoin' => $receivedCoin,
                'toNbToken' => $receivedQty,
                'costPrice' => $fee,
                'costCoin' => $feeCoin,
                'totalReal' => 0.0,
                'total' => 0.0,
            ];
        }

        return $trades;
    }

    /**
     * @return array{0: float, 1: string}
     */
    private function parseAmount(string $value): array
    {
        $parts = explode(' ', trim($value));
        $currency = array_pop($parts);

        return [(float) implode(' ', $parts), $currency];
    }
}
