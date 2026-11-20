<?php

namespace App\Service\Rando;

use App\Entity\Rando\RaSuggestion;
use App\Entity\Rando\RaSuggestionTrace;
use App\Repository\Rando\RaSuggestionTraceRepository;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\String\Slugger\SluggerInterface;

/**
 * Validates, measures, stores and downloads GPX routes for suggestions.
 */
class GpxService
{
    public const MAX_BYTES = 8 * 1024 * 1024;
    private const ELEVATION_NOISE_M = 2.0; // ignore altitude jitter below this when summing D+

    public function __construct(
        private readonly string $publicDirectory,
        private readonly SluggerInterface $slugger,
        private readonly RaSuggestionTraceRepository $traceRepository,
    ) {
    }

    /**
     * @return array{count: int, distanceKm: float, elevationGainM: ?int, altitudeMaxM: ?int}
     * @throws \InvalidArgumentException when the content is not a usable GPX
     */
    public function analyse(string $xml): array
    {
        if (strlen($xml) > self::MAX_BYTES) {
            throw new \InvalidArgumentException('Fichier GPX trop volumineux (8 Mo max).');
        }

        $previous = libxml_use_internal_errors(true);
        $gpx = simplexml_load_string($xml, \SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOCDATA);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if ($gpx === false || strtolower($gpx->getName()) !== 'gpx') {
            throw new \InvalidArgumentException("Ce fichier n'est pas un GPX valide.");
        }

        $points = [];
        foreach ($gpx->xpath('//*[local-name()="trkpt" or local-name()="rtept"]') ?: [] as $pt) {
            $ele = isset($pt->ele) && is_numeric((string) $pt->ele) ? (float) $pt->ele : null;
            $points[] = [(float) $pt['lat'], (float) $pt['lon'], $ele];
        }
        if (count($points) < 2) {
            throw new \InvalidArgumentException('Le GPX ne contient aucune trace (moins de 2 points).');
        }

        $distance = 0.0;
        $gain = 0.0;
        $max = null;
        $ref = null; // last altitude that counted, for noise filtering
        $hasEle = false;
        foreach ($points as $i => [$lat, $lon, $ele]) {
            if ($i > 0) {
                $distance += self::haversine($points[$i - 1][0], $points[$i - 1][1], $lat, $lon);
            }
            if ($ele !== null) {
                $hasEle = true;
                $max = $max === null ? $ele : max($max, $ele);
                if ($ref === null) {
                    $ref = $ele;
                } elseif (abs($ele - $ref) >= self::ELEVATION_NOISE_M) {
                    $gain += max(0, $ele - $ref);
                    $ref = $ele;
                }
            }
        }

        return [
            'count' => count($points),
            'distanceKm' => round($distance / 1000, 2),
            'elevationGainM' => $hasEle ? (int) round($gain) : null,
            'altitudeMaxM' => $max !== null ? (int) round($max) : null,
        ];
    }

    /**
     * Validates then stores the GPX as a new trace of the suggestion (persisted + flushed).
     */
    public function addTrace(RaSuggestion $suggestion, string $name, string $xml, string $source): RaSuggestionTrace
    {
        $stats = $this->analyse($xml);

        $dir = $this->publicDirectory . '/' . RaSuggestionTrace::FOLDER;
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new \RuntimeException("Impossible de créer le dossier des traces.");
        }
        $fileName = $this->slugger->slug($name)->lower() . '-' . uniqid() . '.gpx';
        file_put_contents($dir . '/' . $fileName, $xml);

        $trace = (new RaSuggestionTrace())
            ->setSuggestion($suggestion)
            ->setName(mb_substr(trim($name) ?: 'Trace', 0, 255))
            ->setFileName($fileName)
            ->setDistanceKm($stats['distanceKm'])
            ->setElevationGainM($stats['elevationGainM'])
            ->setAltitudeMaxM($stats['altitudeMaxM'])
            ->setSource($source);
        $suggestion->getTraces()->add($trace);
        $this->traceRepository->save($trace, true);

        return $trace;
    }

    public function deleteFile(RaSuggestionTrace $trace): void
    {
        $file = $this->publicDirectory . '/' . RaSuggestionTrace::FOLDER . '/' . basename((string) $trace->getFileName());
        if (is_file($file)) {
            unlink($file);
        }
    }

    /**
     * Downloads a GPX from a public URL. SSRF guard: http(s) only, host must resolve to public
     * IPs only, no redirects followed, size and duration capped.
     */
    public function download(string $url): string
    {
        $parts = parse_url($url);
        if (!in_array($parts['scheme'] ?? '', ['http', 'https'], true) || empty($parts['host'])) {
            throw new \InvalidArgumentException('URL GPX invalide (http/https uniquement).');
        }
        $ips = gethostbynamel($parts['host']) ?: [];
        if ($ips === []) {
            throw new \InvalidArgumentException("Hôte GPX introuvable : {$parts['host']}.");
        }
        foreach ($ips as $ip) {
            if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                throw new \InvalidArgumentException('URL GPX refusée (adresse non publique).');
            }
        }

        $client = HttpClient::create(['max_redirects' => 0, 'timeout' => 10, 'max_duration' => 20]);
        $response = $client->request('GET', $url);
        if ($response->getStatusCode() !== 200) {
            throw new \InvalidArgumentException("Téléchargement GPX impossible (HTTP {$response->getStatusCode()}).");
        }
        $body = '';
        foreach ($client->stream($response) as $chunk) {
            $body .= $chunk->getContent();
            if (strlen($body) > self::MAX_BYTES) {
                $response->cancel();
                throw new \InvalidArgumentException('Fichier GPX trop volumineux (8 Mo max).');
            }
        }

        return $body;
    }

    private static function haversine(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $r = 6371000.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return 2 * $r * asin(min(1, sqrt($a)));
    }
}
