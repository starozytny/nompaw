<?php

namespace App\Entity\Drive;

use App\Entity\Main\User;
use App\Repository\Drive\DrAlbumRepository;
use Doctrine\ORM\Mapping as ORM;

/** Dossier du Drive, imbricable. Le supprimer fait remonter son contenu dans le parent (DriveController::deleteAlbum). */
#[ORM\Entity(repositoryClass: DrAlbumRepository::class)]
class DrAlbum
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $owner = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    /** Dossier parent ; null = à la racine. SET NULL n'est qu'un filet : la suppression applicative rattache d'abord au parent. */
    #[ORM\ManyToOne(targetEntity: self::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?DrAlbum $parent = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(User $owner): static
    {
        $this->owner = $owner;

        return $this;
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

    public function getParent(): ?DrAlbum
    {
        return $this->parent;
    }

    public function setParent(?DrAlbum $parent): static
    {
        $this->parent = $parent;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}
