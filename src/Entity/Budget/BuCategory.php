<?php

namespace App\Entity\Budget;

use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BuCategoryRepository::class)]
class BuCategory
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?int $type = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $icon = null;

    #[ORM\Column(nullable: true)]
    private ?float $goal = null;

    #[ORM\Column(nullable: true)]
    private ?float $used = null;

    #[ORM\ManyToOne(inversedBy: 'buCategories')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\OneToMany(mappedBy: 'category', targetEntity: BuItem::class)]
    private Collection $buItems;

    #[ORM\OneToMany(mappedBy: 'category', targetEntity: BuRecurrent::class)]
    private Collection $recurrents;

    public function __construct()
    {
        $this->buItems = new ArrayCollection();
        $this->recurrents = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getType(): ?int
    {
        return $this->type;
    }

    public function setType(int $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getGoal(): ?float
    {
        return $this->goal;
    }

    public function setGoal(?float $goal): static
    {
        $this->goal = $goal;

        return $this;
    }

    public function getIcon(): ?string
    {
        return $this->icon;
    }

    public function setIcon(?string $icon): static
    {
        $this->icon = $icon;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getUsed(): ?float
    {
        return $this->used;
    }

    public function setUsed(?float $used): static
    {
        $this->used = $used;

        return $this;
    }

    /**
     * @return Collection<int, BuItem>
     */
    public function getBuItems(): Collection
    {
        return $this->buItems;
    }

    public function addBuItem(BuItem $buItem): static
    {
        if (!$this->buItems->contains($buItem)) {
            $this->buItems->add($buItem);
            $buItem->setCategory($this);
        }

        return $this;
    }

    public function removeBuItem(BuItem $buItem): static
    {
        if ($this->buItems->removeElement($buItem)) {
            // set the owning side to null (unless already changed)
            if ($buItem->getCategory() === $this) {
                $buItem->setCategory(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, BuRecurrent>
     */
    public function getRecurrents(): Collection
    {
        return $this->recurrents;
    }

    public function addRecurrent(BuRecurrent $recurrent): static
    {
        if (!$this->recurrents->contains($recurrent)) {
            $this->recurrents->add($recurrent);
            $recurrent->setCategory($this);
        }

        return $this;
    }

    public function removeRecurrent(BuRecurrent $recurrent): static
    {
        if ($this->recurrents->removeElement($recurrent)) {
            // set the owning side to null (unless already changed)
            if ($recurrent->getCategory() === $this) {
                $recurrent->setCategory(null);
            }
        }

        return $this;
    }
}
