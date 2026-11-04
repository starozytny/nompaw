<?php

namespace App\Entity\Invest;

use App\Repository\Invest\InSnapshotRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: InSnapshotRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_in_snapshot_line_date', columns: ['line_id', 'date'])]
class InSnapshot
{
    const LIST = ['in_snapshot_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['in_snapshot_list'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: InLine::class, inversedBy: 'snapshots')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?InLine $line = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['in_snapshot_list'])]
    #[Assert\NotNull]
    private ?\DateTimeInterface $date = null;

    /**
     * Stored in cents to avoid float rounding drift; exposed as euros via getValue()/setValue().
     */
    #[ORM\Column]
    #[Groups(['in_snapshot_list'])]
    #[Assert\NotNull]
    private ?int $value = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLine(): ?InLine
    {
        return $this->line;
    }

    public function setLine(?InLine $line): self
    {
        $this->line = $line;
        return $this;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(?\DateTimeInterface $date): self
    {
        $this->date = $date;
        return $this;
    }

    public function getValue(): ?float
    {
        return $this->value !== null ? $this->value / 100 : null;
    }

    public function setValue(?float $value): self
    {
        $this->value = $value !== null ? (int) round($value * 100) : null;
        return $this;
    }
}
