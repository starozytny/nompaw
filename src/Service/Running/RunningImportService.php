<?php

namespace App\Service\Running;

use App\Entity\Main\User;
use App\Entity\Running\RuActivity;
use App\Entity\Running\RuLog;
use App\Entity\Running\RuWeight;
use App\Repository\Running\RuActivityRepository;
use App\Repository\Running\RuLogRepository;
use App\Repository\Running\RuWeightRepository;
use DateTime;

/**
 * Merges a batch of runs parsed either client-side from a Garmin CSV export (see Suivi/lib/csv.js) or
 * fetched server-side from Garmin's Personal API (see GarminApiClient/GarminActivityMapper) — in both
 * cases only the merge-into-history-and-plan step happens here, so every source converges on the same
 * result. Ported from the original importGarminCSV()'s merge half.
 */
class RunningImportService
{
    public function __construct(
        private readonly RuActivityRepository $activityRepository,
        private readonly RuLogRepository $logRepository,
        private readonly RuWeightRepository $weightRepository,
    ) {}

    /**
     * @param array $runs each: ['d' => 'Y-m-d', 'km' => float, 'sec' => int, 'hr' => ?int, 'hrmax' => ?int, 'title' => ?string]
     * @param string|null $rangeStart only runs on/after this ISO date are attached to the day-level plan log (RuLog) —
     *                                 the frontend passes the training plan's own date span; pass null to attach all.
     * @param string|null $rangeEnd
     * @return array{total: int, added: int, attached: int, kept: int}
     */
    public function import(User $user, array $runs, ?string $rangeStart, ?string $rangeEnd): array
    {
        $existingKeys = [];
        foreach ($this->activityRepository->findAllByUser($user) as $activity) {
            $existingKeys[$this->activityKey($activity->getDate()->format('Y-m-d'), $activity->getKm(), $activity->getDurationSec())] = true;
        }

        $added = 0;
        $byDate = [];
        foreach ($runs as $run) {
            $d = (string) $run['d'];
            $km = round((float) $run['km'], 2);
            $sec = (int) $run['sec'];
            $key = $this->activityKey($d, $km, $sec);

            if (!isset($existingKeys[$key])) {
                $activity = (new RuActivity())
                    ->setUser($user)
                    ->setDate(DateTime::createFromFormat('Y-m-d', $d))
                    ->setKm($km)
                    ->setDurationSec($sec)
                    ->setHr(isset($run['hr']) ? (int) $run['hr'] : null)
                    ->setHrMax(isset($run['hrmax']) ? (int) $run['hrmax'] : null)
                    ->setTitle(isset($run['title']) ? mb_substr((string) $run['title'], 0, 120) : null)
                ;
                $this->activityRepository->save($activity, true);
                $existingKeys[$key] = true;
                $added++;
            }

            if ((!$rangeStart || $d >= $rangeStart) && (!$rangeEnd || $d <= $rangeEnd)) {
                $byDate[$d][] = ['km' => $km, 'sec' => $sec, 'hr' => $run['hr'] ?? null, 'title' => $run['title'] ?? ''];
            }
        }

        $attached = 0;
        $kept = 0;
        foreach ($byDate as $d => $list) {
            $date = DateTime::createFromFormat('Y-m-d', $d);
            $log = $this->logRepository->findOneByUserAndDate($user, $date);

            if ($log && $log->getSource() === 'manuel') {
                $kept++;
                continue;
            }

            $km = array_sum(array_column($list, 'km'));
            $sec = array_sum(array_column($list, 'sec'));
            $withHr = array_filter($list, fn ($r) => !empty($r['hr']));
            $hrSec = array_sum(array_column($withHr, 'sec'));
            $hr = $hrSec ? (int) round(array_sum(array_map(fn ($r) => $r['hr'] * $r['sec'], $withHr)) / $hrSec) : null;
            $title = implode(' + ', array_filter(array_column($list, 'title')));

            $log = ($log ?? (new RuLog())->setUser($user)->setDate($date))
                ->setDone(true)
                ->setKm(round($km, 2))
                ->setDurationSec($sec)
                ->setHr($hr)
                ->setSource('garmin')
                ->setTitle($title !== '' ? mb_substr($title, 0, 120) : null)
            ;
            $this->logRepository->save($log, true);
            $attached++;
        }

        return ['total' => count($runs), 'added' => $added, 'attached' => $attached, 'kept' => $kept];
    }

    /**
     * Upserts weight entries fetched from Garmin, never overwriting a day a manual entry already exists
     * for (RuWeight::source === 'manuel' wins, same precedence rule as import()'s RuLog attachment).
     *
     * @param array $weights each: ['d' => 'Y-m-d', 'kg' => float]
     * @return array{total: int, added: int, updated: int, kept: int}
     */
    public function importWeights(User $user, array $weights): array
    {
        $added = 0;
        $updated = 0;
        $kept = 0;

        foreach ($weights as $entry) {
            $date = DateTime::createFromFormat('Y-m-d', (string) $entry['d']);
            $kg = round((float) $entry['kg'], 1);
            $weight = $this->weightRepository->findOneByUserAndDate($user, $date);

            if ($weight && $weight->getSource() === 'manuel') {
                $kept++;
                continue;
            }

            if ($weight) {
                $updated++;
            } else {
                $weight = (new RuWeight())->setUser($user)->setDate($date);
                $added++;
            }

            $weight->setKg($kg)->setSource('garmin');
            $this->weightRepository->save($weight, true);
        }

        return ['total' => count($weights), 'added' => $added, 'updated' => $updated, 'kept' => $kept];
    }

    private function activityKey(string $date, float $km, int $sec): string
    {
        return $date . '|' . $km . '|' . $sec;
    }
}
