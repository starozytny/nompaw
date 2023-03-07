<?php

namespace App\Service\Data;

use App\Entity\Cook\CoIngredient;
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

    public function setDataIngredient(CoIngredient $obj, $data): CoIngredient
    {
        return ($obj)
            ->setNombre((float) $data->nombre)
            ->setUnit($this->sanitizeData->trimData($data->unit))
            ->setName($this->sanitizeData->trimData($data->name))
        ;
    }
}
