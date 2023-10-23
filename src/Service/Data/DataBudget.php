<?php

namespace App\Service\Data;

use App\Entity\Budget\BuItem;
use App\Service\SanitizeData;

class DataBudget
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    public function setDataItem(BuItem $obj, $data): BuItem
    {
        return ($obj)
            ->setYear($this->sanitizeData->setIntValue($data->year))
            ->setMonth($this->sanitizeData->setIntValue($data->month))
            ->setType((int) $data->type)
            ->setPrice($this->sanitizeData->setFloatValue($data->price))
            ->setName($this->sanitizeData->trimData($data->name))
            ->setIsActive((int) $data->isActive)
            ->setDateAt($this->sanitizeData->createDatePicker($data->dateAt))
        ;
    }
}
