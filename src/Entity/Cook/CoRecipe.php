<?php

namespace App\Entity\Cook;

use App\Entity\DataEntity;
use App\Repository\Cook\CoRecipeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CoRecipeRepository::class)]
class CoRecipe extends DataEntity
{
    const FOLDER = 'recipes';

    const LIST = ['recipe_list'];
    const FORM = ['recipe_form'];
    const READ = ['recipe_read'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['recipe_list', 'recipe_form', 'recipe_read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['recipe_list', 'recipe_form', 'recipe_read'])]
    private ?string $name = null;

    #[ORM\Column(length: 255)]
    #[Groups(['recipe_list', 'recipe_read'])]
    private ?string $slug = null;

    #[ORM\Column]
    #[Groups(['recipe_read'])]
    private ?int $rate = 0;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['recipe_list', 'recipe_form', 'recipe_read'])]
    private ?string $content = null;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    #[Groups(['recipe_form', 'recipe_read'])]
    private ?\DateTimeInterface $durationPrepare = null;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    #[Groups(['recipe_form', 'recipe_read'])]
    private ?\DateTimeInterface $durationCooking = null;

    #[ORM\Column]
    #[Groups(['recipe_form', 'recipe_read'])]
    private ?int $difficulty = null;

    #[ORM\OneToMany(mappedBy: 'recipe', targetEntity: CoStep::class)]
    private Collection $steps;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $image = null;

    public function __construct()
    {
        $this->steps = new ArrayCollection();
    }

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

    public function getSlug(): ?string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): self
    {
        $this->slug = $slug;

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

    public function setContent(?string $content): self
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

    #[Groups(['recipe_read'])]
    public function getDifficultyString(): string
    {
        $values = ['Facile', 'Moyen', 'Difficile'];
        return $values[$this->difficulty];
    }

    /**
     * @return Collection<int, CoStep>
     */
    public function getSteps(): Collection
    {
        return $this->steps;
    }

    public function addStep(CoStep $step): self
    {
        if (!$this->steps->contains($step)) {
            $this->steps->add($step);
            $step->setRecipe($this);
        }

        return $this;
    }

    public function removeStep(CoStep $step): self
    {
        if ($this->steps->removeElement($step)) {
            // set the owning side to null (unless already changed)
            if ($step->getRecipe() === $this) {
                $step->setRecipe(null);
            }
        }

        return $this;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): self
    {
        $this->image = $image;

        return $this;
    }

    #[Groups(['recipe_form'])]
    public function getImageFile()
    {
        return $this->getFileOrDefault($this->getImage(), self::FOLDER);
    }
}
