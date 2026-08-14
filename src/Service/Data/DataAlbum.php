<?php

namespace App\Service\Data;

use App\Entity\Photo\PhAlbum;
use App\Service\SanitizeData;

class DataAlbum
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    public function setDataAlbum(PhAlbum $obj, $data): PhAlbum
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setDescription($this->sanitizeData->trimData($data->description ?? null))
        ;
    }
}
