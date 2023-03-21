<?php

namespace App\Entity\Rando;

use App\Entity\Enum\Rando\StatusType;
use App\Entity\Main\User;
use App\Repository\Rando\RaRandoRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: RaRandoRepository::class)]
class RaRando
{
    const FOLDER = "images/editor/randos";

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
    private ?int $status = StatusType::Propal;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['rando_form'])]
    private ?string $description = null;

    #[ORM\Column]
    private ?bool $isNext = false;

    #[ORM\Column(length: 255)]
    private ?string $slug = null;

    #[ORM\ManyToOne(inversedBy: 'randos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?RaGroupe $groupe = null;

    #[ORM\ManyToOne(inversedBy: 'raRandos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $author = null;

    #[ORM\OneToMany(mappedBy: 'rando', targetEntity: RaPropalDate::class)]
    private Collection $propalDates;

    public function __construct()
    {
        $this->propalDates = new ArrayCollection();
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
}
