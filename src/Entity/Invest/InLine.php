<?php

namespace App\Entity\Invest;

use App\Repository\Invest\InLineRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: InLineRepository::class)]
class InLine
{
    const LIST = ['in_line_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['in_line_list'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: InEnveloppe::class, inversedBy: 'lines')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?InEnveloppe $enveloppe = null;

    #[ORM\Column(length: 255)]
    #[Groups(['in_line_list'])]
    #[Assert\NotBlank]
    private ?string $name = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['in_line_list'])]
    private ?string $isin = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['in_line_list'])]
    #[Assert\Range(min: 0, max: 100)]
    private ?float $targetAllocationPct = null;

    #[ORM\Column]
    #[Groups(['in_line_list'])]
    private int $position = 0;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['in_line_list'])]
    private ?string $notes = null;

    #[ORM\OneToMany(mappedBy: 'line', targetEntity: InSnapshot::class, orphanRemoval: true)]
    #[ORM\OrderBy(['date' => 'ASC'])]
    private Collection $snapshots;

    public function __construct()
    {
        $this->snapshots = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEnveloppe(): ?InEnveloppe
    {
        return $this->enveloppe;
    }

    public function setEnveloppe(?InEnveloppe $enveloppe): self
    {
        $this->enveloppe = $enveloppe;
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

    public function getIsin(): ?string
    {
        return $this->isin;
    }

    public function setIsin(?string $isin): self
    {
        $this->isin = $isin;
        return $this;
    }

    public function getTargetAllocationPct(): ?float
    {
        return $this->targetAllocationPct;
    }

    public function setTargetAllocationPct(?float $targetAllocationPct): self
    {
        $this->targetAllocationPct = $targetAllocationPct;
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

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): self
    {
        $this->notes = $notes;
        return $this;
    }

    /**
     * @return Collection<int, InSnapshot>
     */
    public function getSnapshots(): Collection
    {
        return $this->snapshots;
    }

    public function addSnapshot(InSnapshot $snapshot): self
    {
        if (!$this->snapshots->contains($snapshot)) {
            $this->snapshots->add($snapshot);
            $snapshot->setLine($this);
        }

        return $this;
    }
}
