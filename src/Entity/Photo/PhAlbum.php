<?php

namespace App\Entity\Photo;

use App\Entity\Main\User;
use App\Repository\Photo\PhAlbumRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PhAlbumRepository::class)]
class PhAlbum
{
    const LIST = ["ph_album_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ph_album_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: "Le nom de l'album est obligatoire.")]
    #[Groups(['ph_album_list'])]
    private ?string $name = null;

    #[ORM\Column(length: 1000, nullable: true)]
    #[Groups(['ph_album_list'])]
    private ?string $description = null;

    #[ORM\ManyToOne(fetch: 'EAGER')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['ph_album_list'])]
    private ?User $author = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['ph_album_list'])]
    private ?PhMedia $cover = null;

    #[ORM\Column]
    #[Groups(['ph_album_list'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'album', targetEntity: PhMedia::class)]
    private Collection $media;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->media = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;

        return $this;
    }

    public function getCover(): ?PhMedia
    {
        return $this->cover;
    }

    public function setCover(?PhMedia $cover): static
    {
        $this->cover = $cover;

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

    /**
     * @return Collection<int, PhMedia>
     */
    public function getMedia(): Collection
    {
        return $this->media;
    }

    #[Groups(['ph_album_list'])]
    public function getMediaCount(): int
    {
        return $this->media->count();
    }

    #[Groups(['ph_album_list'])]
    public function getCoverFile(): ?string
    {
        if ($this->cover) {
            return $this->cover->getThumbsFile();
        }

        $last = $this->media->last();

        return $last ? $last->getThumbsFile() : null;
    }

    public function addMedium(PhMedia $medium): static
    {
        if (!$this->media->contains($medium)) {
            $this->media->add($medium);
            $medium->setAlbum($this);
        }

        return $this;
    }

    public function removeMedium(PhMedia $medium): static
    {
        if ($this->media->removeElement($medium)) {
            if ($medium->getAlbum() === $this) {
                $medium->setAlbum(null);
            }
        }

        return $this;
    }
}
