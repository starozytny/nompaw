<?php

namespace App\Service\Data;

use App\Entity\Budget\BuCategory;
use App\Entity\Budget\BuItem;
use App\Entity\Budget\BuRecurrent;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\User;
use App\Service\SanitizeData;

class DataBudget
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    public function setDataItem(BuItem $obj, $data): BuItem
    {
        $dateAt = $this->sanitizeData->createDatePicker($data->dateAt);
        if($data->dateTime !== ""){
            $dateTime = str_replace('h', ':', $data->dateTime);
            $dateAt = $this->sanitizeData->createDateTimePicker($data->dateAt . " " . $dateTime);
        }

        return ($obj)
            ->setYear($this->sanitizeData->setIntValue($data->year))
            ->setMonth($this->sanitizeData->setIntValue($data->month))
            ->setType((int) $data->type)
            ->setLastType((int) $data->type)
            ->setPrice($this->sanitizeData->setFloatValue($data->price))
            ->setName($this->sanitizeData->trimData($data->name))
            ->setIsActive((int) $data->isActive[0])
            ->setDateAt($dateAt)
        ;
    }

    public function setDataItemFromRecurrent(BuItem $obj, BuRecurrent $recurrent, $data): BuItem
    {
        return ($obj)
            ->setYear($this->sanitizeData->setIntValue($data->year))
            ->setMonth($this->sanitizeData->setIntValue($data->month))
            ->setType($recurrent->getType())
            ->setLastType($recurrent->getType())
            ->setPrice($recurrent->getPrice())
            ->setName($recurrent->getName())
            ->setIsActive(true)
            ->setDateAt(new \DateTime())
            ->setRecurrenceId($recurrent->getId())
            ->setRecurrencePrice($recurrent->getPrice())
            ->setCategory($recurrent->getCategory())
        ;
    }

    public function setDataItemFromCategory(BuItem $obj, BuCategory $category, $data): BuItem
    {
        return ($obj)
            ->setYear($this->sanitizeData->setIntValue($data->year))
            ->setMonth($this->sanitizeData->setIntValue($data->month))
            ->setType(TypeType::Used)
            ->setLastType(TypeType::Used)
            ->setPrice($this->sanitizeData->setFloatValue($data->total))
            ->setName('Economie utilisée : ' . $category->getName())
            ->setIsActive(true)
            ->setDateAt(new \DateTime())
            ->setCategory($category)
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
            ->setInitYear($this->sanitizeData->setIntValue($data->initYear))
            ->setInitMonth($this->sanitizeData->setIntValue($data->initMonth))
        ;
    }

    public function setDataCategory(BuCategory $obj, $data): BuCategory
    {
        return ($obj)
            ->setType((int) $data->type)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setGoal($this->sanitizeData->setFloatValue($data->goal))
        ;
    }

}
