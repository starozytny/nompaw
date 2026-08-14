<?php

namespace App\Entity\Photo;

use App\Entity\DataEntity;
use App\Entity\Main\User;
use App\Repository\Photo\PhMediaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: PhMediaRepository::class)]
class PhMedia extends DataEntity
{
    const FOLDER = "photos/media/original";
    const FOLDER_THUMBS = "photos/media/thumbs";
    const FOLDER_LIGHTBOX = "photos/media/lightbox";

    const LIST = ["ph_media_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ph_media_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ph_media_list'])]
    private ?string $file = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ph_media_list'])]
    private ?string $thumbs = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['ph_media_list'])]
    private ?string $lightbox = null;

    #[ORM\Column(nullable: true)]
    private ?int $mTime = null;

    #[ORM\Column]
    #[Groups(['ph_media_list'])]
    private ?int $type = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'phMedia')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['ph_media_list'])]
    private ?User $author = null;

    #[ORM\ManyToOne(inversedBy: 'media')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['ph_media_list'])]
    private ?PhAlbum $album = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['ph_media_list'])]
    private ?\DateTime $takenAt = null;

    #[ORM\Column]
    #[Groups(['ph_media_list'])]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFile(): ?string
    {
        return $this->file;
    }

    public function setFile(string $file): self
    {
        $this->file = $file;

        return $this;
    }

    #[Groups(['ph_media_list'])]
    public function getFileFile()
    {
        return $this->getFileOrDefault($this->file, self::FOLDER);
    }

    public function getThumbs(): ?string
    {
        return $this->thumbs;
    }

    public function setThumbs(string $thumbs): self
    {
        $this->thumbs = $thumbs;

        return $this;
    }

    #[Groups(['ph_media_list'])]
    public function getThumbsFile()
    {
        return $this->getFileOrDefault($this->thumbs, self::FOLDER_THUMBS);
    }

    public function getLightbox(): ?string
    {
        return $this->lightbox;
    }

    public function setLightbox(string $lightbox): self
    {
        $this->lightbox = $lightbox;

        return $this;
    }

    #[Groups(['ph_media_list'])]
    public function getLightboxFile()
    {
        return $this->getFileOrDefault($this->lightbox, self::FOLDER_LIGHTBOX);
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

    public function getAlbum(): ?PhAlbum
    {
        return $this->album;
    }

    public function setAlbum(?PhAlbum $album): self
    {
        $this->album = $album;

        return $this;
    }

    public function getMTime(): ?int
    {
        return $this->mTime;
    }

    public function setMTime(?int $mTime): static
    {
        $this->mTime = $mTime;

        return $this;
    }

    public function getType(): ?int
    {
        return $this->type;
    }

    public function setType(?int $type): self
    {
        $this->type = $type;

        return $this;
    }

    public function getTakenAt(): ?\DateTime
    {
        return $this->takenAt;
    }

    public function setTakenAt(?\DateTime $takenAt): static
    {
        $this->takenAt = $takenAt;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }
}
