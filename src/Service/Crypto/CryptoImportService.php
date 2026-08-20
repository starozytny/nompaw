<?php

namespace App\Service\Crypto;

use App\Entity\Crypto\CrImportLog;
use App\Entity\Crypto\CrTrade;
use App\Entity\Main\User;
use App\Repository\Crypto\CrImportLogRepository;
use App\Repository\Crypto\CrTradeRepository;
use App\Service\Crypto\Import\BinanceDepositParser;
use App\Service\Crypto\Import\BinanceFiatDepositParser;
use App\Service\Crypto\Import\BinanceFiatPurchaseParser;
use App\Service\Crypto\Import\BinanceFiatWithdrawalParser;
use App\Service\Crypto\Import\BinanceHistoryParser;
use App\Service\Crypto\Import\BinanceWithdrawalParser;
use App\Service\Crypto\Import\CoinbaseProFillsParser;
use App\Service\Crypto\Import\CryptoImportParserInterface;
use App\Service\Crypto\Import\SwissBorgParser;
use App\Service\Crypto\Import\UpholdParser;
use App\Service\ValidatorService;
use Doctrine\ORM\EntityManagerInterface;
use League\Csv\Reader;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Accepts a single uploaded file (a raw CSV/XLSX export, or a zip containing one or more of them — e.g.
 * Coinbase's export bundles the main history CSV alongside a "Coinbase Pro/Fills/{year}.csv" per
 * year), auto-detects which exchange format each file inside is by matching its header row against
 * each registered parser, and imports the resulting trades with the same isImported/importedFrom/
 * importedId dedup convention already used by the (now superseded) admin:crypto:* CLI commands.
 *
 * Every processed file (import()) or API sync call (importFromApi(), used by the Kraken/Coinbase/
 * Binance/Crypto.com controllers) also writes one CrImportLog row via logImport(), regardless of whether
 * it added anything new — this is what powers the "Historique des imports" panel per platform.
 */
class CryptoImportService
{
    private const SUPPORTED_EXTENSIONS = ['csv', 'xlsx', 'xls'];

    /** @var CryptoImportParserInterface[] */
    private array $parsers;

    public function __construct(
        private readonly CrTradeRepository $tradeRepository,
        private readonly CrImportLogRepository $importLogRepository,
        private readonly ValidatorService $validator,
        private readonly EntityManagerInterface $entityManager,
        private readonly string $privateDirectory,
    ) {
        $this->parsers = [
            new UpholdParser(),
            new CoinbaseProFillsParser(),
            new SwissBorgParser(),
            new BinanceDepositParser(),
            new BinanceWithdrawalParser(),
            new BinanceFiatDepositParser(),
            new BinanceFiatWithdrawalParser(),
            new BinanceFiatPurchaseParser(),
            new BinanceHistoryParser(),
        ];
    }

    public function import(User $user, UploadedFile $file): array
    {
        $errors = [];
        $skippedFiles = [];

        $extractedDir = null;
        $csvPaths = $this->extractCsvPaths($file, $errors, $extractedDir);
        $existingIdsBySource = [];

        $imported = 0;
        $duplicates = 0;

        foreach ($csvPaths as [$path, $label]) {
            $rows = $this->readRows($path, $label);
            if (empty($rows)) {
                continue;
            }

            $parser = $this->findParser($rows);
            if ($parser === null) {
                $skippedFiles[] = $label;
                continue;
            }

            $source = $parser->getSourceName();
            if (!isset($existingIdsBySource[$source])) {
                $existingIdsBySource[$source] = $this->loadExistingImportedIds($user, $source);
            }

            $result = $this->persistParsedTrades($user, $source, $parser->parse($rows), $existingIdsBySource[$source], $label);
            $this->logImport($user, $source, 'file', $label, $result);

            $imported += $result['imported'];
            $duplicates += $result['duplicates'];
            $errors = array_merge($errors, $result['errors']);
        }

        $this->entityManager->flush();

        if ($extractedDir !== null) {
            $this->removeDirectory($extractedDir);
        }

        return [
            'imported' => $imported,
            'duplicates' => $duplicates,
            'errors' => $errors,
            'skippedFiles' => $skippedFiles,
        ];
    }

    /**
     * Same shape/behavior as import() (dedup by importedFrom/importedId, validation, single flush) but for
     * trades already parsed from an external API instead of an uploaded file — used by the Kraken/
     * Coinbase/Binance/Crypto.com controllers' sync() actions.
     *
     * @param list<array{importedId: string, tradeAt: \DateTimeInterface, type: int, fromCoin: string, fromNbToken: float, toCoin: string, toNbToken: ?float, costPrice: float, costCoin: string, totalReal: float, total: float}> $parsedTrades
     */
    public function importFromApi(User $user, string $source, array $parsedTrades): array
    {
        $existingIds = $this->loadExistingImportedIds($user, $source);

        $result = $this->persistParsedTrades($user, $source, $parsedTrades, $existingIds, $source);
        $this->logImport($user, $source, 'api', null, $result);

        $this->entityManager->flush();

        return [
            'imported' => $result['imported'],
            'duplicates' => $result['duplicates'],
            'errors' => $result['errors'],
            'skippedFiles' => [],
        ];
    }

