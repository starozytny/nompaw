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
        $report = $reportService->computeReport($this->getUser(), $year);

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

        return $apiResponse->apiJsonResponseCustom($reportService->computeSingleLine($obj));
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

        $report = $reportService->computeReport($this->getUser(), $year);

        if ($format === 'excel') {
            $header = [['Date', 'Coin cédé', 'Quantité', 'Prix de cession (€)', "Coût d'acquisition cumulé (€)", 'Valeur portefeuille (€)', 'Source valeur portefeuille', 'Plus-value (€)']];
            $data = [];
            foreach ($report['lines'] as $line) {
                $data[] = [
                    $line['tradeAt'],
                    $line['fromCoin'],
                    $line['fromNbToken'],
                    $line['cessionPrice'],
                    $line['cumulativeAcquisitionCost'],
                    $line['portfolioValue'],
                    $line['portfolioValueSource'] ?? 'manquant',
                    $line['plusValue'],
                ];
            }
            $data[] = ['', '', '', '', '', '', 'Total', $report['totalPlusValue']];

            $export->createFile('excel', "Rapport fiscal $year", $fileName, $header, $data, 8, $nameFolder);
        } else {
            $html = $this->renderView('user/pdf/cryptos/tax_report.html.twig', [
                'year' => $year,
                'lines' => $report['lines'],
                'totalPlusValue' => $report['totalPlusValue'],
                'user' => $this->getUser(),
            ]);

            $pdfExport->createFile($html, $fileName, $nameFolder);
        }

        return $apiResponse->apiJsonResponseCustom(['url' => $this->generateUrl('intern_api_cryptos_tax_report_export', ['year' => $year, 'format' => $format, 'file' => 1])]);
    }
}
