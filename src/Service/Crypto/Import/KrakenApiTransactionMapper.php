<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Maps Kraken's private /0/private/Ledgers API entries (as fetched by KrakenApiClient::fetchLedgerEntries,
 * each carrying the same fields as a row of the Kraken "ledgers" export plus an added 'txid') into the
 * same array shape as CryptoImportParserInterface::parse() (a single real trade produces two ledger rows
 * sharing 'refid' — one negative leg given up, one positive leg received — which must be paired before
 * building a CrTrade).
 *
 * Unlike the CSV export, the private API returns Kraken's legacy internal asset codes (e.g. 'XXBT',
 * 'ZEUR') instead of plain tickers, plus an Earn/staking product suffix on some assets (e.g. 'DOT.S' for
 * bonded/staked DOT) — normalizeAsset() strips both so downstream logic (which compares against plain
 * codes like 'EUR') matches the CSV parser's behavior.
 *
 * Any ledger `type` not explicitly handled (deposit/withdrawal/transfer/trade) falls back to
 * TypeType::ACategoriser with `rawCategory` set to Kraken's own type string, so the user can see and
 * manually reclassify it instead of it being silently dropped.
 */
class KrakenApiTransactionMapper
{
    private const LEGACY_ASSET_MAP = [
        'XETC' => 'ETC', 'XETH' => 'ETH', 'XLTC' => 'LTC', 'XMLN' => 'MLN', 'XREP' => 'REP',
        'XXBT' => 'BTC', 'XBT' => 'BTC', 'XXDG' => 'DOGE', 'XXLM' => 'XLM', 'XXMR' => 'XMR',
        'XXRP' => 'XRP', 'XZEC' => 'ZEC', 'XICN' => 'ICN',
        'ZAUD' => 'AUD', 'ZCAD' => 'CAD', 'ZEUR' => 'EUR', 'ZGBP' => 'GBP', 'ZJPY' => 'JPY',
        'ZUSD' => 'USD', 'ZCHF' => 'CHF', 'ZKRW' => 'KRW',
    ];

    public function getSourceName(): string
    {
        return 'Kraken API';
    }

    /**
     * @param list<array<string, mixed>> $entries as returned by KrakenApiClient::fetchLedgerEntries()
     * @return list<array{
     *     importedId: string,
     *     tradeAt: \DateTimeImmutable,
     *     type: int,
     *     fromCoin: string,
     *     fromNbToken: float,
     *     toCoin: string,
     *     toNbToken: ?float,
     *     costPrice: float,
     *     costCoin: string,
     *     totalReal: float,
     *     total: float,
     * }>
     */
    public function map(array $entries): array
    {
        $trades = [];
        $tradeGroups = [];

        foreach ($entries as $entry) {
            $type = $entry['type'] ?? null;

            if ($type === 'trade') {
                $tradeGroups[$entry['refid']][] = $entry;
                continue;
            }

            $tradeAt = new \DateTimeImmutable('@' . (int) ($entry['time'] ?? 0));
            $asset = isset($entry['asset']) ? $this->normalizeAsset($entry['asset']) : null;
            $amount = (float) ($entry['amount'] ?? 0);
            $fee = (float) ($entry['fee'] ?? 0);

            if ($asset === null) {
                continue;
            }

            if ($type === 'deposit') {
                $trades[] = $this->buildSingleCoinTrade($entry['txid'], $tradeAt, TypeType::Depot, $asset, abs($amount) - $fee);
            } elseif ($type === 'withdrawal') {
                $trades[] = $this->buildSingleCoinTrade($entry['txid'], $tradeAt, TypeType::Retrait, $asset, abs($amount) + $fee);
            } elseif ($type === 'transfer') {
                $trades[] = $this->buildSingleCoinTrade($entry['txid'], $tradeAt, TypeType::Recuperation, $asset, abs($amount));
            } else {
                $trades[] = $this->buildSingleCoinTrade($entry['txid'], $tradeAt, TypeType::ACategoriser, $asset, abs($amount), $type);
            }
        }

        foreach ($tradeGroups as $refid => $group) {
            if (count($group) !== 2) {
                foreach ($group as $entry) {
                    $trades[] = $this->buildSingleCoinTrade(
                        $entry['txid'],
                        new \DateTimeImmutable('@' . (int) ($entry['time'] ?? 0)),
                        TypeType::Recuperation,
                        $this->normalizeAsset($entry['asset'] ?? ''),
                        abs((float) ($entry['amount'] ?? 0))
                    );
                }
                continue;
            }

            $trades[] = $this->buildTradeFromPair((string) $refid, $group[0], $group[1]);
        }

        return array_values(array_filter($trades));
    }

