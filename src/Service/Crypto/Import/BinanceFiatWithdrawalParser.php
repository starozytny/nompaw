<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Binance "Historique de retrait de monnaies fiat" CSV export — bank transfer (SEPA) withdrawals, each
 * with a real transaction id. BinanceHistoryParser's "Fiat Withdrawal" operation rows are skipped
 * entirely in favor of this dedicated export.
 *
 * Columns (0-indexed): Durée(0), Méthode(1), Montant du retrait(2), Montant à recevoir(3), Frais(4),
 * Statut(5), ID de transaction(6). The amount columns combine a number and a currency code in one cell
 * (e.g. "184.2 EUR"). "Montant du retrait" is the gross amount debited from the Binance balance (before
 * the transfer fee is taken out on its way to the bank), which is what's used as the moved quantity here.
 */
class BinanceFiatWithdrawalParser implements CryptoImportParserInterface
{
    public function getSourceName(): string
    {
        return 'Binance';
    }

    public function supports(array $rows): bool
    {
        $header = $rows[0] ?? [];

        return ($header[0] ?? null) === 'Durée'
            && ($header[2] ?? null) === 'Montant du retrait'
            && ($header[6] ?? null) === 'ID de transaction';
    }

    public function parse(array $rows): array
    {
        $trades = [];

        foreach (array_slice($rows, 1) as $row) {
            if (count($row) < 7 || strtolower($row[5]) !== 'successful') {
                continue;
            }

            [$qty, $coin] = $this->parseAmount($row[2]);
            [$fee] = $this->parseAmount($row[4]);
            if (abs($qty) < 0.00000001) {
                continue;
            }

            $trades[] = [
                'importedId' => $row[6],
                'tradeAt' => new \DateTimeImmutable($row[0]),
                'type' => TypeType::Retrait,
                'fromCoin' => $coin,
                'fromNbToken' => $qty,
                'toCoin' => $coin,
                'toNbToken' => $qty,
                'costPrice' => $fee,
                'costCoin' => $coin,
                'totalReal' => $coin === 'EUR' ? $qty : 0.0,
                'total' => $coin === 'EUR' ? $qty : 0.0,
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
