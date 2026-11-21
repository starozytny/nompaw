<?php

namespace App\Entity\Drive;

use App\Entity\Main\User;
use App\Repository\Drive\DrAlbumMemberRepository;
use Doctrine\ORM\Mapping as ORM;

/** Membre d'un dossier partagé (accès au dossier et à ses sous-dossiers). Règles d'accès : App\Service\Drive\DriveAccess. */
#[ORM\Entity(repositoryClass: DrAlbumMemberRepository::class)]
#[ORM\UniqueConstraint(columns: ['album_id', 'user_id'])]
class DrAlbumMember
{
    const ROLE_VIEWER = 'viewer'; // voir, télécharger
    const ROLE_EDITOR = 'editor'; // + déposer des fichiers, gérer les siens
    const ROLES = [self::ROLE_VIEWER, self::ROLE_EDITOR];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?DrAlbum $album = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(length: 10)]
    private string $role = self::ROLE_VIEWER;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAlbum(): ?DrAlbum
    {
        return $this->album;
    }

    public function setAlbum(DrAlbum $album): static
    {
        $this->album = $album;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        $this->role = $role;

        return $this;
    }
}
