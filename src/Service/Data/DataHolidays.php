<?php

namespace App\Service\Data;

use App\Entity\Holiday\HoLifestyle;
use App\Entity\Holiday\HoProject;
use App\Entity\Holiday\HoPropalActivity;
use App\Entity\Holiday\HoPropalHouse;
use App\Entity\Holiday\HoTodo;
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
            ->setStartAt($this->sanitizeData->createDate($data->startAt))
            ->setEndAt($this->sanitizeData->createDate($data->endAt))
            ->setParticipants($this->sanitizeData->setIntValue($data->participants, 1))
            ->setDescription($this->sanitizeData->trimData($data->description->html))
            ->setMaxBudget($this->sanitizeData->setFloatValue($data->maxBudget))
        ;
    }

    public function setDataPropalHouse(HoPropalHouse $obj, $data): HoPropalHouse
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setUrl($this->sanitizeData->trimData($data->url))
            ->setPrice($this->sanitizeData->setFloatValue($data->price))
            ->setNbNights($this->sanitizeData->setIntValue($data->nbNights, 1))
            ->setLocalisation($this->sanitizeData->trimData($data->localisation))
        ;
    }

    public function setDataLifestyle(HoLifestyle $obj, $data): HoLifestyle
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setUnit($this->sanitizeData->trimData($data->unit))
            ->setPrice($this->sanitizeData->setFloatValue($data->price))
            ->setPriceType((int) $data->priceType)
            ;
    }

    public function setDataPropalActivity(HoPropalActivity $obj, $data): HoPropalActivity
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setUrl($this->sanitizeData->trimData($data->url))
            ->setPrice($this->sanitizeData->setFloatValue($data->price))
            ->setPriceType((int) $data->priceType)
            ->setDescription($this->sanitizeData->trimData($data->description))
            ;
    }

    public function setDataTodo(HoTodo $obj, $data): HoTodo
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
        ;
    }
}
