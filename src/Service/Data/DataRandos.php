<?php

namespace App\Service\Data;

use App\Entity\Rando\RaGroupe;
use App\Entity\Rando\RaPropalAdventure;
use App\Entity\Rando\RaPropalDate;
use App\Entity\Rando\RaRando;
use App\Service\SanitizeData;

class DataRandos
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    public function setDataGroupe(RaGroupe $obj, $data): RaGroupe
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setSlug($this->sanitizeData->slugString($data->name))
            ->setLevel((int) $data->level)
            ->setIsVisible((int) $data->isVisible)
            ->setDescription($this->sanitizeData->trimData($data->description->html))
        ;
    }

    public function setDataRando(RaRando $obj, $data): RaRando
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setSlug($this->sanitizeData->slugString($data->name))
            ->setDescription($this->sanitizeData->trimData($data->description->html))
            ->setLocalisation($this->sanitizeData->trimData($data->localisation))
            ->setLevel($this->sanitizeData->setIntValue($data->level))
            ->setDistance($this->sanitizeData->setFloatValue($data->distance))
            ->setDevPlus($this->sanitizeData->setIntValue($data->devPlus))
            ->setAltitude($this->sanitizeData->setIntValue($data->altitude))
            ->setStory($this->sanitizeData->trimData($data->story))
            ->setParticipants($data->participants)
        ;
    }

    public function setDataPropalDate(RaPropalDate $obj, $data): RaPropalDate
    {
        return ($obj)
            ->setDateAt($this->sanitizeData->createDate($data->dateAt))
        ;
    }

    public function setDataPropalAdventure(RaPropalAdventure $obj, $data): RaPropalAdventure
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setDuration($this->sanitizeData->createTime($data->duration))
            ->setUrl($this->sanitizeData->trimData($data->url))
        ;
    }
}
