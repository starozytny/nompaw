<?php

namespace App\Service\Garmin;

/**
 * Maps raw JSON from Garmin's Personal API into the shapes RunningImportService expects (the same shapes
 * the CSV import already produces client-side, see Suivi/lib/csv.js). Field names confirmed against a
 * live key/account:
 * - /activitylist-service/activities/search/activities items: activityType.typeKey, startTimeLocal
 *   ("Y-m-d H:i:s"), distance (meters), duration (seconds), averageHR, maxHR, activityName.
 * - /weight-service/weight/range/{from}/{to} → {dailyWeightSummaries: [{summaryDate, latestWeight:
 *   {weight (grams), ...}, allWeightMetrics: [...]}]}; allWeightMetrics is usually empty, so
 *   latestWeight.weight is used.
 */
class GarminActivityMapper
{
    private const RUNNING_TYPE_PATTERN = '/^(running|trail_running|track_running|street_running|indoor_running)/i';

    /**
     * @param list<array<string, mixed>> $rawActivities
     *
     * @return list<array{d: string, km: float, sec: int, hr: ?int, hrmax: ?int, title: ?string}>
     */
    public function mapToRuns(array $rawActivities): array
    {
        $runs = [];
        foreach ($rawActivities as $activity) {
            $typeKey = $activity['activityType']['typeKey'] ?? $activity['activityType'] ?? '';
            if (!preg_match(self::RUNNING_TYPE_PATTERN, (string) $typeKey)) {
                continue;
            }

            $date = $this->extractDate($activity);
            $distanceMeters = $activity['distance'] ?? null;
            $durationSec = $activity['duration'] ?? $activity['elapsedDuration'] ?? null;
            if ($date === null || $distanceMeters === null || $durationSec === null) {
                continue;
            }

            $runs[] = [
                'd' => $date,
                'km' => round(((float) $distanceMeters) / 1000, 2),
                'sec' => (int) round((float) $durationSec),
                'hr' => isset($activity['averageHR']) ? (int) round((float) $activity['averageHR']) : null,
                'hrmax' => isset($activity['maxHR']) ? (int) round((float) $activity['maxHR']) : null,
                'title' => $activity['activityName'] ?? null,
            ];
        }

        return $runs;
    }

    /**
     * @param list<array<string, mixed>> $rawWeights each a "dailyWeightSummaries" entry
     *
     * @return list<array{d: string, kg: float}>
     */
    public function mapToWeights(array $rawWeights): array
    {
        $weights = [];
        foreach ($rawWeights as $entry) {
            $date = $entry['summaryDate'] ?? $this->extractDate($entry);
            $grams = $entry['latestWeight']['weight'] ?? null;
            if ($date === null || $grams === null) {
                continue;
            }

            $weights[] = ['d' => substr((string) $date, 0, 10), 'kg' => round(((float) $grams) / 1000, 1)];
        }

        return $weights;
    }

    /**
     * @param array<string, mixed> $entry
     */
    private function extractDate(array $entry): ?string
    {
        $raw = $entry['calendarDate'] ?? $entry['startTimeLocal'] ?? $entry['date'] ?? null;
        if ($raw === null) {
            return null;
        }

        $date = substr((string) $raw, 0, 10);

        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ? $date : null;
    }
}
