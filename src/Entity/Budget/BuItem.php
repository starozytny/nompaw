<?php

namespace App\Entity\Budget;

use App\Entity\DataEntity;
use App\Entity\Main\User;
use App\Repository\Budget\BuItemRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: BuItemRepository::class)]
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
    private ?int $year = null;

    #[ORM\Column]
    #[Groups(['buitem_list'])]
    private ?int $month = null;

    #[ORM\Column]
    #[Groups(['buitem_list'])]
    private ?int $type = null;

    #[ORM\Column]
    #[Groups(['buitem_list'])]
    private ?float $price = null;

    #[ORM\Column(length: 255)]
    #[Groups(['buitem_list'])]
    private ?string $name = null;

    #[ORM\Column]
    #[Groups(['buitem_list'])]
    private ?bool $isActive = false;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['buitem_list'])]
    private ?\DateTimeInterface $dateAt = null;

    #[ORM\Column]
    private ?bool $useSaving = false;

    #[ORM\ManyToOne(inversedBy: 'buItems')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\ManyToOne(inversedBy: 'buItems')]
    private ?BuCategory $category = null;

    public function __construct()
    {
        $this->createdAt = $this->initNewDateImmutable();
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

    public function getType(): ?int
    {
        return $this->type;
    }

    public function setType(int $type): static
    {
        $this->type = $type;

        return $this;
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

    public function isUseSaving(): ?bool
    {
        return $this->useSaving;
    }

    public function setUseSaving(bool $useSaving): static
    {
        $this->useSaving = $useSaving;

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
}
