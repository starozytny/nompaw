<?php

namespace App\Entity\Crypto;

use App\Repository\Crypto\CrPriceHistoryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Persistent cache of historical EUR prices per coin/day, fetched via CrPriceService. Kept as a real
 * entity (not a symfony/cache pool) so a generated tax report stays reproducible/auditable later and
 * so re-running a report never repeats an API call for a coin/date pair already resolved.
 */
#[ORM\Entity(repositoryClass: CrPriceHistoryRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_cr_price_history_coin_date', columns: ['coin', 'price_date'])]
class CrPriceHistory
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 10)]
    private ?string $coin = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $priceDate = null;

    #[ORM\Column]
    private ?float $priceEur = null;

    #[ORM\Column(length: 20)]
    private ?string $source = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $fetchedAt = null;

    public function __construct()
    {
        $this->fetchedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCoin(): ?string
    {
        return $this->coin;
    }

    public function setCoin(string $coin): static
    {
        $this->coin = $coin;

        return $this;
    }

    public function getPriceDate(): ?\DateTimeInterface
    {
        return $this->priceDate;
    }

    public function setPriceDate(\DateTimeInterface $priceDate): static
    {
        $this->priceDate = $priceDate;

        return $this;
    }

    public function getPriceEur(): ?float
    {
        return $this->priceEur;
    }

    public function setPriceEur(float $priceEur): static
    {
        $this->priceEur = $priceEur;

        return $this;
    }

    public function getSource(): ?string
    {
        return $this->source;
    }

    public function setSource(string $source): static
    {
        $this->source = $source;

        return $this;
    }

    public function getFetchedAt(): ?\DateTimeInterface
    {
        return $this->fetchedAt;
    }

    public function setFetchedAt(\DateTimeInterface $fetchedAt): static
    {
        $this->fetchedAt = $fetchedAt;

        return $this;
    }
}
