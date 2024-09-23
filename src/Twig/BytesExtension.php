<?php


namespace App\Twig;


use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;

class BytesExtension extends AbstractExtension
{
    public function getFilters(): array
    {
        return [
            new TwigFilter('sizeFormat', [$this, 'formatSize'])
        ];
    }

    public function formatSize($arg1): string
    {
        $units = array('B', 'Ko', 'Mb', 'Gb', 'Tb');

        $bytes = $arg1;
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        // Uncomment one of the following alternatives
        // $bytes /= pow(1024, $pow);
        $bytes /= (1 << (10 * $pow));

        if($units[$pow] != "B" && $units[$pow] != "Ko"){
            $bytes = round($bytes, 2);
        }else{
            $bytes = round($bytes);
        }

        return $bytes . " " . $units[$pow];
    }
}
