<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Coinbase (not Coinbase Pro) "transactions_history.csv" export. A few preamble lines ("Transactions",
 * "User,...") precede the real header, so this parser scans for it like BitpandaParser does.
 *
 * Columns (0-indexed): ID(0), Timestamp(1), Transaction Type(2), Asset(3), Quantity Transacted(4),
 * Price Currency(5), Price at Transaction(6), Subtotal(7), Total (inclusive of fees)(8), Fees(9),
 * Notes(10).
 *
 * Verified against a row already correctly imported in this app's DB (id=227, same source
 * transaction): for a Buy, the EUR amount actually debited from the wallet is Total(8), not
 * Subtotal(7) — Total = Subtotal + Fees. This app's CrTrade.fromNbToken for an Achat must be that
 * full debited amount, matching totalReal (=Subtotal) + costPrice (=Fees). The previous
 * AdminCryptoCoinbaseCommand additionally had a bug: it always set toCoin to the Price Currency
 * column (EUR) instead of the Asset column, which this parser fixes.
 */
class CoinbaseParser implements CryptoImportParserInterface
{
    public function getSourceName(): string
    {
        return 'Coinbase';
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
            if (count($row) < 11 || $row[0] === '') {
                continue;
            }

            $id = $row[0];
            $tradeAt = new \DateTimeImmutable($row[1]);
            $type = $row[2];
            $asset = $row[3];
            $quantity = (float) $row[4];
            $priceCurrency = $row[5];
            $subtotal = (float) $row[7];
            $total = (float) $row[8];
            $fees = (float) $row[9];

            switch ($type) {
                case 'Buy':
                    $trades[] = [
                        'importedId' => $id,
                        'tradeAt' => $tradeAt,
                        'type' => TypeType::Achat,
                        'fromCoin' => $priceCurrency,
                        'fromNbToken' => $total,
                        'toCoin' => $asset,
                        'toNbToken' => $quantity,
                        'costPrice' => $fees,
                        'costCoin' => $priceCurrency,
                        'totalReal' => $subtotal,
                        'total' => $total,
                    ];
                    break;
                case 'Sell':
                    $trades[] = [
                        'importedId' => $id,
                        'tradeAt' => $tradeAt,
                        'type' => TypeType::Vente,
                        'fromCoin' => $asset,
                        'fromNbToken' => $quantity,
                        'toCoin' => $priceCurrency,
                        'toNbToken' => $total,
                        'costPrice' => $fees,
                        'costCoin' => $priceCurrency,
                        'totalReal' => $total,
                        'total' => $subtotal,
                    ];
                    break;
                case 'Receive':
                    $trades[] = $this->buildSingleCoinTrade($id, $tradeAt, TypeType::Recuperation, $asset, $quantity);
                    break;
                case 'Staking Income':
                    $trades[] = $this->buildSingleCoinTrade($id, $tradeAt, TypeType::Stacking, $asset, $quantity);
                    break;
                case 'Deposit':
                    $trades[] = $this->buildSingleCoinTrade($id, $tradeAt, TypeType::Depot, $asset, $quantity);
                    break;
                case 'Withdrawal':
                    $trades[] = $this->buildSingleCoinTrade($id, $tradeAt, TypeType::Retrait, $asset, $quantity);
                    break;
                case 'Send':
                    // A real outbound crypto movement (Notes confirms an external address) — treated
                    // as Retrait (like Kraken withdrawal / Uphold external "out"), not Transfert,
                    // since it genuinely reduces holdings rather than moving between own wallets.
                    $trades[] = $this->buildSingleCoinTrade($id, $tradeAt, TypeType::Retrait, $asset, $quantity);
                    break;
                default:
                    // Any other Coinbase transaction type (e.g. "Convert", "Learning Reward") isn't
                    // dropped — kept as ACategoriser with Coinbase's own type string so the user can see
                    // and reclassify it instead of it silently vanishing from the import.
                    $trades[] = $this->buildSingleCoinTrade($id, $tradeAt, TypeType::ACategoriser, $asset, $quantity, $type);
                    break;
            }
        }

        return array_values(array_filter($trades));
    }

    private function findHeaderIndex(array $rows): ?int
    {
        foreach ($rows as $index => $row) {
            if (($row[0] ?? null) === 'ID' && ($row[2] ?? null) === 'Transaction Type' && ($row[3] ?? null) === 'Asset') {
                return $index;
            }
        }

        return null;
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
            'totalReal' => $coin === 'EUR' ? $qty : 0.0,
            'total' => $coin === 'EUR' ? $qty : 0.0,
            'rawCategory' => $rawCategory,
        ];
    }
}
