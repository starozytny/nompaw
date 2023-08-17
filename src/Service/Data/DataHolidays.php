<?php

namespace App\Service\Data;

use App\Entity\Holiday\HoProject;
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
}
