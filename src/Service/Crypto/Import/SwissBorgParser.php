<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * SwissBorg "transaction history" export (My Account > Download my data), an XLSX file conventionally
 * named with a ".xls" extension — CryptoImportService detects the real format from content, not the
 * extension. The real header is preceded by a company/account metadata block (owner name, address,
 * user id, date range...), so this parser scans for it rather than assuming a fixed offset, same as
 * the other parsers dealing with a preamble.
 *
 * Columns (0-indexed): Local time(0), Time in UTC(1), Type(2), Currency(3), Gross amount(4),
 * Gross amount (EUR)(5), Fee(6), Fee (EUR)(7), Net amount(8), Net amount (EUR)(9), Note(10).
 *
 * There's no transaction id column at all, so importedId is a hash of each row's own content, with a
 * per-signature occurrence counter in case two rows are otherwise identical — stable across re-imports
 * of a re-downloaded (growing) export, since SwissBorg's export is the full account history in
 * chronological order and past rows don't get reordered.
 *
 * A conversion inside the app (buying one asset with another, or with EUR) is recorded as two
 * consecutive rows sharing the exact same "Local time": a Sell leg (what was given up) immediately
 * followed by a Buy leg (what was received, net of the conversion fee taken out of it), which this
 * parser pairs into a single CrTrade — an Achat if the Buy leg's currency isn't EUR (acquiring an
 * asset), a Vente if it is (cashing out).
 */
class SwissBorgParser implements CryptoImportParserInterface
{
    /** @var array<string, int> content signature => number of times already seen, for stable dedup ids */
    private array $idOccurrences = [];

    public function getSourceName(): string
    {
        return 'SwissBorg';
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

        $this->idOccurrences = [];

        $entries = [];
        foreach (array_slice($rows, $headerIndex + 1) as $row) {
            if (count($row) < 10 || $row[0] === '') {
                continue;
            }

            $entries[] = [
                'localTime' => $row[0],
                'type' => $row[2],
                'currency' => $row[3],
                'gross' => $this->toFloat($row[4]),
                'grossEur' => $this->toFloat($row[5]),
                'fee' => $this->toFloat($row[6]),
                'feeEur' => $this->toFloat($row[7]),
                'net' => $this->toFloat($row[8]),
                'netEur' => $this->toFloat($row[9]),
            ];
        }

        $swapLegs = [];
        foreach ($entries as $entry) {
            if (in_array($entry['type'], ['Buy', 'Sell'], true)) {
                $swapLegs[$entry['localTime']][] = $entry;
            }
        }

        $trades = [];
        $processedSwapTimes = [];

        foreach ($entries as $entry) {
            $tradeAt = new \DateTimeImmutable($entry['localTime']);

            switch ($entry['type']) {
                case 'Deposit':
                    $trades[] = $this->buildSingleCoinTrade($tradeAt, TypeType::Depot, $entry);
                    break;
                case 'Withdrawal':
                    $trades[] = $this->buildSingleCoinTrade($tradeAt, TypeType::Retrait, $entry);
                    break;
                case 'Payouts':
                    $trades[] = $this->buildSingleCoinTrade($tradeAt, TypeType::Stacking, $entry);
                    break;
                case 'Buy':
                case 'Sell':
                    if (isset($processedSwapTimes[$entry['localTime']])) {
                        break;
                    }
                    $processedSwapTimes[$entry['localTime']] = true;

                    $legs = $swapLegs[$entry['localTime']];
                    $sell = $this->findLeg($legs, 'Sell');
                    $buy = $this->findLeg($legs, 'Buy');

                    $trades[] = (count($legs) === 2 && $sell !== null && $buy !== null)
                        ? $this->buildSwapTrade($tradeAt, $sell, $buy)
                        : $this->buildUnpairedLegs($tradeAt, $legs);
                    break;
                default:
                    // Any other SwissBorg type isn't dropped — kept as ACategoriser with SwissBorg's own
                    // type string so the user can see and reclassify it instead of it silently vanishing.
                    $trades[] = $this->buildSingleCoinTrade($tradeAt, TypeType::ACategoriser, $entry, $entry['type']);
                    break;
            }
        }

        return array_merge(...$trades);
    }

