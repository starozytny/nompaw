<?php

namespace App\Service\Data;

use App\Entity\Holiday\HoProject;
use App\Entity\Holiday\HoPropalDate;
use App\Entity\Holiday\HoPropalHouse;
use App\Service\SanitizeData;

class DataHolidays
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    public function setDataProject(HoProject $obj, $data): HoProject
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setSlug($this->sanitizeData->slugString($data->name))
            ->setDescription($this->sanitizeData->trimData($data->description->html))
        ;
    }

    public function setDataPropalDate(HoPropalDate $obj, $data): HoPropalDate
    {
        return ($obj)
            ->setStartAt($this->sanitizeData->createDatePicker($data->startAt))
            ->setEndAt($this->sanitizeData->createDatePicker($data->endAt))
            ;
    }

    public function setDataPropalHouse(HoPropalHouse $obj, $data): HoPropalHouse
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setUrl($this->sanitizeData->trimData($data->url))
            ->setPrice($this->sanitizeData->setFloatValue($data->price))
            ;
    }
}
