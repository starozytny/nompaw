<?php

namespace App\Service\Data;

use App\Entity\Enum\Rando\DifficultyType;
use App\Entity\Enum\Rando\SuggestionType;
use App\Entity\Rando\RaGroupe;
use App\Entity\Rando\RaPropalAdventure;
use App\Entity\Rando\RaPropalDate;
use App\Entity\Rando\RaRando;
use App\Entity\Rando\RaSuggestion;
use App\Service\SanitizeData;

class DataRandos
{
    public function __construct(
        private readonly SanitizeData $sanitizeData
    ) {}

    public function setDataGroupe(RaGroupe $obj, $data): RaGroupe
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setSlug($this->sanitizeData->slugString($data->name))
            ->setLevel((int) $data->level)
            ->setIsVisible((int) $data->isVisible)
            ->setDescription($this->sanitizeData->trimData($data->description->html))
        ;
    }

    public function setDataRando(RaRando $obj, $data): RaRando
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setSlug($this->sanitizeData->slugString($data->name))
            ->setDescription($this->sanitizeData->trimData($data->description->html))
            ->setLocalisation($this->sanitizeData->trimData($data->localisation))
            ->setLevel($this->sanitizeData->setIntValue($data->level))
            ->setDistance($this->sanitizeData->setFloatValue($data->distance))
            ->setDevPlus($this->sanitizeData->setIntValue($data->devPlus))
            ->setAltitude($this->sanitizeData->setIntValue($data->altitude))
            ->setStory($this->sanitizeData->trimData($data->story))
            ->setParticipants($data->participants)
        ;
    }

    public function setDataPropalDate(RaPropalDate $obj, $data): RaPropalDate
    {
        return ($obj)
            ->setDateAt($this->sanitizeData->createDate($data->dateAt))
        ;
    }

    public function setDataPropalAdventure(RaPropalAdventure $obj, $data): RaPropalAdventure
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setDuration($this->sanitizeData->createTime($data->duration))
            ->setUrl($this->sanitizeData->trimData($data->url))
        ;
    }

    /**
     * Fills a hiking/bivouac suggestion, whether hand-written through the form or proposed by an
     * AI assistant through the MCP tool `propose_rando` (both go through this same mapping).
     */
    public function setDataSuggestion(RaSuggestion $obj, $data): RaSuggestion
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setType(isset($data->type) ? SuggestionType::from((int) $data->type) : null)
            ->setDifficulty(isset($data->difficulty) ? DifficultyType::from((int) $data->difficulty) : null)
            ->setDescription($this->sanitizeData->trimData($data->description ?? null))
            ->setLocation($this->sanitizeData->trimData($data->location ?? null))
            ->setDistanceKm($this->sanitizeData->setFloatValue($data->distanceKm ?? null))
            ->setElevationGainM($this->sanitizeData->setIntValue($data->elevationGainM ?? null))
            ->setAltitudeMaxM($this->sanitizeData->setIntValue($data->altitudeMaxM ?? null))
            ->setDurationMinutes($this->sanitizeData->setIntValue($data->durationMinutes ?? null))
            ->setPointsOfInterest($this->sanitizeStringList($data->pointsOfInterest ?? []))
            ->setPhotoUrls($this->sanitizeStringList($data->photoUrls ?? []))
            ->setSourceUrl($this->sanitizeData->trimData($data->sourceUrl ?? null))
            ->setParkRules($this->sanitizeData->trimData($data->parkRules ?? null))
            ->setTravelTimeFromPeyrollesMinutes($this->sanitizeData->setIntValue($data->travelTimeFromPeyrollesMinutes ?? null))
            ->setTravelBudget($this->sanitizeData->setFloatValue($data->travelBudget ?? null))
            ->setRandoBudget($this->sanitizeData->setFloatValue($data->randoBudget ?? null))
        ;
    }

    /**
     * @return string[]
     */
    private function sanitizeStringList($values): array
    {
        if (!is_array($values) && !is_iterable($values)) {
            return [];
        }

        $values = array_map(fn ($v) => $this->sanitizeData->trimData((string) $v), (array) $values);

        return array_values(array_filter($values, fn ($v) => $v !== null && $v !== ''));
    }
}
