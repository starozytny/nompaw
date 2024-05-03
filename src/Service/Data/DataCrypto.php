<?php

namespace App\Service\Data;

use App\Entity\Crypto\CrTrade;
use App\Service\SanitizeData;
use Exception;

class DataCrypto
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    /**
     * @throws Exception
     */
    public function setDataTrade(CrTrade $obj, $data): CrTrade
    {
        return ($obj)
            ->setTradeAt($this->sanitizeData->createDate($data->tradeAt))
            ->setType((int) $data->type)
            ->setFromCoin($this->sanitizeData->trimData($data->fromCoin))
            ->setToCoin($this->sanitizeData->trimData($data->toCoin))
            ->setFromPrice($this->sanitizeData->setFloatValue($data->fromPrice))
            ->setNbToken($this->sanitizeData->setFloatValue($data->nbToken))
            ->setToPrice($this->sanitizeData->setFloatValue($data->toPrice))
            ->setCostPrice($this->sanitizeData->setFloatValue($data->costPrice))
            ->setCostCoin($this->sanitizeData->trimData($data->costCoin))
        ;
    }
}
