<?php

namespace App\Entity\Running;

use App\Repository\Running\RuLogRepository;
use App\Entity\Main\User;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: RuLogRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_ru_log_user_date', columns: ['user_id', 'date'])]
class RuLog
{
    const LIST = ['ru_log_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ru_log_list'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['ru_log_list'])]
    #[Assert\NotNull]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['ru_log_list'])]
    #[Assert\PositiveOrZero]
    private ?float $km = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['ru_log_list'])]
    #[Assert\PositiveOrZero]
    private ?int $durationSec = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['ru_log_list'])]
    #[Assert\PositiveOrZero]
    private ?int $hr = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['ru_log_list'])]
    #[Assert\PositiveOrZero]
    private ?int $hrMax = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['ru_log_list'])]
    #[Assert\Range(min: 1, max: 10)]
    private ?int $rpe = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['ru_log_list'])]
    private ?string $note = null;

    #[ORM\Column]
    #[Groups(['ru_log_list'])]
    private bool $done = false;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['ru_log_list'])]
    #[Assert\Choice(choices: ['manuel', 'garmin'])]
    private ?string $source = null;

    #[ORM\Column(length: 120, nullable: true)]
    #[Groups(['ru_log_list'])]
    private ?string $title = null;

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

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(?\DateTimeInterface $date): self
    {
        $this->date = $date;
        return $this;
    }

    public function getKm(): ?float
    {
        return $this->km;
    }

    public function setKm(?float $km): self
    {
        $this->km = $km;
        return $this;
    }

    public function getDurationSec(): ?int
    {
        return $this->durationSec;
    }

    public function setDurationSec(?int $durationSec): self
    {
        $this->durationSec = $durationSec;
        return $this;
    }

    public function getHr(): ?int
    {
        return $this->hr;
    }

    public function setHr(?int $hr): self
    {
        $this->hr = $hr;
        return $this;
    }

    public function getHrMax(): ?int
    {
        return $this->hrMax;
    }

    public function setHrMax(?int $hrMax): self
    {
        $this->hrMax = $hrMax;
        return $this;
    }

    public function getRpe(): ?int
    {
        return $this->rpe;
    }

    public function setRpe(?int $rpe): self
    {
        $this->rpe = $rpe;
        return $this;
    }

    public function getNote(): ?string
    {
        return $this->note;
    }

    public function setNote(?string $note): self
    {
        $this->note = $note;
        return $this;
    }

    public function isDone(): bool
    {
        return $this->done;
    }

    public function setDone(bool $done): self
    {
        $this->done = $done;
        return $this;
    }

    public function getSource(): ?string
    {
        return $this->source;
    }

    public function setSource(?string $source): self
    {
        $this->source = $source;
        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(?string $title): self
    {
        $this->title = $title;
        return $this;
    }

    /**
     * An entry with no actual data left is dropped, mirroring the original logSet() which deleted
     * LOG[iso] once done/km/dur/rpe/note were all empty.
     */
    public function isEmpty(): bool
    {
        return !$this->done && $this->km === null && $this->durationSec === null && $this->rpe === null && !$this->note;
    }
}
