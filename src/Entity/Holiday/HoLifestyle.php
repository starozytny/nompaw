<?php

namespace App\Entity\Holiday;

use App\Repository\Holiday\HoLifestyleRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: HoLifestyleRepository::class)]
class HoLifestyle
{
    const LIST = ['ho_life_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ho_life_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ho_life_list'])]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['ho_life_list'])]
    private ?string $unit = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['ho_life_list'])]
    private ?float $price = null;

    #[ORM\ManyToOne(inversedBy: 'lifestyles')]
    #[ORM\JoinColumn(nullable: false)]
    private ?HoProject $project = null;

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

    public function getUnit(): ?string
    {
        return $this->unit;
    }

    public function setUnit(?string $unit): self
    {
        $this->unit = $unit;

        return $this;
    }

    public function getPrice(): ?float
    {
        return $this->price;
    }

    public function setPrice(?float $price): self
    {
        $this->price = $price;

        return $this;
    }

    public function getProject(): ?HoProject
    {
        return $this->project;
    }

    public function setProject(?HoProject $project): self
    {
        $this->project = $project;

        return $this;
    }
}
