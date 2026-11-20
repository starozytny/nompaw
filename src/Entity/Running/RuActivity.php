<?php

namespace App\Entity\Running;

use App\Repository\Running\RuActivityRepository;
use App\Entity\Main\User;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Raw history of imported Garmin activities — several rows can share a date (e.g. a double session).
 * Feeds the monthly volume chart and the personal-best lookups; distinct from RuLog, which holds the
 * single day-level entry (manual or attached) shown on the training plan.
 */
#[ORM\Entity(repositoryClass: RuActivityRepository::class)]
#[ORM\Index(columns: ['user_id', 'date'], name: 'idx_ru_activity_user_date')]
class RuActivity
{
    const LIST = ['ru_activity_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ru_activity_list'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['ru_activity_list'])]
    #[Assert\NotNull]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column]
    #[Groups(['ru_activity_list'])]
    #[Assert\NotNull]
    #[Assert\Positive]
    private ?float $km = null;

    #[ORM\Column]
    #[Groups(['ru_activity_list'])]
    #[Assert\NotNull]
    #[Assert\Positive]
    private ?int $durationSec = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['ru_activity_list'])]
    #[Assert\PositiveOrZero]
    private ?int $hr = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['ru_activity_list'])]
    #[Assert\PositiveOrZero]
    private ?int $hrMax = null;

    #[ORM\Column(length: 120, nullable: true)]
    #[Groups(['ru_activity_list'])]
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

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(?string $title): self
    {
        $this->title = $title;
        return $this;
    }
}
