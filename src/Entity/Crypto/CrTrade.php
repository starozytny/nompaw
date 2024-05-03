<?php

namespace App\Entity\Crypto;

use App\Repository\Crypto\CrTradeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CrTradeRepository::class)]
class CrTrade
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $tradeAt = null;

    #[ORM\Column(length: 10)]
    private ?string $fromCoin = null;

    #[ORM\Column(length: 10)]
    private ?string $toCoin = null;

    #[ORM\Column]
    private ?int $type = null;

    #[ORM\Column]
    private ?float $priceFrom = null;

    #[ORM\Column]
    private ?float $priceTo = null;

    #[ORM\Column]
    private ?float $cost = null;

    #[ORM\Column]
    private ?int $costType = null;

    #[ORM\Column]
    private ?float $nbToken = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTradeAt(): ?\DateTimeInterface
    {
        return $this->tradeAt;
    }

    public function setTradeAt(\DateTimeInterface $tradeAt): static
    {
        $this->tradeAt = $tradeAt;

        return $this;
    }

    public function getFromCoin(): ?string
    {
        return $this->fromCoin;
    }

    public function setFromCoin(string $fromCoin): static
    {
        $this->fromCoin = $fromCoin;

        return $this;
    }

    public function getToCoin(): ?string
    {
        return $this->toCoin;
    }

    public function setToCoin(string $toCoin): static
    {
        $this->toCoin = $toCoin;

        return $this;
    }

    public function getType(): ?int
    {
        return $this->type;
    }

    public function setType(int $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getPriceFrom(): ?float
    {
        return $this->priceFrom;
    }

    public function setPriceFrom(float $priceFrom): static
    {
        $this->priceFrom = $priceFrom;

        return $this;
    }

    public function getPriceTo(): ?float
    {
        return $this->priceTo;
    }

    public function setPriceTo(float $priceTo): static
    {
        $this->priceTo = $priceTo;

        return $this;
    }

    public function getCost(): ?float
    {
        return $this->cost;
    }

    public function setCost(float $cost): static
    {
        $this->cost = $cost;

        return $this;
    }

    public function getCostType(): ?int
    {
        return $this->costType;
    }

    public function setCostType(int $costType): static
    {
        $this->costType = $costType;

        return $this;
    }

    public function getNbToken(): ?float
    {
        return $this->nbToken;
    }

    public function setNbToken(float $nbToken): static
    {
        $this->nbToken = $nbToken;

        return $this;
    }
}
