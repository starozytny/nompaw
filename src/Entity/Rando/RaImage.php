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
    private ?string $file = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ra_img_list'])]
    private ?string $thumbs = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'raImages')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['ra_img_list'])]
    private ?User $author = null;

    #[ORM\ManyToOne(inversedBy: 'images')]
    #[ORM\JoinColumn(nullable: false)]
    private ?RaRando $rando = null;

    #[ORM\Column(nullable: true)]
    private ?int $mTime = null;

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
        return $this->getFileOrDefault($this->file, RaRando::FOLDER_IMAGES);
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
        return $this->getFileOrDefault($this->thumbs, RaRando::FOLDER_THUMBS);
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
}
