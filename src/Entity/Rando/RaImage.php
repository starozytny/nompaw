<?php

namespace App\Entity\Rando;

use App\Entity\DataEntity;
use App\Entity\Main\User;
use App\Repository\Rando\RaImageRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: RaImageRepository::class)]
class RaImage extends DataEntity
{
    const FOLDER = "images/editor/raimages";

    const LIST = ["ra_img_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ra_img_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ra_img_list'])]
    private ?string $file = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ra_img_list'])]
    private ?string $thumbs = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['ra_img_list'])]
    private ?string $lightbox = null;

    #[ORM\Column(nullable: true)]
    private ?int $mTime = null;

    #[ORM\Column]
    #[Groups(['ra_img_list'])]
    private ?int $type = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'raImages')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['ra_img_list'])]
    private ?User $author = null;

    #[ORM\ManyToOne(inversedBy: 'images')]
    #[ORM\JoinColumn(nullable: false)]
    private ?RaRando $rando = null;

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

    #[Groups(['ra_img_list'])]
    public function getFileFile()
    {
        return $this->getFileOrDefault($this->file, RaRando::FOLDER_IMAGES . '/' . $this->rando->getId());
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

    #[Groups(['ra_img_list'])]
    public function getThumbsFile()
    {
        return $this->getFileOrDefault($this->thumbs, RaRando::FOLDER_THUMBS . '/' . $this->rando->getId());
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

    #[Groups(['ra_img_list'])]
    public function getLightboxFile()
    {
        return $this->getFileOrDefault($this->lightbox, RaRando::FOLDER_LIGHTBOX . '/' . $this->rando->getId());
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

    public function getRando(): ?RaRando
    {
        return $this->rando;
    }

    public function setRando(?RaRando $rando): self
    {
        $this->rando = $rando;

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
}
