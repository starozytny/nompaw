<?php

namespace App\Service\Running;

use App\Entity\Main\User;
use App\Repository\Running\RuActivityRepository;
use App\Repository\Running\RuLogRepository;
use App\Repository\Running\RuWeightRepository;

class RunningTrackingBuilder
{
    public function __construct(
        private readonly RuLogRepository $logRepository,
        private readonly RuActivityRepository $activityRepository,
        private readonly RuWeightRepository $weightRepository,
    ) {}

    public function build(User $user): array
    {
        $log = [];
        foreach ($this->logRepository->findAllByUser($user) as $entry) {
            $log[$entry->getDate()->format('Y-m-d')] = [
                'km' => $entry->getKm(),
                'dur' => $entry->getDurationSec() !== null ? $this->formatSecToDur($entry->getDurationSec()) : null,
                'hr' => $entry->getHr(),
                'hrmax' => $entry->getHrMax(),
                'rpe' => $entry->getRpe(),
                'note' => $entry->getNote(),
                'done' => $entry->isDone(),
                'src' => $entry->getSource(),
                'title' => $entry->getTitle(),
            ];
        }

        $activities = array_map(fn ($a) => [
            'd' => $a->getDate()->format('Y-m-d'),
            'km' => $a->getKm(),
            'sec' => $a->getDurationSec(),
            'hr' => $a->getHr(),
            'hrmax' => $a->getHrMax(),
            'title' => $a->getTitle(),
        ], $this->activityRepository->findAllByUser($user));

        $weights = array_map(fn ($w) => [
            'id' => $w->getId(),
            'd' => $w->getDate()->format('Y-m-d'),
            'kg' => $w->getKg(),
            'src' => $w->getSource(),
        ], $this->weightRepository->findAllByUser($user));

        return [
            'log' => $log,
            'activities' => $activities,
            'weights' => $weights,
            'notes' => $user->getRunningNotes() ?? '',
        ];
    }

    private function formatSecToDur(int $sec): string
    {
        $h = intdiv($sec, 3600);
        $m = intdiv($sec % 3600, 60);
        $s = $sec % 60;
        return $h ? sprintf('%d:%02d:%02d', $h, $m, $s) : sprintf('%d:%02d', $m, $s);
    }
}
