<?php

namespace App\Service\Data;

use App\Entity\Rando\RaGroupe;
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
}
