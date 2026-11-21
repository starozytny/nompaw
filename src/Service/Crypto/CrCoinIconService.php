<?php

namespace App\Service\Crypto;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Stores each coin's icon under public/crypto-icons/{TICKER}.svg|png so the browser never calls a third
 * party (CoinIcon.jsx only reads these files). Sources are tried in order, all keyed by ticker:
 * atomiclabs (MIT SVG set, frozen in 2022), then CoinCap and Binance logos for newer listings.
 * Never throws: a coin found nowhere just keeps its initials in the UI.
 */
class CrCoinIconService
{
    public const DIR = 'crypto-icons';
    private const MAX_BYTES = 500_000;

    private const SOURCES = [
        ['https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@0.18.1/svg/color/%s.svg', 'lower', 'svg'],
        ['https://assets.coincap.io/assets/icons/%s@2x.png', 'lower', 'png'],
        ['https://bin.bnbstatic.com/static/assets/logos/%s.png', 'upper', 'png'],
    ];

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly LoggerInterface $logger,
        private readonly string $publicDirectory,
    ) {}

    /**
     * @return 'exists'|'downloaded'|'not-found'|'invalid'
     */
    public function download(string $coin, bool $force = false): string
    {
        $ticker = strtoupper($coin);
        // The ticker becomes a file name: letters, digits and underscore only (no path tricks).
        if ($ticker === 'EUR' || !preg_match('/^[A-Z0-9_]{1,20}$/', $ticker)) {
            return 'invalid';
        }

        $dir = rtrim($this->publicDirectory, '/') . '/' . self::DIR;
        if (!$force && (is_file("$dir/$ticker.svg") || is_file("$dir/$ticker.png"))) {
            return 'exists';
        }

        foreach (self::SOURCES as [$pattern, $case, $ext]) {
            $url = sprintf($pattern, $case === 'lower' ? strtolower($ticker) : $ticker);
            try {
                $response = $this->httpClient->request('GET', $url, ['timeout' => 10]);
                if ($response->getStatusCode() !== 200 || !str_starts_with($response->getHeaders(false)['content-type'][0] ?? '', 'image/')) {
                    continue;
                }
                $content = $response->getContent(false);
            } catch (HttpExceptionInterface $e) {
                $this->logger->info('Crypto icon: {url} failed: {error}', ['url' => $url, 'error' => $e->getMessage()]);
                continue;
            }

            if ($content === '' || strlen($content) > self::MAX_BYTES) {
                continue;
            }

            if (!is_dir($dir)) {
                mkdir($dir, 0775, true);
            }
            // Only one file per ticker, so the front never has to guess between a stale svg and a new png.
            @unlink("$dir/$ticker.svg");
            @unlink("$dir/$ticker.png");
            file_put_contents("$dir/$ticker.$ext", $content);

            return 'downloaded';
        }

        return 'not-found';
    }
}
