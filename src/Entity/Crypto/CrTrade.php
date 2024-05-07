<?php

namespace App\Entity\Crypto;

use App\Entity\Main\User;
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

    #[ORM\Column(nullable: true)]
    #[Groups(['trade_list'])]
    private ?float $toPrice = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    private ?float $costPrice = null;

    #[ORM\Column(length: 10)]
    #[Groups(['trade_list'])]
    private ?string $costCoin = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    private ?float $fromNbToken = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['trade_list'])]
    private ?float $toNbToken = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    private ?float $totalReal = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    private ?float $total = null;

    #[ORM\ManyToOne(inversedBy: 'crTrades')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column]
    private ?bool $isImported = false;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['trade_list'])]
    private ?string $importedFrom = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $importedId = null;

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

    public function setToPrice(?float $toPrice): static
    {
        $this->toPrice = $toPrice;

        return $this;
    }

    public function getCostPrice(): ?float
    {
        return $this->costPrice;
    }

    public function setCostPrice(float $costPrice): static
    {
        $this->costPrice = $costPrice;

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

    public function getFromNbToken(): ?float
    {
        return $this->fromNbToken;
    }

    public function setFromNbToken(float $fromNbToken): static
    {
        $this->fromNbToken = $fromNbToken;

        return $this;
    }

    public function getToNbToken(): ?float
    {
        return $this->toNbToken;
    }

    public function setToNbToken(?float $toNbToken): static
    {
        $this->toNbToken = $toNbToken;

        return $this;
    }

    public function getTotalReal(): ?float
    {
        return $this->totalReal;
    }

    public function setTotalReal(float $totalReal): static
    {
        $this->totalReal = $totalReal;

        return $this;
    }

    public function getTotal(): ?float
    {
        return $this->total;
    }

    public function setTotal(float $total): static
    {
        $this->total = $total;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function isIsImported(): ?bool
    {
        return $this->isImported;
    }

    public function setIsImported(bool $isImported): static
    {
        $this->isImported = $isImported;

        return $this;
    }

    public function getImportedFrom(): ?string
    {
        return $this->importedFrom;
    }

    public function setImportedFrom(?string $importedFrom): static
    {
        $this->importedFrom = $importedFrom;

        return $this;
    }

    public function getImportedId(): ?string
    {
        return $this->importedId;
    }

    public function setImportedId(?string $importedId): static
    {
        $this->importedId = $importedId;

        return $this;
    }
}
