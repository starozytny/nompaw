<?php

namespace App\Entity\Budget;

use App\Entity\DataEntity;
use App\Entity\Main\User;
use App\Repository\Budget\BuRecurrentRepository;
use DateTimeImmutable;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: BuRecurrentRepository::class)]
class BuRecurrent extends DataEntity
{
    const LIST = ['burecu_list'];
    const FORM = ['burecu_form'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['burecu_list', 'burecu_form'])]
    private ?int $id = null;

    #[ORM\Column]
    #[Groups(['burecu_list', 'burecu_form'])]
    private ?int $type = null;

    #[ORM\Column]
    #[Groups(['burecu_list', 'burecu_form'])]
    private ?float $price = null;

    #[ORM\Column(length: 255)]
    #[Groups(['burecu_list', 'burecu_form'])]
    private ?string $name = null;

    #[ORM\Column]
    #[Groups(['burecu_list', 'burecu_form'])]
    private array $months = [];

    #[ORM\Column]
    #[Groups(['burecu_list', 'burecu_form'])]
    private ?int $initYear = null;

    #[ORM\Column]
    #[Groups(['burecu_list', 'burecu_form'])]
    private ?int $initMonth = null;

    #[ORM\ManyToOne(inversedBy: 'recurrents')]
    #[Groups(['burecu_list', 'burecu_form'])]
    private ?BuCategory $category = null;

    #[ORM\ManyToOne(inversedBy: 'buRecurrents')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    #[Groups(['burecu_list'])]
    public function getTypeIcon(): ?string
    {
        $values = ['minus', 'add', 'time'];

        return $values[$this->type];
    }

    #[Groups(['burecu_list'])]
    public function getTypeString(): ?string
    {
        $values = ['Dépense', 'Revenu', 'Economie'];

        return $values[$this->type];
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

    public function getMonths(): array
    {
        return $this->months;
    }

    public function setMonths(array $months): static
    {
        $this->months = $months;

        return $this;
    }

    public function getInitYear(): ?int
    {
        return $this->initYear;
    }

    public function setInitYear(int $initYear): static
    {
        $this->initYear = $initYear;

        return $this;
    }

    public function getInitMonth(): ?int
    {
        return $this->initMonth;
    }

    public function setInitMonth(int $initMonth): static
    {
        $this->initMonth = $initMonth;

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

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
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
}
