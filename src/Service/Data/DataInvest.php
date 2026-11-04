<?php

namespace App\Service\Data;

use App\Entity\Enum\Invest\EnveloppeType;
use App\Entity\Invest\InEnveloppe;
use App\Entity\Invest\InLine;
use App\Entity\Invest\InSnapshot;
use App\Service\SanitizeData;

class DataInvest
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    public function setDataEnveloppe(InEnveloppe $obj, $data): InEnveloppe
    {
        return ($obj)
            ->setName($this->sanitizeData->sanitizeString($data->name ?? null))
            ->setType(isset($data->type) ? EnveloppeType::from((int) $data->type) : null)
            ->setBuCategoryId(isset($data->buCategoryId) ? $this->sanitizeData->setIntValue($data->buCategoryId) : null)
            ->setTaxExemptDate(isset($data->taxExemptDate) ? $this->sanitizeData->createDate($data->taxExemptDate) : null)
            ->setNotes(isset($data->notes) ? $this->sanitizeData->trimData($data->notes) : null)
            ->setPosition(isset($data->position) ? $this->sanitizeData->setIntValue($data->position, 0) : $obj->getPosition())
        ;
    }

    public function setDataLine(InLine $obj, $data): InLine
    {
        return ($obj)
            ->setName($this->sanitizeData->sanitizeString($data->name ?? null))
            ->setIsin(isset($data->isin) ? $this->sanitizeData->sanitizeString($data->isin) : null)
            ->setTargetAllocationPct(isset($data->targetAllocationPct) ? $this->sanitizeData->setFloatValue($data->targetAllocationPct) : null)
            ->setNotes(isset($data->notes) ? $this->sanitizeData->trimData($data->notes) : null)
            ->setPosition(isset($data->position) ? $this->sanitizeData->setIntValue($data->position, 0) : $obj->getPosition())
        ;
    }

    public function setDataSnapshot(InSnapshot $obj, $data): InSnapshot
    {
        return ($obj)
            ->setDate($this->sanitizeData->createDate($data->date))
            ->setValue($this->sanitizeData->setFloatValue($data->value))
        ;
    }
}
