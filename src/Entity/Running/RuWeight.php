<?php

namespace App\Entity\Running;

use App\Repository\Running\RuWeightRepository;
use App\Entity\Main\User;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: RuWeightRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_ru_weight_user_date', columns: ['user_id', 'date'])]
class RuWeight
{
    const LIST = ['ru_weight_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ru_weight_list'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['ru_weight_list'])]
    #[Assert\NotNull]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column]
    #[Groups(['ru_weight_list'])]
    #[Assert\NotNull]
    #[Assert\Range(min: 40, max: 200)]
    private ?float $kg = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['ru_weight_list'])]
    #[Assert\Choice(choices: ['manuel', 'garmin'])]
    private ?string $source = null;

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

    public function getKg(): ?float
    {
        return $this->kg;
    }

    public function setKg(?float $kg): self
    {
        $this->kg = $kg;
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
}
