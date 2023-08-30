<?php

namespace App\Service\Data;

use App\Entity\Birthday\BiBirthday;
use App\Entity\Birthday\BiPresent;
use App\Service\SanitizeData;

class DataBirthdays
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    public function setDataBirthday(BiBirthday $obj, $data): BiBirthday
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setSlug($this->sanitizeData->slugString($data->name))
            ->setDescription($this->sanitizeData->trimData($data->description->html))
            ->setStartAt($this->sanitizeData->createDatePicker($data->startAt))
            ->setIframeRoute($this->sanitizeData->trimData($data->iframeRoute))
        ;
    }

    public function setDataPresent(BiPresent $obj, $data): BiPresent
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setUrl($this->sanitizeData->trimData($data->url))
            ->setPrice($this->sanitizeData->setFloatValue($data->price))
        ;
    }
}
