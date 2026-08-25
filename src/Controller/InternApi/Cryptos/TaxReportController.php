<?php

namespace App\Controller\InternApi\Cryptos;

use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
use App\Repository\Crypto\CrTradeRepository;
use App\Service\Api\ApiResponse;
use App\Service\Crypto\CrTaxReportService;
use App\Service\Export;
use App\Service\PdfExport;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cryptos/tax-report', name: 'intern_api_cryptos_tax_report_')]
class TaxReportController extends AbstractController
{
    #[Route('/{year}', name: 'index', requirements: ['year' => '\d{4}'], options: ['expose' => true], methods: 'GET')]
    public function index(int $year, CrTaxReportService $reportService, ApiResponse $apiResponse): Response
    {
        // Cache-only (see CrTaxReportService::computeReport()'s $liveFetch default) — a routine page view/
        // year switch must stay fast even with unresolved coin/date pairs. The "Actualiser" button below
        // is what actually pays for the CoinGecko round trips.
        $report = $reportService->computeReport($this->getUser(), $year);

        return $apiResponse->apiJsonResponseCustom($report);
    }

    #[Route('/{year}/refresh', name: 'refresh', requirements: ['year' => '\d{4}'], options: ['expose' => true], methods: 'POST')]
    public function refresh(int $year, CrTaxReportService $reportService, ApiResponse $apiResponse): Response
    {
        $report = $reportService->computeReport($this->getUser(), $year, true);

        return $apiResponse->apiJsonResponseCustom($report);
    }

    #[Route('/override/{id}', name: 'override', options: ['expose' => true], methods: 'PUT')]
    public function override(CrTrade $obj, Request $request, CrTradeRepository $repository,
                              CrTaxReportService $reportService, ApiResponse $apiResponse): Response
    {
        if ($obj->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden('Accès non autorisé.');
        }

        if ($obj->getType() !== TypeType::Vente) {
            return $apiResponse->apiJsonResponseBadRequest('Seule une vente peut avoir une valeur de portefeuille.');
        }

        $data = json_decode($request->getContent());
        if ($data === null || !isset($data->portfolioValueTotal) || !is_numeric($data->portfolioValueTotal)) {
            return $apiResponse->apiJsonResponseBadRequest('Valeur de portefeuille invalide.');
        }

        $obj->setManualPortfolioValueTotal((float) $data->portfolioValueTotal);
        $obj->setPortfolioValueSource('manual');
        $repository->save($obj, true);

        // Filling in a missing portfolio value can shift the acquisition cost basis (see
        // CrTaxReportService's minoration rule) for every later disposal, possibly in other years too —
        // not just this one line — so the caller re-fetches the whole report for THIS disposal's year
        // rather than patching a single row in place.
        $year = (int) $obj->getTradeAt()->format('Y');

        return $apiResponse->apiJsonResponseCustom($reportService->computeReport($this->getUser(), $year));
    }

    #[Route('/holdings/{id}', name: 'holdings', options: ['expose' => true], methods: 'GET')]
    public function holdings(CrTrade $obj, CrTaxReportService $reportService, ApiResponse $apiResponse): Response
    {
        if ($obj->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden('Accès non autorisé.');
        }

        if ($obj->getType() !== TypeType::Vente) {
            return $apiResponse->apiJsonResponseBadRequest('Seule une vente a un portefeuille à valoriser.');
        }

        return $apiResponse->apiJsonResponseCustom(['coins' => $reportService->computeHoldingsSnapshot($obj)]);
    }

