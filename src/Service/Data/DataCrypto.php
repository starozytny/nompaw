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
        $type = (int) $data->type;

        $tradeTime = str_replace('h', ':', $data->tradeTime);
        $tradeAt = $this->sanitizeData->createDateTimePicker($data->tradeAt . " " . $tradeTime);

        $totalReal = $this->sanitizeData->setFloatValue($data->totalReal);
        $costPrice = $this->sanitizeData->setFloatValue($data->costPrice);
        $costCoin = $this->sanitizeData->trimData($data->costCoin);
        $total = $totalReal;
        if($costCoin == "EUR" && $costPrice){
            $total += $costPrice;
        }

        return ($obj)
            ->setTradeAt($tradeAt)
            ->setType($type)
            ->setFromCoin($this->sanitizeData->trimData($data->fromCoin))
            ->setToCoin($this->sanitizeData->trimData($data->toCoin))
            ->setCostPrice($costPrice)
            ->setCostCoin($costCoin)
            ->setFromNbToken($this->sanitizeData->setFloatValue($data->fromNbToken))
            ->setToNbToken($this->sanitizeData->setFloatValue($data->toNbToken))
            ->setToNbToken($this->sanitizeData->setFloatValue($data->toNbToken))
            ->setFromPrice($this->sanitizeData->setFloatValue($data->fromPrice))
            ->setToPrice($this->sanitizeData->setFloatValue($data->toPrice))
            ->setTotalReal($totalReal)
            ->setTotal($total)
        ;
    }
}
