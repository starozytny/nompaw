<?php

namespace App\Entity\Rando;

use App\Entity\DataEntity;
use App\Entity\Enum\Rando\StatusType;
use App\Entity\Main\User;
use App\Repository\Rando\RaRandoRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: RaRandoRepository::class)]
class RaRando extends DataEntity
{
    const FOLDER = "images/editor/randos";
    const FOLDER_IMAGES = "images/entity/randos/images";
    const FOLDER_THUMBS = "images/entity/randos/thumbs";

    const FORM = ['rando_form'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['rando_form'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['rando_form'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $startAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $endAt = null;

    #[ORM\Column]
    #[Groups(['rando_form'])]
    private ?int $status = StatusType::Propal;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['rando_form'])]
    private ?string $description = null;

    #[ORM\Column]
    private ?bool $isNext = false;

    #[ORM\Column(length: 255)]
    #[Groups(['rando_form'])]
    private ?string $slug = null;

    #[ORM\ManyToOne(inversedBy: 'randos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?RaGroupe $groupe = null;

    #[ORM\ManyToOne(inversedBy: 'raRandos')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['rando_form'])]
    private ?User $author = null;

    #[ORM\OneToMany(mappedBy: 'rando', targetEntity: RaPropalDate::class)]
    private Collection $propalDates;

    #[ORM\OneToMany(mappedBy: 'rando', targetEntity: RaPropalAdventure::class)]
    private Collection $propalAdventures;

    #[ORM\OneToOne(cascade: ['persist'], fetch: 'EAGER')]
    #[Groups(['rando_form'])]
    private ?RaPropalAdventure $adventure = null;

    #[ORM\OneToOne(cascade: ['persist'], fetch: 'EAGER')]
    #[Groups(['rando_form'])]
    private ?RaPropalDate $adventureDate = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['rando_form'])]
    private ?int $level = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['rando_form'])]
    private ?int $altitude = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['rando_form'])]
    private ?int $devPlus = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['rando_form'])]
    private ?float $distance = null;

    #[ORM\OneToMany(mappedBy: 'rando', targetEntity: RaImage::class)]
    private Collection $images;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $cover = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['rando_form'])]
    private ?string $googlePhotos = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['rando_form'])]
    private ?string $story = null;

    public function __construct()
    {
        $this->propalDates = new ArrayCollection();
        $this->propalAdventures = new ArrayCollection();
        $this->images = new ArrayCollection();
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

    public function getStartAt(): ?\DateTimeInterface
    {
        return $this->startAt;
    }

    public function setStartAt(?\DateTimeInterface $startAt): self
    {
        $this->startAt = $startAt;

        return $this;
    }

    public function getEndAt(): ?\DateTimeInterface
    {
        return $this->endAt;
    }

    public function setEndAt(?\DateTimeInterface $endAt): self
    {
        $this->endAt = $endAt;

        return $this;
    }

    public function getStatus(): ?int
    {
        return $this->status;
    }

    public function setStatus(int $status): self
    {
        $this->status = $status;

        return $this;
    }

    public function getStatusString(): string
    {
        return match($this->status){
            StatusType::Propal => 'en proposition',
            StatusType::Validate => 'validée',
            StatusType::End => 'terminée',
            default => 'erreur',
        };
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

    public function isIsNext(): ?bool
    {
        return $this->isNext;
    }

    public function setIsNext(bool $isNext): self
    {
        $this->isNext = $isNext;

        return $this;
    }

    public function getGroupe(): ?RaGroupe
    {
        return $this->groupe;
    }

    public function setGroupe(?RaGroupe $groupe): self
    {
        $this->groupe = $groupe;

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

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): self
    {
        $this->author = $author;

        return $this;
    }

    /**
     * @return Collection<int, RaPropalDate>
     */
    public function getPropalDates(): Collection
    {
        return $this->propalDates;
    }

    public function addPropalDate(RaPropalDate $propalDate): self
    {
        if (!$this->propalDates->contains($propalDate)) {
            $this->propalDates->add($propalDate);
            $propalDate->setRando($this);
        }

        return $this;
    }

    public function removePropalDate(RaPropalDate $propalDate): self
    {
        if ($this->propalDates->removeElement($propalDate)) {
            // set the owning side to null (unless already changed)
            if ($propalDate->getRando() === $this) {
                $propalDate->setRando(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, RaPropalAdventure>
     */
    public function getPropalAdventures(): Collection
    {
        return $this->propalAdventures;
    }

    public function addPropalAdventure(RaPropalAdventure $propalAdventure): self
    {
        if (!$this->propalAdventures->contains($propalAdventure)) {
            $this->propalAdventures->add($propalAdventure);
            $propalAdventure->setRando($this);
        }

        return $this;
    }

    public function removePropalAdventure(RaPropalAdventure $propalAdventure): self
    {
        if ($this->propalAdventures->removeElement($propalAdventure)) {
            // set the owning side to null (unless already changed)
            if ($propalAdventure->getRando() === $this) {
                $propalAdventure->setRando(null);
            }
        }

        return $this;
    }

    public function getAdventure(): ?RaPropalAdventure
    {
        return $this->adventure;
    }

    public function setAdventure(?RaPropalAdventure $adventure): self
    {
        $this->adventure = $adventure;

        return $this;
    }

    public function getAdventureDate(): ?RaPropalDate
    {
        return $this->adventureDate;
    }

    public function setAdventureDate(?RaPropalDate $adventureDate): self
    {
        $this->adventureDate = $adventureDate;

        return $this;
    }

    public function getLevel(): ?int
    {
        return $this->level;
    }

    public function setLevel(?int $level): self
    {
        $this->level = $level;

        return $this;
    }

    public function getAltitude(): ?int
    {
        return $this->altitude;
    }

    public function setAltitude(?int $altitude): self
    {
        $this->altitude = $altitude;

        return $this;
    }

    public function getDevPlus(): ?int
    {
        return $this->devPlus;
    }

    public function setDevPlus(?int $devPlus): self
    {
        $this->devPlus = $devPlus;

        return $this;
    }

    public function getDistance(): ?float
    {
        return $this->distance;
    }

    public function setDistance(?float $distance): self
    {
        $this->distance = $distance;

        return $this;
    }

    /**
     * @return Collection<int, RaImage>
     */
    public function getImages(): Collection
    {
        return $this->images;
    }

    public function addImage(RaImage $image): self
    {
        if (!$this->images->contains($image)) {
            $this->images->add($image);
            $image->setRando($this);
        }

        return $this;
    }

    public function removeImage(RaImage $image): self
    {
        if ($this->images->removeElement($image)) {
            // set the owning side to null (unless already changed)
            if ($image->getRando() === $this) {
                $image->setRando(null);
            }
        }

        return $this;
    }

    public function getCover(): ?string
    {
        return $this->cover;
    }

    public function setCover(?string $cover): self
    {
        $this->cover = $cover;

        return $this;
    }

    public function getCoverFile()
    {
        return $this->getFileOrDefault($this->cover, RaRando::FOLDER_THUMBS . '/' . $this->id);
    }

    public function getGooglePhotos(): ?string
    {
        return $this->googlePhotos;
    }

    public function setGooglePhotos(?string $googlePhotos): self
    {
        $this->googlePhotos = $googlePhotos;

        return $this;
    }

    public function getStory(): ?string
    {
        return $this->story;
    }

    public function setStory(?string $story): self
    {
        $this->story = $story;

        return $this;
    }
}
