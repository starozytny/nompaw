<?php

namespace App\Entity\Cook;

use App\Repository\Cook\CoIngredientRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CoIngredientRepository::class)]
class CoIngredient
{
    const FORM = ['ingre_form'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ingre_form'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ingre_form'])]
    private ?string $uid = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['ingre_form'])]
    private ?float $nombre = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['ingre_form'])]
    private ?string $unit = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ingre_form'])]
    private ?string $name = null;

    #[ORM\ManyToOne(inversedBy: 'ingredients')]
    #[ORM\JoinColumn(nullable: false)]
    private ?CoRecipe $recipe = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUid(): ?string
    {
        return $this->uid;
    }

    public function setUid(string $uid): self
    {
        $this->uid = $uid;

        return $this;
    }

    public function getNombre(): ?float
    {
        return $this->nombre;
    }

    public function setNombre(?float $nombre): self
    {
        $this->nombre = $nombre;

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

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getRecipe(): ?CoRecipe
    {
        return $this->recipe;
    }

    public function setRecipe(?CoRecipe $recipe): self
    {
        $this->recipe = $recipe;

        return $this;
    }

    #[Groups(['ingre_form'])]
    public function getContext(): string
    {
        return 'update';
    }
}
