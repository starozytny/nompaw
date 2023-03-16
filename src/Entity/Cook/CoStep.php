<?php

namespace App\Entity\Cook;

use App\Repository\Cook\CoStepRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CoStepRepository::class)]
class CoStep
{
    const FORM = ['step_form'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['step_form'])]
    private ?int $id = null;

    #[ORM\Column]
    #[Groups(['step_form'])]
    private ?int $position = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['step_form'])]
    private ?string $content = null;

    #[ORM\ManyToOne(inversedBy: 'steps')]
    #[ORM\JoinColumn(nullable: false)]
    private ?CoRecipe $recipe = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPosition(): ?int
    {
        return $this->position;
    }

    public function setPosition(int $position): self
    {
        $this->position = $position;

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

    public function getRecipe(): ?CoRecipe
    {
        return $this->recipe;
    }

    public function setRecipe(?CoRecipe $recipe): self
    {
        $this->recipe = $recipe;

        return $this;
    }
}
