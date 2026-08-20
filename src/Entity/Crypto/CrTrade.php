<?php

namespace App\Entity\Crypto;

use App\Entity\Enum\Crypto\TypeType;
use App\Entity\Main\User;
use App\Repository\Crypto\CrTradeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

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
    #[Assert\NotNull]
    private ?\DateTimeInterface $tradeAt = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    #[Assert\NotNull]
    #[Assert\Choice(choices: [TypeType::Achat, TypeType::Vente, TypeType::Depot, TypeType::Retrait, TypeType::Recuperation, TypeType::Stacking, TypeType::Transfert, TypeType::ACategoriser])]
    private ?int $type = null;

    #[ORM\Column(length: 10)]
    #[Groups(['trade_list'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 10)]
    private ?string $fromCoin = null;

    #[ORM\Column(length: 10)]
    #[Groups(['trade_list'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 10)]
    private ?string $toCoin = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    #[Assert\NotNull]
    #[Assert\PositiveOrZero]
    private ?float $fromPrice = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['trade_list'])]
    #[Assert\PositiveOrZero]
    private ?float $toPrice = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    #[Assert\NotNull]
    #[Assert\PositiveOrZero]
    private ?float $costPrice = null;

    #[ORM\Column(length: 10)]
    #[Groups(['trade_list'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 10)]
    private ?string $costCoin = null;

    #[ORM\Column]
    #[Groups(['trade_list'])]
    #[Assert\NotNull]
    #[Assert\PositiveOrZero]
    private ?float $fromNbToken = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['trade_list'])]
    #[Assert\PositiveOrZero]
    private ?float $toNbToken = null;

    /**
     * Stored in cents to avoid float rounding drift; exposed as euros via getTotalReal()/setTotalReal().
     */
    #[ORM\Column]
    #[Groups(['trade_list'])]
    #[Assert\NotNull]
    private ?int $totalReal = null;

    /**
     * Stored in cents to avoid float rounding drift; exposed as euros via getTotal()/setTotal().
     */
    #[ORM\Column]
    #[Groups(['trade_list'])]
    #[Assert\NotNull]
    private ?int $total = null;

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

    /**
     * The platform's own category label for this transaction, kept only when type = ACategoriser (an
     * import mapper didn't recognize the platform's category and couldn't classify it as one of the
     * other TypeType values) — lets the user see what to reclassify it as instead of silently dropping it.
     */
    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['trade_list'])]
    private ?string $rawCategory = null;

    /**
     * Manual override of the "valeur globale du portefeuille" (CGI art. 150 VH bis) at the moment of
     * this disposal, used by CrTaxReportService when the automatic price lookup can't resolve it.
     * Stored in cents to avoid float rounding drift; exposed as euros via get/setManualPortfolioValueTotal().
     */
    #[ORM\Column(nullable: true)]
    #[Groups(['trade_list'])]
    private ?int $manualPortfolioValueTotal = null;

    /**
     * How the last computed "valeur globale du portefeuille" for this disposal was obtained: 'api',
     * 'manual', or null if not computed yet. See CrTaxReportService.
     */
    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['trade_list'])]
    private ?string $portfolioValueSource = null;

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
        return $this->totalReal !== null ? $this->totalReal / 100 : null;
    }

    public function setTotalReal(float $totalReal): static
    {
        $this->totalReal = (int) round($totalReal * 100);

        return $this;
    }

    public function getTotal(): ?float
    {
        return $this->total !== null ? $this->total / 100 : null;
    }

    public function setTotal(float $total): static
    {
        $this->total = (int) round($total * 100);

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

    public function getRawCategory(): ?string
    {
        return $this->rawCategory;
    }

    public function setRawCategory(?string $rawCategory): static
    {
        $this->rawCategory = $rawCategory;

        return $this;
    }

    public function getManualPortfolioValueTotal(): ?float
    {
        return $this->manualPortfolioValueTotal !== null ? $this->manualPortfolioValueTotal / 100 : null;
    }

    public function setManualPortfolioValueTotal(?float $manualPortfolioValueTotal): static
    {
        $this->manualPortfolioValueTotal = $manualPortfolioValueTotal !== null ? (int) round($manualPortfolioValueTotal * 100) : null;

        return $this;
    }

    public function getPortfolioValueSource(): ?string
    {
        return $this->portfolioValueSource;
    }

    public function setPortfolioValueSource(?string $portfolioValueSource): static
    {
        $this->portfolioValueSource = $portfolioValueSource;

        return $this;
    }
}