    /**
     * @return list<array> 0 or 1 trade (dropped if the moved quantity is negligible)
     */
    private function buildSingleCoinTrade(\DateTimeImmutable $tradeAt, int $type, array $entry, ?string $rawCategory = null): array
    {
        if (abs($entry['net']) < 0.00000001) {
            return [];
        }

        return [[
            'importedId' => $this->makeImportedId(sprintf('%s|%s|%s|%s|%s', $entry['localTime'], $entry['type'], $entry['currency'], $entry['gross'], $entry['net'])),
            'tradeAt' => $tradeAt,
            'type' => $type,
            'fromCoin' => $entry['currency'],
            'fromNbToken' => $entry['net'],
            'toCoin' => $entry['currency'],
            'toNbToken' => $entry['net'],
            'costPrice' => $entry['fee'],
            'costCoin' => $entry['currency'],
            'totalReal' => $entry['netEur'],
            'total' => $entry['grossEur'],
            'rawCategory' => $rawCategory,
        ]];
    }

    /**
     * @return list<array> exactly 1 trade
     */
    private function buildSwapTrade(\DateTimeImmutable $tradeAt, array $sell, array $buy): array
    {
        $type = $buy['currency'] === 'EUR' ? TypeType::Vente : TypeType::Achat;

        [$costPrice, $costCoin] = match (true) {
            $buy['fee'] > 0 => [$buy['fee'], $buy['currency']],
            $sell['fee'] > 0 => [$sell['fee'], $sell['currency']],
            default => [0.0, $buy['currency']],
        };

        return [[
            'importedId' => $this->makeImportedId(sprintf('%s|swap|%s|%s|%s|%s', $sell['localTime'], $sell['currency'], $sell['net'], $buy['currency'], $buy['net'])),
            'tradeAt' => $tradeAt,
            'type' => $type,
            'fromCoin' => $sell['currency'],
            'fromNbToken' => $sell['net'],
            'toCoin' => $buy['currency'],
            'toNbToken' => $buy['net'],
            'costPrice' => $costPrice,
            'costCoin' => $costCoin,
            'totalReal' => $buy['netEur'],
            'total' => $sell['netEur'],
        ]];
    }

    /**
     * Fallback when a group of Buy/Sell rows sharing a "Local time" isn't exactly one clean pair (a lone
     * leg, or more than two) — emits one best-effort ACategoriser entry per leg instead of dropping the
     * whole group.
     *
     * @return list<array>
     */
    private function buildUnpairedLegs(\DateTimeImmutable $tradeAt, array $legs): array
    {
        $trades = [];
        foreach ($legs as $leg) {
            $trades[] = $this->buildSingleCoinTrade($tradeAt, TypeType::ACategoriser, $leg, $leg['type']);
        }

        return array_merge(...$trades);
    }

    private function findLeg(array $legs, string $type): ?array
    {
        foreach ($legs as $leg) {
            if ($leg['type'] === $type) {
                return $leg;
            }
        }

        return null;
    }

    private function findHeaderIndex(array $rows): ?int
    {
        foreach ($rows as $index => $row) {
            if (($row[0] ?? null) === 'Local time' && ($row[2] ?? null) === 'Type' && ($row[4] ?? null) === 'Gross amount') {
                return $index;
            }
        }

        return null;
    }

    private function toFloat(string $value): float
    {
        return $value === '' ? 0.0 : (float) $value;
    }

    private function makeImportedId(string $signature): string
    {
        $occurrence = $this->idOccurrences[$signature] ?? 0;
        $this->idOccurrences[$signature] = $occurrence + 1;

        return hash('sha1', $signature . '#' . $occurrence);
    }
}
