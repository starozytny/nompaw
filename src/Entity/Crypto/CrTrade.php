<?php

namespace App\Entity\Crypto;

use App\Repository\Crypto\CrTradeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CrTradeRepository::class)]
class CrTrade
{
    const LIST = ["trade_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['trade_list'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['trade_list'])]
    private ?\DateTimeInterface $tradeAt = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    private ?int $type = null;

    #[ORM\Column(length: 10)]
    #[Groups(['trade_list'])]
    private ?string $fromCoin = null;

    #[ORM\Column(length: 10)]
    #[Groups(['trade_list'])]
    private ?string $toCoin = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    private ?float $fromPrice = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    private ?float $toPrice = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    private ?float $cost = null;

    #[ORM\Column(length: 10)]
    #[Groups(['trade_list'])]
    private ?string $costCoin = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
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

    public function getFromPrice(): ?float
    {
        return $this->fromPrice;
    }

    public function setFromPrice(float $fromPrice): static
    {
        $this->fromPrice = $fromPrice;

        return $this;
    }

    public function getToPrice(): ?float
    {
        return $this->toPrice;
    }

    public function setToPrice(float $toPrice): static
    {
        $this->toPrice = $toPrice;

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

    public function getCostCoin(): ?string
    {
        return $this->costCoin;
    }

    public function setCostCoin(string $costCoin): static
    {
        $this->costCoin = $costCoin;

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
