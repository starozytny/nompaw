<?php

namespace App\Service\Data;

use App\Entity\Running\RuLog;
use App\Entity\Running\RuWeight;
use App\Service\SanitizeData;

class DataRunning
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    /**
     * A log entry carries whatever the day-detail panel sent for that day. Setting a performance field
     * (km/durationSec/hr/hrMax) marks the source as "manuel" and switches the entry to done as soon as a
     * distance is given, mirroring the original logSet()'s per-field behaviour collapsed into one upsert.
     */
    public function setDataLog(RuLog $obj, $data): RuLog
    {
        $km = isset($data->km) ? $this->sanitizeData->setFloatValue($data->km) : null;
        $durationSec = isset($data->durationSec) ? $this->sanitizeData->setIntValue($data->durationSec) : null;
        $hr = isset($data->hr) ? $this->sanitizeData->setIntValue($data->hr) : null;
        $hrMax = isset($data->hrMax) ? $this->sanitizeData->setIntValue($data->hrMax) : null;
        $rpe = isset($data->rpe) ? $this->sanitizeData->setIntValue($data->rpe) : null;
        $note = isset($data->note) ? $this->sanitizeData->trimData($data->note) : null;
        $done = !empty($data->done);

        $manualFieldsTouched = $km !== null || $durationSec !== null || $hr !== null || $hrMax !== null;
        if ($km !== null && $km > 0) {
            $done = true;
        }

        return ($obj)
            ->setDate($this->sanitizeData->createDate($data->date))
            ->setKm($km)
            ->setDurationSec($durationSec)
            ->setHr($hr)
            ->setHrMax($hrMax)
            ->setRpe($rpe)
            ->setNote($note)
            ->setDone($done)
            ->setSource($manualFieldsTouched ? 'manuel' : $obj->getSource())
        ;
    }

    public function setDataWeight(RuWeight $obj, $data): RuWeight
    {
        return ($obj)
            ->setDate($this->sanitizeData->createDate($data->date))
            ->setKg($this->sanitizeData->setFloatValue($data->kg))
        ;
    }
}
