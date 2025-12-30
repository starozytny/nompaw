<?php

namespace App\Entity\Video;

use App\Repository\Video\ViVideoRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ViVideoRepository::class)]
class ViVideo
{
    const LIST = ['video_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['video_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['video_list'])]
    private ?string $name = null;

    #[ORM\Column(length: 255)]
    #[Groups(['video_list'])]
    private ?string $filename = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['video_list'])]
    private ?float $fileSize = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['video_list'])]
    private ?string $fileExtension = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['video_list'])]
    private ?\DateTime $fileDuration = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['video_list'])]
    private ?int $fileYear = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['video_list'])]
    private ?string $fileType = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['video_list'])]
    private ?string $fileQuality = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['video_list'])]
    private ?float $notation = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['video_list'])]
    private ?string $subtitle = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['video_list'])]
    private ?string $illustration = null;

    #[ORM\Column]
    private ?DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new DateTimeImmutable();
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

    public function getFilename(): ?string
    {
        return $this->filename;
    }

    public function setFilename(string $filename): static
    {
        $this->filename = $filename;

        return $this;
    }

    public function getFileSize(): ?float
    {
        return $this->fileSize;
    }

    public function setFileSize(?float $fileSize): static
    {
        $this->fileSize = $fileSize;

        return $this;
    }

    public function getFileExtension(): ?string
    {
        return $this->fileExtension;
    }

    public function setFileExtension(?string $fileExtension): static
    {
        $this->fileExtension = $fileExtension;

        return $this;
    }

    public function getFileDuration(): ?\DateTime
    {
        return $this->fileDuration;
    }

    public function setFileDuration(?\DateTime $fileDuration): static
    {
        $this->fileDuration = $fileDuration;

        return $this;
    }

    public function getFileYear(): ?int
    {
        return $this->fileYear;
    }

    public function setFileYear(?int $fileYear): static
    {
        $this->fileYear = $fileYear;

        return $this;
    }

    public function getFileType(): ?string
    {
        return $this->fileType;
    }

    public function setFileType(?string $fileType): static
    {
        $this->fileType = $fileType;

        return $this;
    }

    public function getFileQuality(): ?string
    {
        return $this->fileQuality;
    }

    public function setFileQuality(?string $fileQuality): static
    {
        $this->fileQuality = $fileQuality;

        return $this;
    }

    public function getNotation(): ?float
    {
        return $this->notation;
    }

    public function setNotation(?float $notation): static
    {
        $this->notation = $notation;

        return $this;
    }

    public function getSubtitle(): ?string
    {
        return $this->subtitle;
    }

    public function setSubtitle(?string $subtitle): static
    {
        $this->subtitle = $subtitle;

        return $this;
    }

    public function getIllustration(): ?string
    {
        return $this->illustration;
    }

    public function setIllustration(?string $illustration): static
    {
        $this->illustration = $illustration;

        return $this;
    }

    public function getCreatedAt(): ?DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }
}
