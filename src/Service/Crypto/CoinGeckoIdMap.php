<?php

namespace App\Service\Crypto;

/**
 * Ticker -> CoinGecko coin id, used by CrPriceService to fetch historical EUR prices.
 * Seeded from the tickers actually present in cr_trade at the time this was written; grows over
 * time as new tickers appear (an unmapped ticker never throws, see CrPriceService::getPriceEur()
 * — the report simply asks for a manual value instead).
 */
class CoinGeckoIdMap
{
    const MAP = [
        'BTC' => 'bitcoin',
        'ETH' => 'ethereum',
        'USDC' => 'usd-coin',
        'XTZ' => 'tezos',
        'FET' => 'fetch-ai',
        'COMP' => 'compound-governance-token',
        'CLV' => 'clover-finance',
        'AMP' => 'amp-token',
        'GRT' => 'the-graph',
        'LINK' => 'chainlink',
        'EOS' => 'eos',
        'BAT' => 'basic-attention-token',
        'LTC' => 'litecoin',
        'XLM' => 'stellar',
        'OMG' => 'omisego',
        'ALGO' => 'algorand',
        'ZRX' => '0x',
        'XRP' => 'ripple',
        'BCH' => 'bitcoin-cash',
    ];

    public static function resolve(string $coin): ?string
    {
        return self::MAP[strtoupper($coin)] ?? null;
    }
}
