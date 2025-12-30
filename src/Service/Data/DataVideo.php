<?php

namespace App\Service\Data;

use App\Entity\Video\ViVideo;
use App\Service\SanitizeData;

class DataVideo
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    public function setDataVideo(ViVideo $obj, $data): ViVideo
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setFilename($this->sanitizeData->trimData($data->filename))
            ->setFileSize($this->sanitizeData->setFloatValueWithZero($data->fileSize))
            ->setFileExtension($this->sanitizeData->trimData($data->fileExtension))
        ;
    }
}
