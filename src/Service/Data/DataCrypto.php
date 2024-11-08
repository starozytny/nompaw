<?php

namespace App\Service\Data;

use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
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

        $totalReal = $this->sanitizeData->setFloatValue($data->totalReal);
        $costPrice = $this->sanitizeData->setFloatValue($data->costPrice);
        $costCoin = $this->sanitizeData->trimData($data->costCoin);
        $total = $totalReal;
        if($costCoin == "EUR" && $costPrice){
            $total += $costPrice;
        }

        $fromNbToken = $this->sanitizeData->setFloatValue($data->fromNbToken);
        $fromCoin = $this->sanitizeData->trimData($data->fromCoin);
        $fromPrice = $this->sanitizeData->setFloatValue($data->fromPrice);
        $toPrice = $this->sanitizeData->setFloatValue($data->toPrice);
        if($type === TypeType::Depot){
            $fromNbToken = $this->sanitizeData->setFloatValue($data->toNbToken);
            $fromCoin = $this->sanitizeData->trimData($data->toCoin);
            $fromPrice=1;
            $toPrice=1;
        }

        return ($obj)
            ->setTradeAt($this->sanitizeData->createDate($data->tradeAt))
            ->setType($type)
            ->setFromCoin($fromCoin)
            ->setToCoin($this->sanitizeData->trimData($data->toCoin))
            ->setCostPrice($costPrice)
            ->setCostCoin($costCoin)
            ->setFromNbToken($fromNbToken)
            ->setToNbToken($this->sanitizeData->setFloatValue($data->toNbToken))
            ->setFromPrice($fromPrice)
            ->setToPrice($toPrice)
            ->setTotalReal($totalReal)
            ->setTotal($total)
        ;
    }
}
