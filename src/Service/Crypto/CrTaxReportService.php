<?php

namespace App\Service\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
use App\Entity\Main\User;
use App\Repository\Crypto\CrTradeRepository;

/**
 * Computes the French crypto capital-gains report (CGI art. 150 VH bis, "régime des plus-values sur
 * biens meubles" applied to crypto-assets — BOI-RPPM-PVBMC-20-10 as of 2026-08), laid out to match the
 * official Cerfa 2086 form line-for-line (lignes 211 à 223, notice explicative "revenus 2024") so a line
 * here can be transcribed directly onto the real form.
 *
 * DISCLAIMER: this implements the author's best understanding of the law at the time it was written,
 * NOT verified by a tax professional. If a rule below is wrong or has changed, THIS FILE is the only
 * place that needs to change — the formula and its inputs are deliberately kept in one place.
 *
 * Business rules confirmed with the app's owner (not to be re-derived from tax code alone):
 * - Only TypeType::Vente trades whose toCoin is EUR are taxable disposals included in the report. A
 *   crypto-to-crypto Vente (fromCoin sold for another crypto, not EUR) isn't a taxable event under CGI
 *   art. 150 VH bis II — only a conversion to legal tender, or a crypto payment for goods/services, is —
 *   so it's excluded from the report entirely: no line, no contribution to totalPlusValue/
 *   totalCessionPrice, and no minoration of the acquisition cost basis (that fraction hasn't actually been
 *   "cashed out", so it must stay available for whichever later disposal really is one). This can only
 *   happen with a manually-entered trade: every import parser already only ever produces a Vente when the
 *   destination is EUR (crypto-to-crypto is always recorded as Achat instead, by convention), but the
 *   manual trade form doesn't enforce that.
 * - "Prix de cession" (2086 l.218) = CrTrade::getTotalReal() (net EUR received), not getTotal().
 * - Only TypeType::Achat trades count as acquisitions for "prix total d'acquisition" (2086 l.220); using
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
 * Formula, applied per disposal (2086 notice, "Comment remplir la déclaration 2086"):
 *   plus_value = prix_de_cession - (prix_total_acquisition_NET * prix_de_cession / valeur_globale_portefeuille)
 * where valeur_globale_portefeuille is the EUR value of the user's ENTIRE crypto portfolio just before
 * this specific disposal, and "prix_total_acquisition_NET" (2086 l.223 = l.220 - l.221 - l.222) is the
 * GROSS sum of every Achat ever made (l.220, never decreasing) MINUS the "fractions de capital initial"
 * (l.221) already consumed by every earlier disposal — critically, this net figure IS reduced after each
 * disposal, by exactly the fraction of the acquisition cost that disposal just used up:
 *   fraction_consumee = prix_total_acquisition_NET_avant * prix_de_cession / valeur_globale_portefeuille
 *   (this is the same quantity subtracted in the plus-value formula above)
 * Official worked example (2086 notice p.7): buy 1000€ (l.220=1000). Portfolio hits 1200€, sell 450€:
 * plus-value = 450 - (1000*450/1200) = 75€, and the 375€ just consumed reduces the acquisition cost to
 * 625€ for the NEXT disposal. Selling the rest later at a 1300€ portfolio value: 1300 - (625*1300/1300)
 * = 675€ — NOT 1300 - 1000 = 300€. A version of this formula that never reduces l.220/223 after a
 * disposal (i.e. treats the cost basis as strictly cumulative) systematically overstates the acquisition
 * cost applied to every later disposal, and can even show a fictitious moins-value on a disposal that
 * made no loss at all once a prior position has been fully exited and re-entered — this is why the
 * "fractions consommées" bookkeeping below (acquisitionFractionsConsumed) exists and is applied
 * regardless of which report $year is being viewed: it has to track the ENTIRE trade history to stay
 * correct, since a disposal in 2023 still reduces the cost basis available to a disposal in 2025.
 */
class CrTaxReportService
{
    /**
     * Flat tax (CGI art. 200 A, 2°) as of 2026: 12,8% income tax + 18,6% prélèvements sociaux.
     * Informational only — the report never assumes the user took this option over the barème progressif
     * (2042 C case 3CN), it just shows what the flat-tax amount would be.
     */
    public const FLAT_TAX_RATE = 0.314;

    /**
     * CGI art. 150 VH bis, II-B: below this total yearly disposal price (across the whole foyer fiscal,
     * all platforms), gains are exempt entirely (2086 notice, ligne 51).
     */
    public const EXEMPTION_THRESHOLD = 305.0;

