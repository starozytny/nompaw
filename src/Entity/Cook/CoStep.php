<?php

namespace App\Entity\Cook;

use App\Entity\DataEntity;
use App\Repository\Cook\CoStepRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CoStepRepository::class)]
class CoStep extends DataEntity
{
    const FOLDER = 'images/entity/steps';
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

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $image0 = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $image1 = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $image2 = null;

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

    public function getImage0(): ?string
    {
        return $this->image0;
    }

    public function setImage0(?string $image0): self
    {
        $this->image0 = $image0;

        return $this;
    }

    #[Groups(['step_form'])]
    public function getImage0File()
    {
        return $this->getFileOrDefault($this->getImage0(), self::FOLDER . '/' . $this->recipe->getSlug(), null);
    }

    public function getImage1(): ?string
    {
        return $this->image1;
    }

    public function setImage1(?string $image1): self
    {
        $this->image1 = $image1;

        return $this;
    }

    #[Groups(['step_form'])]
    public function getImage1File()
    {
        return $this->getFileOrDefault($this->getImage1(), self::FOLDER . '/' . $this->recipe->getSlug(), null);
    }

    public function getImage2(): ?string
    {
        return $this->image2;
    }

    public function setImage2(?string $image2): self
    {
        $this->image2 = $image2;

        return $this;
    }

    #[Groups(['step_form'])]
    public function getImage2File()
    {
        return $this->getFileOrDefault($this->getImage2(), self::FOLDER . '/' . $this->recipe->getSlug(), null);
    }
}
