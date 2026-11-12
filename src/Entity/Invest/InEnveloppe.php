<?php

namespace App\Entity\Invest;

use App\Entity\Enum\Invest\EnveloppeType;
use App\Entity\Main\User;
use App\Repository\Invest\InEnveloppeRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: InEnveloppeRepository::class)]
class InEnveloppe
{
    const LIST = ['in_enveloppe_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['in_enveloppe_list'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(length: 255)]
    #[Groups(['in_enveloppe_list'])]
    #[Assert\NotBlank]
    private ?string $name = null;

    #[ORM\Column(enumType: EnveloppeType::class)]
    #[Groups(['in_enveloppe_list'])]
    #[Assert\NotNull]
    private ?EnveloppeType $type = null;

    /**
     * Plain reference to a Budget BuCategory id, not a Doctrine association — same convention as
     * BuItem::linkedItemId. Lets this envelope reuse Budget's recurring/actual contribution data
     * (BuRecurrent/BuItem) instead of duplicating versement tracking here.
     */
    #[ORM\Column(nullable: true)]
    #[Groups(['in_enveloppe_list'])]
    private ?int $buCategoryId = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['in_enveloppe_list'])]
    private ?\DateTimeInterface $taxExemptDate = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['in_enveloppe_list'])]
    private ?string $notes = null;

    #[ORM\Column]
    #[Groups(['in_enveloppe_list'])]
    private int $position = 0;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'enveloppe', targetEntity: InLine::class, orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $lines;

    public function __construct()
    {
        $this->createdAt = new DateTimeImmutable();
        $this->lines = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;
        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getType(): ?EnveloppeType
    {
        return $this->type;
    }

    public function setType(?EnveloppeType $type): self
    {
        $this->type = $type;
        return $this;
    }

    #[Groups(['in_enveloppe_list'])]
    public function getTypeString(): ?string
    {
        return match ($this->type) {
            EnveloppeType::Pea => 'PEA',
            EnveloppeType::Cto => 'CTO',
            EnveloppeType::Av => 'Assurance vie',
            EnveloppeType::Livret => 'Livret',
            EnveloppeType::Autre => 'Autre',
            default => null,
        };
    }

    public function getBuCategoryId(): ?int
    {
        return $this->buCategoryId;
    }

    public function setBuCategoryId(?int $buCategoryId): self
    {
        $this->buCategoryId = $buCategoryId;
        return $this;
    }

    public function getTaxExemptDate(): ?\DateTimeInterface
    {
        return $this->taxExemptDate;
    }

    public function setTaxExemptDate(?\DateTimeInterface $taxExemptDate): self
    {
        $this->taxExemptDate = $taxExemptDate;
        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): self
    {
        $this->notes = $notes;
        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): self
    {
        $this->position = $position;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * @return Collection<int, InLine>
     */
    public function getLines(): Collection
    {
        return $this->lines;
    }

    public function addLine(InLine $line): self
    {
        if (!$this->lines->contains($line)) {
            $this->lines->add($line);
            $line->setEnveloppe($this);
        }

        return $this;
    }
}
