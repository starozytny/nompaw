<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Binance "Historique de retrait" CSV export — on-chain crypto withdrawals, one row per withdrawal with
 * a real blockchain transaction id and the network fee as its own column. The main "Historique des
 * transactions" export (BinanceHistoryParser) also logs every one of these same withdrawals under its
 * "Withdraw" operation, so that parser skips "Withdraw" rows entirely to avoid double-importing them.
 *
 * Columns (0-indexed): Durée(0), Jeton(1), Réseau(2), Montant(3), Frais(4), Adresse(5),
 * ID de transaction(6), Statut(7).
 */
class BinanceWithdrawalParser implements CryptoImportParserInterface
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
            && ($header[4] ?? null) === 'Frais'
            && ($header[6] ?? null) === 'ID de transaction'
            && ($header[7] ?? null) === 'Statut';
    }

    public function parse(array $rows): array
    {
        $trades = [];

        foreach (array_slice($rows, 1) as $row) {
            if (count($row) < 8 || strtolower($row[7]) !== 'completed') {
                continue;
            }

            $coin = $row[1];
            $fee = (float) $row[4];
            // The network fee is debited from the same balance alongside the withdrawn amount itself.
            $qty = (float) $row[3] + $fee;
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
                'totalReal' => 0.0,
                'total' => 0.0,
            ];
        }

        return $trades;
    }
}
