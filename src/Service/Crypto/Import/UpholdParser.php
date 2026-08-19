<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Uphold "transactions" CSV export. One row = one event, header on the first line, no metadata
 * lines to skip.
 *
 * Columns (0-indexed): Date(0), Destination(1), Destination Amount(2), Destination Currency(3),
 * Fee Amount(4), Fee Currency(5), Id(6), Origin(7), Origin Amount(8), Origin Currency(9), Status(10),
 * Type(11).
 */
class UpholdParser implements CryptoImportParserInterface
{
    public function getSourceName(): string
    {
        return 'Uphold';
    }

    public function supports(array $rows): bool
    {
        $header = $rows[0] ?? [];

        return ($header[0] ?? null) === 'Date' && ($header[6] ?? null) === 'Id' && ($header[11] ?? null) === 'Type';
    }

    public function parse(array $rows): array
    {
        $trades = [];

        foreach (array_slice($rows, 1) as $row) {
            if (count($row) < 12 || strtolower($row[10]) !== 'completed') {
                continue;
            }

            $id = $row[6];
            $tradeAt = new \DateTimeImmutable($row[0]);
            $destAmount = (float) $row[2];
            $destCoin = $row[3];
            $originAmount = (float) $row[8];
            $originCoin = $row[9];
            $rawType = $row[11];
            $type = strtolower($rawType);

            switch ($type) {
                case 'in':
                    $trades[] = $this->buildSingleCoinTrade($id, $tradeAt, TypeType::Recuperation, $originCoin, $originAmount);
                    break;
                case 'transfer':
                    if ($originCoin !== $destCoin) {
                        $trades[] = [
                            'importedId' => $id,
                            'tradeAt' => $tradeAt,
                            'type' => TypeType::Vente,
                            'fromCoin' => $originCoin,
                            'fromNbToken' => $originAmount,
                            'toCoin' => $destCoin,
                            'toNbToken' => $destAmount,
                            'costPrice' => 0.0,
                            'costCoin' => $destCoin,
                            'totalReal' => 0.0,
                            'total' => 0.0,
                        ];
                    }
                    break;
                case 'out':
                    if (strtolower($row[1]) === 'uphold') {
                        // internal move between the user's own Uphold cards, no holdings impact
                        break;
                    }
                    $trades[] = $this->buildSingleCoinTrade($id, $tradeAt, TypeType::Retrait, $originCoin, $originAmount);
                    break;
                default:
                    // Any Uphold type besides in/transfer/out (e.g. a card top-up) isn't dropped —
                    // kept as ACategoriser with Uphold's own type string so the user can reclassify it.
                    $trades[] = $this->buildSingleCoinTrade($id, $tradeAt, TypeType::ACategoriser, $originCoin, $originAmount, $rawType);
                    break;
            }
        }

        return array_values(array_filter($trades));
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
            'totalReal' => 0.0,
            'total' => 0.0,
            'rawCategory' => $rawCategory,
        ];
    }
}
