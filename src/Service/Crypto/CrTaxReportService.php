<?php

namespace App\Service\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
use App\Entity\Main\User;
use App\Repository\Crypto\CrTradeRepository;

/**
 * Computes the French crypto capital-gains report (CGI art. 150 VH bis, "régime des plus-values sur
 * biens meubles" applied to crypto-assets — BOI-RPPM-PVBMC-20-10 as of 2026-08).
 *
 * DISCLAIMER: this implements the author's best understanding of the law at the time it was written,
 * NOT verified by a tax professional. If a rule below is wrong or has changed, THIS FILE is the only
 * place that needs to change — the formula and its inputs are deliberately kept in one place.
 *
 * Business rules confirmed with the app's owner (not to be re-derived from tax code alone):
 * - Only TypeType::Vente trades are taxable disposals included in the report.
 * - "Prix de cession" = CrTrade::getTotalReal() (net EUR received), not getTotal().
 * - Only TypeType::Achat trades count as acquisitions for the cumulative acquisition cost; using
 *   getTotal() (totalReal + EUR fee) rather than getTotalReal(), since acquisition fees are added to
 *   the acquisition cost under French tax rules (whereas disposal fees are excluded from the cession
 *   price, which is why Vente uses getTotalReal() instead).
 * - Depot/Retrait/Recuperation/Stacking/Transfert do not affect the coin-holdings replay below: this
 *   mirrors the interpretation already used by the existing frontend cash-flow view
 *   (assets/user/js/pages/components/Cryptos/Trades/TradesList.jsx), which only adjusts per-coin
 *   holdings on Achat (+toNbToken of toCoin) and Vente (-fromNbToken of fromCoin). A coin acquired
 *   only via Depot/Recuperation/Stacking will therefore be under-counted in the automatic portfolio
 *   valuation for years to come; the manual override (CrTrade::manualPortfolioValueTotal) exists
 *   specifically as the escape hatch for that gap.
 *
 * Formula, applied per disposal:
 *   plus_value = prix_de_cession - (prix_total_acquisition_portefeuille * prix_de_cession / valeur_globale_portefeuille)
 * where prix_total_acquisition_portefeuille is CUMULATIVE and never decreases on a partial disposal
 * (unlike FIFO), and valeur_globale_portefeuille is the EUR value of the user's ENTIRE crypto
 * portfolio just before this specific disposal.
 */
class CrTaxReportService
{
    public function __construct(
        private readonly CrTradeRepository $tradeRepository,
        private readonly CrPriceService $priceService,
    ) {}

    public function computeReport(User $user, int $year): array
    {
        $trades = $this->tradeRepository->findBy(['user' => $user], ['tradeAt' => 'ASC', 'id' => 'ASC']);

        $cumulativeAcquisitionCost = 0.0;
        $holdings = [];
        $lines = [];
        $totalPlusValue = 0.0;
        $hasMissingValues = false;

        foreach ($trades as $trade) {
            $isVente = $trade->getType() === TypeType::Vente;

            if ($isVente && (int) $trade->getTradeAt()->format('Y') === $year) {
                $line = $this->computeDisposalLine($trade, $cumulativeAcquisitionCost, $holdings);

                if ($line['plusValue'] === null) {
                    $hasMissingValues = true;
                } else {
                    $totalPlusValue += $line['plusValue'];
                }

                $lines[] = $line;
            }

            // Advance the running state AFTER reading it above, so a disposal line only ever sees
            // acquisitions/holdings strictly before (or, for cost, up to and including) itself.
            if ($trade->getType() === TypeType::Achat) {
                $cumulativeAcquisitionCost += $trade->getTotal();
                $holdings[$trade->getToCoin()] = ($holdings[$trade->getToCoin()] ?? 0.0) + $trade->getToNbToken();
            } elseif ($isVente) {
                $holdings[$trade->getFromCoin()] = ($holdings[$trade->getFromCoin()] ?? 0.0) - $trade->getFromNbToken();
            }
        }

        return [
            'year' => $year,
            'lines' => $lines,
            'totalPlusValue' => round($totalPlusValue, 2),
            'hasMissingValues' => $hasMissingValues,
        ];
    }

