<?php

namespace App\Service;

use Dompdf\Dompdf;
use Dompdf\Options;

/**
 * Renders a pre-built HTML string (typically from a Twig template) to a PDF file on disk, via
 * dompdf (pure PHP, no external binary — fits this project's Docker setup). Sibling to Export.php,
 * kept separate so the dompdf dependency stays isolated to one service.
 */
class PdfExport
{
    protected string $privateDirectory;

    public function __construct($privateDirectory)
    {
        $this->privateDirectory = $privateDirectory;

        $this->createFolderIfNotExist($privateDirectory);
    }

    public function createFile(string $html, string $filename, string $folder = ""): void
    {
        $directory = $this->privateDirectory;
        if ($folder !== "") {
            $directory .= $folder;
            $this->createFolderIfNotExist($directory);
        }

        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'Helvetica');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        file_put_contents($directory . $filename, $dompdf->output());
    }

    protected function createFolderIfNotExist($folder): void
    {
        if (!file_exists($folder)) {
            mkdir($folder, 0755, true);
        }
    }
}
