<?php

namespace App\Entity\Cook;

use App\Repository\Cook\CoRecipeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CoRecipeRepository::class)]
class CoRecipe
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column]
    private ?int $rate = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $content = null;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $durationPrepare = null;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $durationCooking = null;

    #[ORM\Column]
    private ?int $difficulty = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getRate(): ?int
    {
        return $this->rate;
    }

    public function setRate(int $rate): self
    {
        $this->rate = $rate;

        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): self
    {
        $this->content = $content;

        return $this;
    }

    public function getDurationPrepare(): ?\DateTimeInterface
    {
        return $this->durationPrepare;
    }

    public function setDurationPrepare(?\DateTimeInterface $durationPrepare): self
    {
        $this->durationPrepare = $durationPrepare;

        return $this;
    }

    public function getDurationCooking(): ?\DateTimeInterface
    {
        return $this->durationCooking;
    }

    public function setDurationCooking(?\DateTimeInterface $durationCooking): self
    {
        $this->durationCooking = $durationCooking;

        return $this;
    }

    public function getDifficulty(): ?int
    {
        return $this->difficulty;
    }

    public function setDifficulty(int $difficulty): self
    {
        $this->difficulty = $difficulty;

        return $this;
    }
}
