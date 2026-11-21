<?php

namespace App\Entity\Drive;

use App\Entity\Main\User;
use App\Repository\Drive\DrShortcutRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Raccourci : fait apparaître un fichier dans un autre dossier sans le dupliquer (aucun impact sur le quota).
 * Supprimer le fichier supprime ses raccourcis (CASCADE) ; supprimer un raccourci ne touche pas au fichier.
 */
#[ORM\Entity(repositoryClass: DrShortcutRepository::class)]
class DrShortcut
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $owner = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?DrFile $file = null;

    /** Dossier où apparaît le raccourci ; null = « Mon Drive ». */
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?DrAlbum $album = null;

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

    public function getFile(): ?DrFile
    {
        return $this->file;
    }

    public function setFile(DrFile $file): static
    {
        $this->file = $file;

        return $this;
    }

    public function getAlbum(): ?DrAlbum
    {
        return $this->album;
    }

    public function setAlbum(?DrAlbum $album): static
    {
        $this->album = $album;

        return $this;
    }
}
