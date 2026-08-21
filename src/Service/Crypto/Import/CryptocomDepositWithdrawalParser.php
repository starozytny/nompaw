<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Crypto.com Exchange (App) "Dépôts et retraits" CSV export — on-chain crypto deposits and withdrawals,
 * one row per movement with the on-chain transaction id. Unlike Binance's split deposit/withdrawal files,
 * both movement kinds share a single export here, distinguished by the "Type" column ("Dépôt"/"Retrait").
 * The real header is preceded by a legal-disclaimer/export-date preamble of a few lines (and blank
 * lines), so this parser scans for it rather than assuming a fixed offset, same as SwissBorgParser.
 *
 * Columns (0-indexed): Date(0) — a "local(UTC)" pair, e.g. "2021-06-07 20:34:55(2021-06-07 18:34:55 UTC)",
 * only the local half before the "(" is parsed — Monnaie(1) — "TICKER(Network)", e.g.
 * "CRO(Ethereum (ERC20))", only the ticker before the first "(" is kept — Type(2), Quantité(3), Frais(4),
 * TXID(5), Informations(6), Statut(7).
 *
 * Only "Terminé" (completed) rows are imported. As with BinanceWithdrawalParser, a withdrawal's network
 * fee is debited from the same balance alongside the withdrawn amount, so it's added back into the
 * imported quantity; a deposit's "Quantité" is already the net amount credited, so its fee (always 0 in
 * observed exports) is left purely informational.
 *
 * A row whose "Informations" column names the Crypto.com App as the counterparty isn't a real external
 * deposit/withdrawal — it's an internal move between this same person's Exchange sub-account and their
 * App wallet. Confirmed by cross-referencing a real export against CryptocomAppHistoryParser's own
 * export: every such row here has a matching crypto_to_exchange_transfer / exchange_to_crypto_transfer /
 * dynamic_coin_swap_bonus_exchange_deposit row there (same coin/amount/timestamp), so it's recorded as
 * Transfert (no holdings impact) instead of Depot/Retrait, which would otherwise double it: once as a
 * "deposit"/"withdrawal" here, and again for whatever Achat/Vente/Stacking/etc. already accounted for how
 * that balance was really acquired on the App side.
 */
class CryptocomDepositWithdrawalParser implements CryptoImportParserInterface
{
    private const INTERNAL_APP_TRANSFER_MARKERS = [
        "Depuis l'Application Crypto.com",
        "Vers l'Application Crypto.com",
        'EARLY_SWAP_BONUS_DEPOSIT',
    ];

    public function getSourceName(): string
    {
        return 'Crypto.com Exchange';
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
            if (count($row) < 8 || $row[7] !== 'Terminé') {
                continue;
            }

            $type = match ($row[2]) {
                'Dépôt' => TypeType::Depot,
                'Retrait' => TypeType::Retrait,
                default => null,
            };
            if ($type === null) {
                continue;
            }

            $coin = $this->extractBefore($row[1]);
            $fee = (float) $row[4];
            $qty = (float) $row[3] + ($type === TypeType::Retrait ? $fee : 0.0);
            if ($coin === '' || abs($qty) < 0.00000001) {
                continue;
            }

            if ($this->isInternalAppTransfer($row[6] ?? '')) {
                $type = TypeType::Transfert;
            }

            $trades[] = [
                'importedId' => $row[5],
                'tradeAt' => new \DateTimeImmutable($this->extractBefore($row[0])),
                'type' => $type,
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

    private function isInternalAppTransfer(string $informations): bool
    {
        foreach (self::INTERNAL_APP_TRANSFER_MARKERS as $marker) {
            if (str_contains($informations, $marker)) {
                return true;
            }
        }

        return false;
    }

    private function extractBefore(string $value): string
    {
        $parenPos = strpos($value, '(');

        return $parenPos === false ? $value : substr($value, 0, $parenPos);
    }

    private function findHeaderIndex(array $rows): ?int
    {
        foreach ($rows as $index => $row) {
            if (($row[0] ?? null) === 'Date'
                && ($row[1] ?? null) === 'Monnaie'
                && ($row[2] ?? null) === 'Type'
                && ($row[5] ?? null) === 'TXID'
            ) {
                return $index;
            }
        }

        return null;
    }
}
