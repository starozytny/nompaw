<?php

namespace App\Entity\Cook;

use App\Entity\DataEntity;
use App\Entity\Main\User;
use App\Repository\Cook\CoRecipeRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CoRecipeRepository::class)]
class CoRecipe extends DataEntity
{
    const FOLDER = "images/editor/recipes";
    const FOLDER_ILLU = 'images/entity/recipes';

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

    #[ORM\Column]
    #[Groups(['recipe_form', 'recipe_read'])]
    private ?int $status = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['recipe_list', 'recipe_read'])]
    private ?string $content = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['recipe_read'])]
    private ?\DateTimeInterface $durationPrepare = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['recipe_read'])]
    private ?\DateTimeInterface $durationCooking = null;

    #[ORM\Column]
    #[Groups(['recipe_read'])]
    private ?int $difficulty = 0;

    #[ORM\Column(nullable: true)]
    #[Groups(['recipe_read'])]
    private ?int $nbPerson = null;

    #[ORM\Column(length: 255)]
    #[Groups(['recipe_list', 'recipe_read'])]
    private ?string $slug = null;

    #[ORM\OneToMany(mappedBy: 'recipe', targetEntity: CoStep::class)]
    private Collection $steps;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $image = null;

    #[ORM\ManyToOne(inversedBy: 'coRecipes')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $author = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\OneToMany(mappedBy: 'recipe', targetEntity: CoIngredient::class)]
    private Collection $ingredients;

    #[ORM\OneToMany(mappedBy: 'recipe', targetEntity: CoCommentary::class)]
    private Collection $commentaries;

    public function __construct()
    {
        $this->createdAt = new DateTimeImmutable();
        $this->steps = new ArrayCollection();
        $this->ingredients = new ArrayCollection();
        $this->commentaries = new ArrayCollection();
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

    #[Groups(['recipe_read', 'recipe_form'])]
    public function getImageFile()
    {
        return $this->getFileOrDefault($this->getImage(), self::FOLDER_ILLU);
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): self
    {
        $this->author = $author;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeInterface $updatedAt): self
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getStatus(): ?int
    {
        return $this->status;
    }

    public function setStatus(int $status): self
    {
        $this->status = $status;

        return $this;
    }

    /**
     * @return Collection<int, CoIngredient>
     */
    public function getIngredients(): Collection
    {
        return $this->ingredients;
    }

    public function addIngredient(CoIngredient $ingredient): self
    {
        if (!$this->ingredients->contains($ingredient)) {
            $this->ingredients->add($ingredient);
            $ingredient->setRecipe($this);
        }

        return $this;
    }

    public function removeIngredient(CoIngredient $ingredient): self
    {
        if ($this->ingredients->removeElement($ingredient)) {
            // set the owning side to null (unless already changed)
            if ($ingredient->getRecipe() === $this) {
                $ingredient->setRecipe(null);
            }
        }

        return $this;
    }

    public function getNbPerson(): ?int
    {
        return $this->nbPerson;
    }

    public function setNbPerson(?int $nbPerson): self
    {
        $this->nbPerson = $nbPerson;

        return $this;
    }

    /**
     * @return Collection<int, CoCommentary>
     */
    public function getCommentaries(): Collection
    {
        return $this->commentaries;
    }

    public function addCommentary(CoCommentary $commentary): self
    {
        if (!$this->commentaries->contains($commentary)) {
            $this->commentaries->add($commentary);
            $commentary->setRecipe($this);
        }

        return $this;
    }

    public function removeCommentary(CoCommentary $commentary): self
    {
        if ($this->commentaries->removeElement($commentary)) {
            // set the owning side to null (unless already changed)
            if ($commentary->getRecipe() === $this) {
                $commentary->setRecipe(null);
            }
        }

        return $this;
    }
}
