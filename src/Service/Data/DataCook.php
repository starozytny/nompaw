<?php

namespace App\Service\Data;

use App\Entity\Cook\CoRecipe;
use App\Service\SanitizeData;

class DataCook
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    public function setDataRecipe(CoRecipe $obj, $data): CoRecipe
    {
        $durationPrepare = str_replace('h', ':', $data->durationPrepare);
        $durationCooking = str_replace('h', ':', $data->durationCooking);

        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setSlug($this->sanitizeData->slugString($data->name))
            ->setDifficulty((int) $data->difficulty)
            ->setContent($this->sanitizeData->trimData($data->content->html))
            ->setDurationPrepare($this->sanitizeData->createTime($durationPrepare))
            ->setDurationCooking($this->sanitizeData->createTime($durationCooking))
        ;
    }
}
