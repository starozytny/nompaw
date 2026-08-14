<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Coinbase Pro "Fills" CSV export (one row = one already-matched trade, no pairing needed). Ports the
 * field mapping from the existing AdminCryptoProCoinbaseCommand, which is already correct — this
 * project's `cr_trade` table has 322 rows imported from it that check out against the raw Fills data.
 *
 * Columns (0-indexed): portfolio(0), trade id(1), product(2), side(3), created at(4), size(5),
 * size unit(6), price(7), fee(8), total(9), price/fee/total unit(10).
 */
class CoinbaseProFillsParser implements CryptoImportParserInterface
{
    public function getSourceName(): string
    {
        return 'Coinbase Pro';
    }

    public function supports(array $rows): bool
    {
        $header = $rows[0] ?? [];

        return ($header[0] ?? null) === 'portfolio' && ($header[1] ?? null) === 'trade id' && ($header[3] ?? null) === 'side';
    }

    public function parse(array $rows): array
    {
        $trades = [];

        foreach (array_slice($rows, 1) as $row) {
            if (count($row) < 11) {
                continue;
            }

            $type = strtoupper($row[3]) === 'BUY' ? TypeType::Achat : TypeType::Vente;
            $fromCoin = $type === TypeType::Achat ? $row[10] : $row[6];
            $toCoin = $type === TypeType::Achat ? $row[6] : $row[10];
            $size = (float) $row[5];
            $total = abs((float) $row[9]);
            $fee = round((float) $row[8], 2);

            $trades[] = [
                'importedId' => $row[1],
                'tradeAt' => new \DateTimeImmutable($row[4]),
                'type' => $type,
                'fromCoin' => $fromCoin,
                'fromNbToken' => $type === TypeType::Achat ? $total : $size,
                'toCoin' => $toCoin,
                'toNbToken' => $type === TypeType::Achat ? $size : $total,
                'costPrice' => $fee,
                'costCoin' => 'EUR',
                'totalReal' => $total - $fee,
                'total' => $total,
            ];
        }

        return $trades;
    }
}