    public function __construct(
        private readonly CrTradeRepository $tradeRepository,
        private readonly CrPriceService $priceService,
    ) {}

    /**
     * $liveFetch = false (the default, used by TaxReportController::index() for a normal page view) only
     * ever reads CrPriceService's persistent cache — no CoinGecko call, so switching years stays instant
     * even with dozens of never-resolved coin/date pairs, at the cost of showing more lines as "missing"
     * than there might really be. Pass true (the "Actualiser" button, and export()) to actually pay for
     * the CoinGecko round trips and fill in whatever can be resolved.
     */
    public function computeReport(User $user, int $year, bool $liveFetch = false): array
    {
        $trades = $this->tradeRepository->findBy(['user' => $user], ['tradeAt' => 'ASC', 'id' => 'ASC']);

        $grossAcquisitionCost = 0.0;
        $acquisitionFractionsConsumed = 0.0;
        $holdings = [];
        $lines = [];
        $totalPlusValue = 0.0;
        $totalCessionPrice = 0.0;
        $hasMissingValues = false;

        foreach ($trades as $trade) {
            $isVente = $trade->getType() === TypeType::Vente;
            $isFiatDisposal = $isVente && $trade->getToCoin() === 'EUR';

            if ($isFiatDisposal) {
                [$line, $fractionConsumed] = $this->computeDisposalLine($trade, $grossAcquisitionCost, $acquisitionFractionsConsumed, $holdings, $liveFetch);
                $tradeYear = (int) $trade->getTradeAt()->format('Y');

                if ($tradeYear === $year) {
                    if ($line['plusValue'] === null) {
                        $hasMissingValues = true;
                    } else {
                        $totalPlusValue += $line['plusValue'];
                    }
                    $totalCessionPrice += $line['cessionPrice'];
                    $lines[] = $line;
                } elseif ($fractionConsumed === null && $tradeYear <= $year) {
                    // An earlier year's disposal couldn't be minored (missing portfolio value) — the cost
                    // basis feeding into every disposal shown in THIS report is corrupted from that point
                    // on, even though the offending line itself isn't displayed here.
                    $hasMissingValues = true;
                }

                // Minoration (2086 notice l.221/261/321, see class docblock): applied for every disposal
                // in the user's history, not just ones in $year, since the running cost basis must stay
                // correct for whichever later year gets reported next.
                if ($fractionConsumed !== null) {
                    $acquisitionFractionsConsumed += $fractionConsumed;
                }
            }

            if ($trade->getType() === TypeType::Achat) {
                $grossAcquisitionCost += $trade->getTotal();
                $holdings[$trade->getToCoin()] = ($holdings[$trade->getToCoin()] ?? 0.0) + $trade->getToNbToken();
            } elseif ($isVente) {
                $holdings[$trade->getFromCoin()] = ($holdings[$trade->getFromCoin()] ?? 0.0) - $trade->getFromNbToken();
            }
        }

        $isExempt = $totalCessionPrice <= self::EXEMPTION_THRESHOLD;
        $taxableAmount = (!$isExempt && $totalPlusValue > 0) ? $totalPlusValue : 0.0;

        return [
            'year' => $year,
            'lines' => $lines,
            'totalPlusValue' => round($totalPlusValue, 2),
            'totalCessionPrice' => round($totalCessionPrice, 2),
            'hasMissingValues' => $hasMissingValues,
            'isExempt' => $isExempt,
            'exemptionThreshold' => self::EXEMPTION_THRESHOLD,
            'declarationLine' => $totalPlusValue >= 0 ? '3AN' : '3BN',
            'flatTaxRate' => self::FLAT_TAX_RATE,
            'estimatedFlatTax' => round($taxableAmount * self::FLAT_TAX_RATE, 2),
        ];
    }

    /**
     * Recomputes a single disposal line, e.g. right after a manual portfolio-value override so the
     * caller doesn't need to regenerate the whole report just to refresh one row. Always resolves prices
     * live (unlike computeReport()'s default) — this only ever runs as a direct reaction to the user
     * editing one disposal, not on every report view, so paying for the CoinGecko round trip here is fine.
     */
    public function computeSingleLine(CrTrade $disposal): array
    {
        [$grossAcquisitionCost, $acquisitionFractionsConsumed, $holdings] = $this->replayBefore($disposal);

        [$line] = $this->computeDisposalLine($disposal, $grossAcquisitionCost, $acquisitionFractionsConsumed, $holdings, true);

        return $line;
    }

