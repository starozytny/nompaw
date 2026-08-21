<?php

namespace App\Service\Crypto;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Fiat-to-fiat historical conversion (USD⇄EUR and any other currency pair) via Frankfurter
 * (api.frankfurter.dev — free, no API key, backed by the European Central Bank's daily reference rates,
 * historical back to 1999). Used by the "convertisseur" panel in TradesForm to help the user translate a
 * cession/receipt originally denominated in another currency into the EUR figure the tax report needs —
 * a manual aid, not wired into CrTaxReportService's own calculation (the user chose to keep that strictly
 * EUR-only and convert by hand at entry time).
 *
 * The ECB publishes no rate on weekends/bank holidays; Frankfurter transparently falls back to the most
 * recent prior business day and echoes the actual date used in its response, which is passed through
 * here so the caller can show it (e.g. "taux du 30/04/2021" for a Sunday 02/05/2021 entry).
 *
 * Never throws: any failure (unknown currency, transport error, unexpected payload) is logged and
 * results in a null return.
 */
class CrFxRateService
{
    public function __construct(
        private readonly HttpClientInterface $frankfurterClient,
        private readonly LoggerInterface $logger,
    ) {}

    /**
     * @return array{amount: float, rateDate: string}|null the converted amount and the actual date the
     *         rate was quoted for (may differ from $date on a weekend/holiday)
     */
    public function convert(string $from, string $to, float $amount, \DateTimeInterface $date): ?array
    {
        $from = strtoupper($from);
        $to = strtoupper($to);

        if ($from === $to) {
            return ['amount' => $amount, 'rateDate' => $date->format('Y-m-d')];
        }

        $day = \DateTime::createFromInterface($date)->format('Y-m-d');

        try {
            $response = $this->frankfurterClient->request('GET', $day, [
                'query' => ['from' => $from, 'to' => $to, 'amount' => $amount],
            ]);

            $data = $response->toArray();
            $converted = $data['rates'][$to] ?? null;
            $rateDate = $data['date'] ?? $day;
        } catch (HttpExceptionInterface|\Throwable $e) {
            $this->logger->warning('FX conversion failed for {from}->{to} on {date}: {message}', [
                'from' => $from,
                'to' => $to,
                'date' => $day,
                'message' => $e->getMessage(),
            ]);

            return null;
        }

        if (!is_numeric($converted)) {
            $this->logger->warning('Frankfurter returned no rate for {from}->{to} on {date}.', [
                'from' => $from,
                'to' => $to,
                'date' => $day,
            ]);

            return null;
        }

        return ['amount' => (float) $converted, 'rateDate' => $rateDate];
    }
}
