<?php

namespace App\Service\Data;

use App\Entity\Budget\BuItem;
use App\Entity\Budget\BuRecurrent;
use App\Entity\Main\User;
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
            ->setIsActive((int) $data->isActive[0])
            ->setDateAt($this->sanitizeData->createDatePicker($data->dateAt))
        ;
    }

    public function setDataInit(User $obj, $data): User
    {
        return ($obj)
            ->setBudgetInit($this->sanitizeData->setFloatValue($data->total))
            ->setBudgetYear((new \DateTime())->format('Y'))
        ;
    }

    public function setDataRecurrent(BuRecurrent $obj, $data): BuRecurrent
    {
        return ($obj)
            ->setType((int) $data->type)
            ->setPrice($this->sanitizeData->setFloatValue($data->price))
            ->setName($this->sanitizeData->trimData($data->name))
            ->setMonths($data->months)
        ;
    }
}
