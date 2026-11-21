<?php

namespace App\Entity\Drive;

use App\Entity\Main\User;
use App\Repository\Drive\DrFileRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: DrFileRepository::class)]
class DrFile
{
    /** Fichiers privés : documents/drive/{userId}/ */
    const FOLDER = "drive";

    const LIST = ["dr_file_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['dr_file_list'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $owner = null;

    #[ORM\Column(length: 255)]
    #[Groups(['dr_file_list'])]
    private ?string $name = null;

    #[ORM\Column(length: 255)]
    private ?string $file = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['dr_file_list'])]
    private ?string $mime = null;

    #[ORM\Column(type: 'bigint')]
    #[Groups(['dr_file_list'])]
    private int|string $size = 0;

    #[ORM\Column]
    #[Groups(['dr_file_list'])]
    private ?\DateTimeImmutable $createdAt = null;

    /** Dossier ; null = à la racine (« Mon Drive »). */
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?DrAlbum $album = null;

    /** Jeton du lien public de partage ; null = fichier non partagé. */
    #[ORM\Column(length: 64, unique: true, nullable: true)]
    private ?string $shareToken = null;

    /** Fin de validité du lien ; null = lien créé avant l'ajout des durées, valable jusqu'à l'arrêt du partage. */
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $shareExpiresAt = null;

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

    public function getFile(): ?string
    {
        return $this->file;
    }

    public function setFile(string $file): static
    {
        $this->file = $file;

        return $this;
    }

    public function getFolder(): string
    {
        return self::FOLDER . '/' . $this->owner->getId();
    }

    public function getMime(): ?string
    {
        return $this->mime;
    }

    public function setMime(?string $mime): static
    {
        $this->mime = $mime;

        return $this;
    }

    public function getSize(): int
    {
        return (int) $this->size;
    }

    public function setSize(int $size): static
    {
        $this->size = $size;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
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

    public function getShareToken(): ?string
    {
        return $this->shareToken;
    }

    public function setShareToken(?string $shareToken): static
    {
        $this->shareToken = $shareToken;

        return $this;
    }

    public function getShareExpiresAt(): ?\DateTimeImmutable
    {
        return $this->shareExpiresAt;
    }

    public function setShareExpiresAt(?\DateTimeImmutable $shareExpiresAt): static
    {
        $this->shareExpiresAt = $shareExpiresAt;

        return $this;
    }

    public function isShareActive(): bool
    {
        return $this->shareToken !== null && ($this->shareExpiresAt === null || $this->shareExpiresAt > new \DateTimeImmutable());
    }
}