    /**
     * Recomputes a single disposal line, e.g. right after a manual portfolio-value override so the
     * caller doesn't need to regenerate the whole report just to refresh one row.
     */
    public function computeSingleLine(CrTrade $disposal): array
    {
        $trades = $this->tradeRepository->findBy(['user' => $disposal->getUser()], ['tradeAt' => 'ASC', 'id' => 'ASC']);

        $cumulativeAcquisitionCost = 0.0;
        $holdings = [];

        foreach ($trades as $trade) {
            if ($trade->getId() === $disposal->getId()) {
                break;
            }

            if ($trade->getType() === TypeType::Achat) {
                $cumulativeAcquisitionCost += $trade->getTotal();
                $holdings[$trade->getToCoin()] = ($holdings[$trade->getToCoin()] ?? 0.0) + $trade->getToNbToken();
            } elseif ($trade->getType() === TypeType::Vente) {
                $holdings[$trade->getFromCoin()] = ($holdings[$trade->getFromCoin()] ?? 0.0) - $trade->getFromNbToken();
            }
        }

        // The Achat-branch above never fires for $disposal itself (it's a Vente), so the cumulative
        // cost read here still correctly excludes it — but a same-day Achat appearing after $disposal
        // in id-order wouldn't be counted either way; see computeReport()'s doc comment.
        return $this->computeDisposalLine($disposal, $cumulativeAcquisitionCost, $holdings);
    }

    /**
     * @param array<string, float> $holdingsBeforeDisposal coin ticker => quantity held, replayed from
     *                                                      history strictly before $trade
     */
    private function computeDisposalLine(CrTrade $trade, float $cumulativeAcquisitionCost, array $holdingsBeforeDisposal): array
    {
        [$portfolioValue, $source, $missingCoins] = $this->resolvePortfolioValue($trade, $holdingsBeforeDisposal);

        $cessionPrice = $trade->getTotalReal();
        $plusValue = null;
        if ($portfolioValue !== null && $portfolioValue > 0) {
            $plusValue = round($cessionPrice - ($cumulativeAcquisitionCost * $cessionPrice / $portfolioValue), 2);
        }

        return [
            'id' => $trade->getId(),
            'tradeAt' => $trade->getTradeAt()->format('Y-m-d'),
            'fromCoin' => $trade->getFromCoin(),
            'fromNbToken' => $trade->getFromNbToken(),
            'cessionPrice' => $cessionPrice,
            'cumulativeAcquisitionCost' => round($cumulativeAcquisitionCost, 2),
            'portfolioValue' => $portfolioValue !== null ? round($portfolioValue, 2) : null,
            'portfolioValueSource' => $source,
            'missingCoins' => $missingCoins,
            'plusValue' => $plusValue,
        ];
    }

    /**
     * @param array<string, float> $holdingsBeforeDisposal
     * @return array{0: ?float, 1: ?string, 2: string[]} [value, source ('manual'|'api'|null), missingCoins]
     */
    private function resolvePortfolioValue(CrTrade $trade, array $holdingsBeforeDisposal): array
    {
        if ($trade->getManualPortfolioValueTotal() !== null) {
            return [$trade->getManualPortfolioValueTotal(), 'manual', []];
        }

        $value = 0.0;
        $missingCoins = [];

        foreach ($holdingsBeforeDisposal as $coin => $quantity) {
            if ($coin === 'EUR' || $quantity <= 0.00000001) {
                continue;
            }

            $price = $this->priceService->getPriceEur($coin, $trade->getTradeAt());
            if ($price === null) {
                $missingCoins[] = $coin;
                continue;
            }

            $value += $quantity * $price;
        }

        if (!empty($missingCoins)) {
            return [null, null, $missingCoins];
        }

        return [$value, 'api', []];
    }
}