    /**
     * @param array<string, true> $existingIds importedId => true, mutated as new trades are persisted so a
     *                                          later call in the same request sees them
     */
    private function persistParsedTrades(User $user, string $source, iterable $parsedTrades, array &$existingIds, string $errorLabel): array
    {
        $imported = 0;
        $duplicates = 0;
        $errors = [];

        foreach ($parsedTrades as $data) {
            if (isset($existingIds[$data['importedId']])) {
                $duplicates++;
                continue;
            }

            $trade = (new CrTrade())
                ->setIsImported(true)
                ->setImportedFrom($source)
                ->setImportedId($data['importedId'])
                ->setTradeAt($data['tradeAt'])
                ->setType($data['type'])
                ->setFromCoin($data['fromCoin'])
                ->setFromNbToken($data['fromNbToken'])
                ->setFromPrice(0)
                ->setToCoin($data['toCoin'])
                ->setToNbToken($data['toNbToken'])
                ->setCostPrice($data['costPrice'])
                ->setCostCoin($data['costCoin'])
                ->setTotalReal($data['totalReal'])
                ->setTotal($data['total'])
                ->setRawCategory($data['rawCategory'] ?? null)
                ->setUser($user)
            ;

            $validation = $this->validator->validate($trade);
            if ($validation !== true) {
                $errors[] = [
                    'file' => $errorLabel,
                    'importedId' => $data['importedId'],
                    'message' => implode(', ', array_map(fn ($e) => $e['message'], $validation)),
                ];
                continue;
            }

            $this->tradeRepository->save($trade);
            $existingIds[$data['importedId']] = true;
            $imported++;
        }

        return ['imported' => $imported, 'duplicates' => $duplicates, 'errors' => $errors];
    }

    /**
     * @param array{imported: int, duplicates: int, errors: array} $result as returned by persistParsedTrades()
     */
    private function logImport(User $user, string $source, string $via, ?string $fileName, array $result): void
    {
        $log = (new CrImportLog())
            ->setUser($user)
            ->setSource($source)
            ->setVia($via)
            ->setFileName($fileName)
            ->setImportedCount($result['imported'])
            ->setDuplicatesCount($result['duplicates'])
            ->setErrorsCount(count($result['errors']))
            ->setErrors($result['errors'] !== [] ? $result['errors'] : null)
            ->setCreatedAt(new \DateTimeImmutable())
        ;

        $this->importLogRepository->save($log);
    }

    private function findParser(array $rows): ?CryptoImportParserInterface
    {
        foreach ($this->parsers as $parser) {
            if ($parser->supports($rows)) {
                return $parser;
            }
        }

        return null;
    }

    /**
     * @param string|null $extractedDir set to the temp extraction directory when the upload was a
     *                                  zip, so the caller can clean it up once import() is done
     * @return list<array{0: string, 1: string}> [absolute path, display label] for every supported file found
     */
    private function extractCsvPaths(UploadedFile $file, array &$errors, ?string &$extractedDir): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if ($extension !== 'zip') {
            return [[$file->getPathname(), $file->getClientOriginalName()]];
        }

        $extractDir = rtrim($this->privateDirectory, '/') . '/import/tmp-' . uniqid();
        mkdir($extractDir, 0755, true);
        $extractedDir = $extractDir;

        $zip = new \ZipArchive();
        if ($zip->open($file->getPathname()) !== true) {
            $errors[] = ['file' => $file->getClientOriginalName(), 'importedId' => null, 'message' => "Impossible d'ouvrir l'archive zip."];

            return [];
        }

        $zip->extractTo($extractDir);
        $zip->close();

        $csvPaths = [];
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($extractDir, \FilesystemIterator::SKIP_DOTS));
        foreach ($iterator as $fileInfo) {
            if (in_array(strtolower($fileInfo->getExtension()), self::SUPPORTED_EXTENSIONS, true)) {
                $csvPaths[] = [$fileInfo->getPathname(), $fileInfo->getFilename()];
            }
        }

        return $csvPaths;
    }

    private function removeDirectory(string $dir): void
    {
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS), \RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($iterator as $fileInfo) {
            $fileInfo->isDir() ? rmdir($fileInfo->getPathname()) : unlink($fileInfo->getPathname());
        }
        rmdir($dir);
    }

    /**
     * $label (the original/display filename, not $path) decides the format — for a direct, non-zipped
     * upload, $path is a temp path with no meaningful extension of its own (UploadedFile::getPathname()
     * points at PHP's upload tmp file, not something named "export.xls").
     *
     * @return list<list<string>>
     */
    private function readRows(string $path, string $label): array
    {
        $extension = strtolower(pathinfo($label, PATHINFO_EXTENSION));

        if (in_array($extension, ['xlsx', 'xls'], true)) {
            return $this->readSpreadsheetRows($path);
        }

        $csv = Reader::createFromPath($path, 'r');
        $csv->setDelimiter(',');

        return iterator_to_array($csv->getRecords(), false);
    }

    /**
     * Reads a spreadsheet export the same way readRows() reads a CSV. PhpSpreadsheet's IOFactory::load()
     * sniffs the actual file content rather than trusting the extension, which matters here — SwissBorg's
     * export is a real XLSX (OOXML zip) despite carrying a ".xls" extension.
     *
     * @return list<list<string>>
     */
    private function readSpreadsheetRows(string $path): array
    {
        $sheet = IOFactory::load($path)->getActiveSheet();

        $rows = [];
        foreach ($sheet->toArray(null, false, false, false) as $row) {
            $rows[] = array_map(static fn ($value) => $value === null ? '' : (string) $value, $row);
        }

        return $rows;
    }

    /**
     * @return array<string, true> importedId => true, for O(1) dedup lookups
     */
    private function loadExistingImportedIds(User $user, string $source): array
    {
        $existing = $this->tradeRepository->findBy(['user' => $user, 'isImported' => true, 'importedFrom' => $source]);

        $ids = [];
        foreach ($existing as $trade) {
            $ids[$trade->getImportedId()] = true;
        }

        return $ids;
    }
}
