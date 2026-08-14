<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Bitpanda "trades" CSV export. The real header is preceded by 6 metadata lines (account owner,
 * email, disclaimer...), so this parser scans for it rather than assuming a fixed offset.
 *
 * Column layout (0-indexed): Transaction ID(0), Timestamp(1), Transaction Type(2), In/Out(3),
 * Amount Fiat(4), Fiat(5), Amount Asset(6), Asset(7), Asset market price(8), ... Fee(12), Fee asset(13).
 * N/A fields are literally the string "-".
 */
class BitpandaParser implements CryptoImportParserInterface
{
    public function getSourceName(): string
    {
        return 'Bitpanda';
    }

    public function supports(array $rows): bool
    {
        return $this->findHeaderIndex($rows) !== null;
    }

    public function parse(array $rows): array
    {
        $headerIndex = $this->findHeaderIndex($rows);
        if ($headerIndex === null) {
            return [];
        }

        $trades = [];

        foreach (array_slice($rows, $headerIndex + 1) as $row) {
            if (count($row) < 14 || $row[0] === '') {
                continue;
            }

            $type = strtolower($row[2]);
            $tradeAt = new \DateTimeImmutable($row[1]);
            $amountFiat = $this->toFloat($row[4]);
            $fiat = $row[5];
            $amountAsset = $this->toFloat($row[6]);
            $asset = $row[7];
            $fee = $this->toFloat($row[12]);
            $feeAsset = $row[13] !== '-' ? $row[13] : null;

            switch ($type) {
                case 'buy':
                    $trades[] = $this->buildTrade($row[0], $tradeAt, TypeType::Achat, $fiat, $amountFiat, $asset, $amountAsset, $fee, $feeAsset, $fiat);
                    break;
                case 'sell':
                    $trades[] = $this->buildTrade($row[0], $tradeAt, TypeType::Vente, $asset, $amountAsset, $fiat, $amountFiat, $fee, $feeAsset, $fiat);
                    break;
                case 'deposit':
                case 'withdrawal':
                    $depositType = $type === 'deposit' ? TypeType::Depot : TypeType::Retrait;
                    if ($asset === '' || $asset === '-' || $asset === $fiat) {
                        // EUR/fiat-only movement
                        $qty = $amountFiat + ($feeAsset === $fiat ? $fee : 0.0);
                        $trades[] = $this->buildSingleCoinTrade($row[0], $tradeAt, $depositType, $fiat, $qty);
                    } else {
                        // real crypto moving in/out (Bitpanda records some withdrawals as a 0-amount
                        // row where only the network Fee reflects the actual coin quantity leaving)
                        $qty = $amountAsset + ($feeAsset === $asset ? $fee : 0.0);
                        $trades[] = $this->buildSingleCoinTrade($row[0], $tradeAt, $depositType, $asset, $qty);
                    }
                    break;
                case 'transfer':
                    if (strtolower($row[3]) === 'incoming') {
                        $coin = ($asset !== '' && $asset !== '-') ? $asset : $fiat;
                        $qty = $coin === $asset ? $amountAsset : $amountFiat;
                        $trades[] = $this->buildSingleCoinTrade($row[0], $tradeAt, TypeType::Recuperation, $coin, $qty);
                    }
                    break;
                default:
                    break;
            }
        }

        return array_values(array_filter($trades));
    }

    private function findHeaderIndex(array $rows): ?int
    {
        foreach ($rows as $index => $row) {
            if (($row[0] ?? null) === 'Transaction ID' && ($row[2] ?? null) === 'Transaction Type') {
                return $index;
            }
        }

        return null;
    }

    private function toFloat(string $value): float
    {
        return $value === '-' || $value === '' ? 0.0 : (float) $value;
    }

    private function buildTrade(string $id, \DateTimeImmutable $tradeAt, int $type, string $fromCoin, float $fromQty, string $toCoin, float $toQty, float $fee, ?string $feeAsset, string $costCoin): array
    {
        $totalReal = $type === TypeType::Achat ? $fromQty : $toQty;

        return [
            'importedId' => $id,
            'tradeAt' => $tradeAt,
            'type' => $type,
            'fromCoin' => $fromCoin,
            'fromNbToken' => $fromQty,
            'toCoin' => $toCoin,
            'toNbToken' => $toQty,
            'costPrice' => $fee,
            'costCoin' => $feeAsset ?? $costCoin,
            'totalReal' => $totalReal,
            'total' => $totalReal + ($feeAsset === null || $feeAsset === $costCoin ? $fee : 0.0),
        ];
    }

    private function buildSingleCoinTrade(string $id, \DateTimeImmutable $tradeAt, int $type, string $coin, float $qty): ?array
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
            'costCoin' => $coin === 'EUR' ? 'EUR' : $coin,
            'totalReal' => $coin === 'EUR' ? $qty : 0.0,
            'total' => $coin === 'EUR' ? $qty : 0.0,
        ];
    }
}
