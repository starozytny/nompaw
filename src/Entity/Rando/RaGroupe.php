<?php

namespace App\Entity\Rando;

use App\Entity\DataEntity;
use App\Entity\Main\User;
use App\Repository\Rando\RaGroupeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: RaGroupeRepository::class)]
class RaGroupe extends DataEntity
{
    const FOLDER = "images/editor/groupes";
    const FOLDER_ILLU = 'groupes';

    const FORM = ['ragrp_form'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ragrp_form'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ragrp_form'])]
    private ?string $name = null;

    #[ORM\Column]
    #[Groups(['ragrp_form'])]
    private ?bool $isVisible = null;

    #[ORM\Column]
    #[Groups(['ragrp_form'])]
    private ?int $level = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['ragrp_form'])]
    private ?string $description = null;

    #[ORM\OneToMany(mappedBy: 'groupe', targetEntity: RaLink::class)]
    private Collection $links;

    #[ORM\ManyToOne(inversedBy: 'roGroupes')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $author = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ragrp_form'])]
    private ?string $slug = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['ragrp_form'])]
    private ?string $image = null;

    public function __construct()
    {
        $this->links = new ArrayCollection();
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

    public function isIsVisible(): ?bool
    {
        return $this->isVisible;
    }

    public function setIsVisible(bool $isVisible): self
    {
        $this->isVisible = $isVisible;

        return $this;
    }

    public function getLevel(): ?int
    {
        return $this->level;
    }

    public function setLevel(int $level): self
    {
        $this->level = $level;

        return $this;
    }

    public function getLevelString(): string
    {
        $values = ['Aucun', 'Facile', 'Moyen', 'Difficile', 'Très difficile', 'Extrême'];
        return $values[$this->level];
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    /**
     * @return Collection<int, RaLink>
     */
    public function getLinks(): Collection
    {
        return $this->links;
    }

    public function addLink(RaLink $link): self
    {
        if (!$this->links->contains($link)) {
            $this->links->add($link);
            $link->setGroupe($this);
        }

        return $this;
    }

    public function removeLink(RaLink $link): self
    {
        if ($this->links->removeElement($link)) {
            // set the owning side to null (unless already changed)
            if ($link->getGroupe() === $this) {
                $link->setGroupe(null);
            }
        }

        return $this;
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

    public function getSlug(): ?string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): self
    {
        $this->slug = $slug;

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

    #[Groups(['ragrp_form'])]
    public function getImageFile()
    {
        return $this->getFileOrDefault($this->getImage(), self::FOLDER_ILLU);
    }
}