    private function buildTradeFromPair(string $refid, array $entryA, array $entryB): ?array
    {
        $assetA = $this->normalizeAsset($entryA['asset'] ?? '');
        $assetB = $this->normalizeAsset($entryB['asset'] ?? '');

        $eurLeg = $assetA === 'EUR' ? $entryA : ($assetB === 'EUR' ? $entryB : null);
        $cryptoLeg = $eurLeg === $entryA ? $entryB : $entryA;

        if ($eurLeg === null) {
            $negative = ((float) ($entryA['amount'] ?? 0)) < 0 ? $entryA : $entryB;
            $positive = $negative === $entryA ? $entryB : $entryA;

            return [
                'importedId' => $refid,
                'tradeAt' => new \DateTimeImmutable('@' . (int) ($negative['time'] ?? 0)),
                'type' => TypeType::Vente,
                'fromCoin' => $this->normalizeAsset($negative['asset'] ?? ''),
                'fromNbToken' => abs((float) ($negative['amount'] ?? 0)),
                'toCoin' => $this->normalizeAsset($positive['asset'] ?? ''),
                'toNbToken' => (float) ($positive['amount'] ?? 0),
                'costPrice' => 0.0,
                'costCoin' => $this->normalizeAsset($positive['asset'] ?? ''),
                'totalReal' => 0.0,
                'total' => 0.0,
            ];
        }

        $eurAmount = (float) ($eurLeg['amount'] ?? 0);
        $eurFee = (float) ($eurLeg['fee'] ?? 0);
        $cryptoAmount = (float) ($cryptoLeg['amount'] ?? 0);
        $tradeAt = new \DateTimeImmutable('@' . (int) ($eurLeg['time'] ?? 0));
        $cryptoAsset = $this->normalizeAsset($cryptoLeg['asset'] ?? '');

        if ($cryptoAmount > 0) {
            $totalReal = abs($eurAmount);
            $total = $totalReal + $eurFee;

            return [
                'importedId' => $refid,
                'tradeAt' => $tradeAt,
                'type' => TypeType::Achat,
                'fromCoin' => 'EUR',
                'fromNbToken' => $total,
                'toCoin' => $cryptoAsset,
                'toNbToken' => $cryptoAmount,
                'costPrice' => $eurFee,
                'costCoin' => 'EUR',
                'totalReal' => $totalReal,
                'total' => $total,
            ];
        }

        $totalReal = $eurAmount - $eurFee;

        return [
            'importedId' => $refid,
            'tradeAt' => $tradeAt,
            'type' => TypeType::Vente,
            'fromCoin' => $cryptoAsset,
            'fromNbToken' => abs($cryptoAmount),
            'toCoin' => 'EUR',
            'toNbToken' => $totalReal,
            'costPrice' => $eurFee,
            'costCoin' => 'EUR',
            'totalReal' => $totalReal,
            'total' => $totalReal + $eurFee,
        ];
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

    private function normalizeAsset(string $asset): string
    {
        $base = preg_replace('/\.[A-Z]+$/', '', $asset) ?? $asset;

        return self::LEGACY_ASSET_MAP[$base] ?? $base;
    }
}