    #[Route('/prices/{id}', name: 'prices', options: ['expose' => true], methods: 'PUT')]
    public function prices(CrTrade $obj, Request $request, CrTaxReportService $reportService, ApiResponse $apiResponse): Response
    {
        if ($obj->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden('Accès non autorisé.');
        }

        if ($obj->getType() !== TypeType::Vente) {
            return $apiResponse->apiJsonResponseBadRequest('Seule une vente a un portefeuille à valoriser.');
        }

        $data = json_decode($request->getContent());
        if ($data === null || !isset($data->prices) || !is_object($data->prices)) {
            return $apiResponse->apiJsonResponseBadRequest('Prix invalides.');
        }

        $pricesByCoin = [];
        foreach ($data->prices as $coin => $price) {
            if (!is_numeric($price) || (float) $price <= 0) {
                return $apiResponse->apiJsonResponseBadRequest("Prix invalide pour {$coin}.");
            }
            $pricesByCoin[$coin] = (float) $price;
        }

        $reportService->saveManualPrices($obj, $pricesByCoin);

        // Same reasoning as override() above: a coin/date price fix can ripple into the acquisition cost
        // basis of every later disposal, so the caller re-fetches the whole report for this disposal's year.
        $year = (int) $obj->getTradeAt()->format('Y');

        return $apiResponse->apiJsonResponseCustom($reportService->computeReport($this->getUser(), $year));
    }

    #[Route('/export/{year}/{format}', name: 'export', requirements: ['year' => '\d{4}', 'format' => 'excel|pdf'], options: ['expose' => true], methods: 'GET')]
    public function export(int $year, string $format, Request $request, CrTaxReportService $reportService,
                            Export $export, PdfExport $pdfExport, ApiResponse $apiResponse): BinaryFileResponse|JsonResponse
    {
        $userId = $this->getUser()->getId();
        $nameFolder = "export/cryptos-tax-report/{$userId}/";
        $fileName = $format === 'excel' ? "rapport-fiscal-{$year}.xlsx" : "rapport-fiscal-{$year}.pdf";

        if ($request->query->get('file')) {
            return $this->file($this->getParameter('private_directory') . $nameFolder . $fileName);
        }

        // Unlike index(), an export is already a deliberate, occasional action — worth resolving whatever
        // prices CoinGecko can still provide rather than exporting a report full of cache-only gaps.
        $report = $reportService->computeReport($this->getUser(), $year, true);

        if ($format === 'excel') {
            $header = [[
                'Date (2086 l.211)', 'Coin cédé', 'Quantité',
                'Prix de cession (€) (l.213/218)',
                "Prix total acquisition brut (€) (l.220)",
                'Fractions capital initial consommées (€) (l.221)',
                'Prix total acquisition net (€) (l.223)',
                'Valeur portefeuille (€) (l.212)',
                'Source valeur portefeuille',
                'Plus-value (€)',
            ]];
            $data = [];
            foreach ($report['lines'] as $line) {
                $data[] = [
                    $line['tradeAt'],
                    $line['fromCoin'],
                    $line['fromNbToken'],
                    $line['cessionPrice'],
                    $line['grossAcquisitionCost'],
                    $line['acquisitionFractionsConsumed'],
                    $line['netAcquisitionCost'],
                    $line['portfolioValue'],
                    $line['portfolioValueSource'] ?? 'manquant',
                    $line['plusValue'],
                ];
            }
            $pad = fn (array $row) => array_pad($row, 10, '');
            $data[] = $pad(['', '', '', '', '', '', '', '', 'Total (2086 l.52)', $report['totalPlusValue']]);
            $data[] = $pad([]);
            $data[] = $pad(['Total des prix de cession (2086 l.51)', $report['totalCessionPrice']]);
            $data[] = $pad(['Exonéré (seuil ' . $report['exemptionThreshold'] . ' €)', $report['isExempt'] ? 'Oui' : 'Non']);
            $data[] = $pad(['Ligne 2042 C à reporter', $report['declarationLine']]);
            $data[] = $pad(['Impôt flat tax estimé (' . ($report['flatTaxRate'] * 100) . ' %)', $report['estimatedFlatTax']]);

            $export->createFile('excel', "Rapport fiscal $year", $fileName, $header, $data, 10, $nameFolder);
        } else {
            $html = $this->renderView('user/pdf/cryptos/tax_report.html.twig', [
                'year' => $year,
                'lines' => $report['lines'],
                'report' => $report,
                'user' => $this->getUser(),
            ]);

            $pdfExport->createFile($html, $fileName, $nameFolder);
        }

        return $apiResponse->apiJsonResponseCustom(['url' => $this->generateUrl('intern_api_cryptos_tax_report_export', ['year' => $year, 'format' => $format, 'file' => 1])]);
    }
}
