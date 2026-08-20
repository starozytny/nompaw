<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Binance "Historique de dépôts" CSV export — on-chain crypto deposits only, one row per deposit with
 * a real blockchain transaction id. The main "Historique des transactions" export (BinanceHistoryParser)
 * also logs the same events (at a later, rounded timestamp — once the balance is actually credited,
 * vs. this file's on-chain broadcast time) but deliberately skips crypto deposits to avoid importing
 * every one of them twice; that file only fills in fiat (EUR) deposits, which never appear here.
 *
 * Columns (0-indexed): Durée(0), Jeton(1), Réseau(2), Montant(3), Adresse(4), ID de transaction(5),
 * Statut(6).
 */
class BinanceDepositParser implements CryptoImportParserInterface
{
    public function getSourceName(): string
    {
        return 'Binance';
    }

    public function supports(array $rows): bool
    {
        $header = $rows[0] ?? [];

        return ($header[0] ?? null) === 'Durée'
            && ($header[1] ?? null) === 'Jeton'
            && ($header[5] ?? null) === 'ID de transaction'
            && ($header[6] ?? null) === 'Statut';
    }

    public function parse(array $rows): array
    {
        $trades = [];

        foreach (array_slice($rows, 1) as $row) {
            if (count($row) < 7 || strtolower($row[6]) !== 'completed') {
                continue;
            }

            $coin = $row[1];
            $qty = (float) $row[3];
            if (abs($qty) < 0.00000001) {
                continue;
            }

            $trades[] = [
                'importedId' => $row[5],
                'tradeAt' => new \DateTimeImmutable($row[0]),
                'type' => TypeType::Depot,
                'fromCoin' => $coin,
                'fromNbToken' => $qty,
                'toCoin' => $coin,
                'toNbToken' => $qty,
                'costPrice' => 0.0,
                'costCoin' => $coin,
                'totalReal' => 0.0,
                'total' => 0.0,
            ];
        }

        return $trades;
    }
}