    /**
     * Per-coin breakdown of the portfolio held strictly before $disposal — powers the price-editing panel
     * (TaxReportController::holdings()/updatePrices()) so the user can fill in a EUR price for each coin
     * they actually held at that moment, instead of a single opaque portfolio total. Includes coins whose
     * price already resolved (a per-cession manual entry on this trade, else the shared CoinGecko cache),
     * not just the missing ones, so they're visible and correctable too.
     *
     * @return list<array{coin: string, quantity: float, price: ?float}>
     */
    public function computeHoldingsSnapshot(CrTrade $disposal): array
    {
        [, , $holdings] = $this->replayBefore($disposal);

        $manualPrices = $disposal->getManualCoinPrices();

        $snapshot = [];
        foreach ($holdings as $coin => $quantity) {
            if ($coin === 'EUR' || $quantity <= 0.00000001) {
                continue;
            }

            $snapshot[] = [
                'coin' => $coin,
                'quantity' => $quantity,
                // The per-cession manual price wins over the shared CoinGecko/CrPriceHistory cache, so
                // reopening the panel shows what was actually entered for THIS disposal.
                'price' => $manualPrices[strtoupper($coin)] ?? $this->priceService->getPriceEur($coin, $disposal->getTradeAt()),
            ];
        }

        usort($snapshot, fn (array $a, array $b) => ($b['quantity'] * ($b['price'] ?? 0)) <=> ($a['quantity'] * ($a['price'] ?? 0)));

        return $snapshot;
    }

    /**
     * Saves a EUR unit price for each given coin ON $disposal ITSELF (CrTrade::manualCoinPrices), scoped to
     * this one cession — NOT into the shared CrPriceHistory (coin, date) cache. Two disposals on the same
     * date are therefore valued from their own entered prices, independently of each other. New prices are
     * merged into whatever was entered before, so editing one coin doesn't wipe the others. Clears any
     * pre-existing whole-portfolio manual override on this disposal (CrTrade::manualPortfolioValueTotal) so
     * the freshly computed per-coin sum takes over — the two mechanisms would otherwise silently conflict,
     * since resolvePortfolioValue() always prefers the whole-total override first.
     *
     * @param array<string, float> $pricesByCoin coin ticker => EUR unit price
     */
    public function saveManualPrices(CrTrade $disposal, array $pricesByCoin): array
    {
        $merged = $disposal->getManualCoinPrices();
        foreach ($pricesByCoin as $coin => $price) {
            $merged[strtoupper($coin)] = $price;
        }

        $disposal->setManualCoinPrices($merged);
        if ($disposal->getManualPortfolioValueTotal() !== null) {
            $disposal->setManualPortfolioValueTotal(null);
        }
        $disposal->setPortfolioValueSource('manual');
        $this->tradeRepository->save($disposal, true);

        return $this->computeSingleLine($disposal);
    }

    /**
     * @return array{0: float, 1: float, 2: array<string, float>} [grossAcquisitionCost,
     *         acquisitionFractionsConsumed, holdings] replayed from the user's full trade history, in
     *         order, strictly before $stopBefore.
     */
    private function replayBefore(CrTrade $stopBefore): array
    {
        $trades = $this->tradeRepository->findBy(['user' => $stopBefore->getUser()], ['tradeAt' => 'ASC', 'id' => 'ASC']);

        $grossAcquisitionCost = 0.0;
        $acquisitionFractionsConsumed = 0.0;
        $holdings = [];

        foreach ($trades as $trade) {
            if ($trade->getId() === $stopBefore->getId()) {
                break;
            }

            $isVente = $trade->getType() === TypeType::Vente;

            if ($isVente && $trade->getToCoin() === 'EUR') {
                [, $fractionConsumed] = $this->computeDisposalLine($trade, $grossAcquisitionCost, $acquisitionFractionsConsumed, $holdings, true);
                if ($fractionConsumed !== null) {
                    $acquisitionFractionsConsumed += $fractionConsumed;
                }
            }

            if ($isVente) {
                $holdings[$trade->getFromCoin()] = ($holdings[$trade->getFromCoin()] ?? 0.0) - $trade->getFromNbToken();
            }

            if ($trade->getType() === TypeType::Achat) {
                $grossAcquisitionCost += $trade->getTotal();
                $holdings[$trade->getToCoin()] = ($holdings[$trade->getToCoin()] ?? 0.0) + $trade->getToNbToken();
            }
        }

        return [$grossAcquisitionCost, $acquisitionFractionsConsumed, $holdings];
    }

