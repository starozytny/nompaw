<?php

namespace App\Entity\Budget;

use App\Entity\DataEntity;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\User;
use App\Repository\Budget\BuItemRepository;
use DateTimeImmutable;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: BuItemRepository::class)]
#[ORM\Index(columns: ['user_id', 'year'], name: 'idx_bu_item_user_year')]
#[ORM\Index(columns: ['user_id', 'type'], name: 'idx_bu_item_user_type')]
class BuItem extends DataEntity
{
    const LIST = ['buitem_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['buitem_list'])]
    private ?int $id = null;

    #[ORM\Column]
    #[Groups(['buitem_list'])]
    #[Assert\NotNull]
    private ?int $year = null;

    #[ORM\Column]
    #[Groups(['buitem_list'])]
    #[Assert\NotNull]
    #[Assert\Range(min: 1, max: 12)]
    private ?int $month = null;

    #[ORM\Column(enumType: TypeType::class)]
    #[Groups(['buitem_list'])]
    #[Assert\NotNull]
    private ?TypeType $type = null;

    #[ORM\Column]
    #[Groups(['buitem_list'])]
    #[Assert\NotNull]
    private ?float $price = null;

    #[ORM\Column(length: 255)]
    #[Groups(['buitem_list'])]
    #[Assert\NotBlank]
    private ?string $name = null;

    #[ORM\Column]
    #[Groups(['buitem_list'])]
    private ?bool $isActive = false;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['buitem_list'])]
    #[Assert\NotNull]
    private ?\DateTimeInterface $dateAt = null;

    #[ORM\ManyToOne(inversedBy: 'buItems')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\ManyToOne(inversedBy: 'buItems')]
    #[Groups(['buitem_list'])]
    private ?BuCategory $category = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['buitem_list'])]
    private ?int $recurrenceId = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['buitem_list'])]
    private ?float $recurrencePrice = null;

    #[ORM\Column(enumType: TypeType::class)]
    private ?TypeType $lastType = null;

    public function __construct()
    {
        $this->createdAt = new DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getYear(): ?int
    {
        return $this->year;
    }

    public function setYear(int $year): static
    {
        $this->year = $year;

        return $this;
    }

    public function getMonth(): ?int
    {
        return $this->month;
    }

    public function setMonth(int $month): static
    {
        $this->month = $month;

        return $this;
    }

    public function getType(): ?TypeType
    {
        return $this->type;
    }

    public function setType(?TypeType $type): static
    {
        $this->type = $type;

        return $this;
    }

    #[Groups(['buitem_list'])]
    public function getTypeIcon(): ?string
    {
        return match ($this->type) {
            TypeType::Expense => 'minus',
            TypeType::Income => 'add',
            TypeType::Saving => 'time',
            TypeType::Deleted => 'close',
            TypeType::Used => 'arrow-swap-horizontal',
            default => null,
        };
    }

    public function getPrice(): ?float
    {
        return $this->price;
    }

    public function setPrice(float $price): static
    {
        $this->price = $price;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function isIsActive(): ?bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function getDateAt(): ?\DateTimeInterface
    {
        return $this->dateAt;
    }

    public function setDateAt(\DateTimeInterface $dateAt): static
    {
        $this->dateAt = $dateAt;

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

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getCategory(): ?BuCategory
    {
        return $this->category;
    }

    public function setCategory(?BuCategory $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getRecurrenceId(): ?int
    {
        return $this->recurrenceId;
    }

    public function setRecurrenceId(?int $recurrenceId): static
    {
        $this->recurrenceId = $recurrenceId;

        return $this;
    }

    public function getRecurrencePrice(): ?float
    {
        return $this->recurrencePrice;
    }

    public function setRecurrencePrice(?float $recurrencePrice): static
    {
        $this->recurrencePrice = $recurrencePrice;

        return $this;
    }

    public function getLastType(): ?TypeType
    {
        return $this->lastType;
    }

    public function setLastType(?TypeType $lastType): static
    {
        $this->lastType = $lastType;

        return $this;
    }
}
