<?php

namespace App\Service\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Entity\Main\User;
use App\Repository\Crypto\CrTradeRepository;
use App\Service\Crypto\Import\BitpandaParser;
use App\Service\Crypto\Import\CoinbaseParser;
use App\Service\Crypto\Import\CoinbaseProFillsParser;
use App\Service\Crypto\Import\CryptoImportParserInterface;
use App\Service\Crypto\Import\KrakenParser;
use App\Service\Crypto\Import\UpholdParser;
use App\Service\ValidatorService;
use Doctrine\ORM\EntityManagerInterface;
use League\Csv\Reader;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Accepts a single uploaded file (a raw CSV export, or a zip containing one or more of them — e.g.
 * Coinbase's export bundles the main history CSV alongside a "Coinbase Pro/Fills/{year}.csv" per
 * year), auto-detects which exchange format each CSV inside is by matching its header row against
 * each registered parser, and imports the resulting trades with the same isImported/importedFrom/
 * importedId dedup convention already used by the (now superseded) admin:crypto:* CLI commands.
 */
class CryptoImportService
{
    /** @var CryptoImportParserInterface[] */
    private array $parsers;

    public function __construct(
        private readonly CrTradeRepository $tradeRepository,
        private readonly ValidatorService $validator,
        private readonly EntityManagerInterface $entityManager,
        private readonly string $privateDirectory,
    ) {
        $this->parsers = [
            new BitpandaParser(),
            new UpholdParser(),
            new KrakenParser(),
            new CoinbaseParser(),
            new CoinbaseProFillsParser(),
        ];
    }

    public function import(User $user, UploadedFile $file): array
    {
        $imported = 0;
        $duplicates = 0;
        $errors = [];
        $skippedFiles = [];

        $extractedDir = null;
        $csvPaths = $this->extractCsvPaths($file, $errors, $extractedDir);
        $existingIdsBySource = [];

        foreach ($csvPaths as [$path, $label]) {
            $rows = $this->readRows($path);
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

            foreach ($parser->parse($rows) as $data) {
                if (isset($existingIdsBySource[$source][$data['importedId']])) {
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
                    ->setUser($user)
                ;

                $validation = $this->validator->validate($trade);
                if ($validation !== true) {
                    $errors[] = [
                        'file' => $label,
                        'importedId' => $data['importedId'],
                        'message' => implode(', ', array_map(fn ($e) => $e['message'], $validation)),
                    ];
                    continue;
                }

                $this->tradeRepository->save($trade);
                $existingIdsBySource[$source][$data['importedId']] = true;
                $imported++;
            }
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
     * @return list<array{0: string, 1: string}> [absolute path, display label] for every .csv found
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
            if (strtolower($fileInfo->getExtension()) === 'csv') {
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
     * @return list<list<string>>
     */
    private function readRows(string $path): array
    {
        $csv = Reader::createFromPath($path, 'r');
        $csv->setDelimiter(',');

        return iterator_to_array($csv->getRecords(), false);
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