    /**
     * @param array<string, float> $holdingsBeforeDisposal coin ticker => quantity held, replayed from
     *                                                      history strictly before $trade
     * @return array{0: array, 1: ?float} the 2086-shaped report line, plus the "fraction de capital
     *         initial" (l.221/261/321) this disposal just consumed — null when the portfolio value
     *         couldn't be resolved, in which case the caller must NOT apply any minoration for this trade
     *         (the cost basis for every later disposal is left stale/overstated until this one is fixed,
     *         surfaced via hasMissingValues).
     */
    private function computeDisposalLine(CrTrade $trade, float $grossAcquisitionCost, float $acquisitionFractionsConsumed, array $holdingsBeforeDisposal, bool $liveFetch): array
    {
        $netAcquisitionCost = $grossAcquisitionCost - $acquisitionFractionsConsumed;
        [$portfolioValue, $source, $missingCoins] = $this->resolvePortfolioValue($trade, $holdingsBeforeDisposal, $liveFetch);

        $cessionPrice = $trade->getTotalReal();
        $plusValue = null;
        $fractionConsumed = null;
        if ($portfolioValue !== null && $portfolioValue > 0) {
            $fractionConsumed = $netAcquisitionCost * $cessionPrice / $portfolioValue;
            $plusValue = round($cessionPrice - $fractionConsumed, 2);
        }

        $line = [
            // 2086 field numbers (declarant 1: l.211-223) noted alongside each key so the report can be
            // transcribed onto the real form; l.213-217 and l.222 collapse to l.218/l.220 here since this
            // app doesn't separately track disposal fees or exchange soultes.
            'id' => $trade->getId(),
            'tradeAt' => $trade->getTradeAt()->format('Y-m-d'), // l.211
            'tradeTime' => $trade->getTradeAt()->format('H:i'), // display-only, not part of the 2086 form
            'fromCoin' => $trade->getFromCoin(),
            'fromNbToken' => $trade->getFromNbToken(),
            'cessionPrice' => $cessionPrice, // l.213 = l.218 (no fee/soulte tracked)
            'grossAcquisitionCost' => round($grossAcquisitionCost, 2), // l.220
            'acquisitionFractionsConsumed' => round($acquisitionFractionsConsumed, 2), // l.221
            'netAcquisitionCost' => round($netAcquisitionCost, 2), // l.223 = l.220 - l.221
            'portfolioValue' => $portfolioValue !== null ? round($portfolioValue, 2) : null, // l.212
            'portfolioValueSource' => $source,
            'missingCoins' => $missingCoins,
            'plusValue' => $plusValue, // l.218 - [l.223 x (l.217/l.212)]
        ];

        return [$line, $fractionConsumed];
    }

    /**
     * @param array<string, float> $holdingsBeforeDisposal
     * @return array{0: ?float, 1: ?string, 2: string[]} [value, source ('manual'|'api'|null), missingCoins]
     */
    private function resolvePortfolioValue(CrTrade $trade, array $holdingsBeforeDisposal, bool $liveFetch): array
    {
        if ($trade->getManualPortfolioValueTotal() !== null) {
            return [$trade->getManualPortfolioValueTotal(), 'manual', []];
        }

        $manualPrices = $trade->getManualCoinPrices();
        $value = 0.0;
        $missingCoins = [];
        $usedManual = false;

        foreach ($holdingsBeforeDisposal as $coin => $quantity) {
            if ($coin === 'EUR' || $quantity <= 0.00000001) {
                continue;
            }

            // A price entered by hand for THIS cession wins over the shared CoinGecko/CrPriceHistory
            // cache, so a disposal is valued from its own prices even when another disposal exists on the
            // same date.
            $price = $manualPrices[strtoupper($coin)] ?? null;
            if ($price !== null) {
                $usedManual = true;
            } else {
                $price = $this->priceService->getPriceEur($coin, $trade->getTradeAt(), $liveFetch);
            }

            if ($price === null) {
                $missingCoins[] = $coin;
                continue;
            }

            $value += $quantity * $price;
        }

        if (!empty($missingCoins)) {
            return [null, null, $missingCoins];
        }

        return [$value, $usedManual ? 'manual' : 'api', []];
    }
}
