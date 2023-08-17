<?php

namespace App\Entity\Holiday;

use App\Entity\DataEntity;
use App\Entity\Main\User;
use App\Repository\Holiday\HoProjectRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: HoProjectRepository::class)]
class HoProject extends DataEntity
{
    const FOLDER = "images/entity/holidays/cover/";

    const FORM = ['hopro_form'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['hopro_form'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['hopro_form'])]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['hopro_form'])]
    private ?string $image = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $startAt = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $endAt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['hopro_form'])]
    private ?string $description = null;

    #[ORM\Column(length: 255)]
    #[Groups(['hopro_form'])]
    private ?string $slug = null;

    #[ORM\Column(length: 255)]
    #[Groups(['hopro_form'])]
    private ?string $code = null;

    #[ORM\ManyToOne(inversedBy: 'hoProjects')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $author = null;

    #[ORM\OneToMany(mappedBy: 'project', targetEntity: HoPropalDate::class)]
    private Collection $propalDates;

    #[ORM\OneToOne(cascade: ['persist', 'remove'], fetch: 'EAGER')]
    #[Groups(['hopro_form'])]
    private ?HoPropalDate $propalDate = null;

    #[ORM\OneToMany(mappedBy: 'project', targetEntity: HoPropalHouse::class)]
    private Collection $propalHouses;

    #[ORM\OneToOne(cascade: ['persist', 'remove'], fetch: 'EAGER')]
    #[Groups(['hopro_form'])]
    private ?HoPropalHouse $propalHouse = null;

    #[ORM\OneToMany(mappedBy: 'project', targetEntity: HoPropalActivity::class)]
    private Collection $propalActivities;

    public function __construct()
    {
        $this->propalDates = new ArrayCollection();
        $this->propalHouses = new ArrayCollection();
        $this->propalActivities = new ArrayCollection();
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

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): self
    {
        $this->image = $image;

        return $this;
    }

    #[Groups(['hopro_form'])]
    public function getImageFile()
    {
        return $this->getFileOrDefault($this->getImage(), self::FOLDER);
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

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

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): self
    {
        $this->code = $code;

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
     * @return Collection<int, HoPropalDate>
     */
    public function getPropalDates(): Collection
    {
        return $this->propalDates;
    }

    public function addPropalDate(HoPropalDate $propalDate): self
    {
        if (!$this->propalDates->contains($propalDate)) {
            $this->propalDates->add($propalDate);
            $propalDate->setProject($this);
        }

        return $this;
    }

    public function removePropalDate(HoPropalDate $propalDate): self
    {
        if ($this->propalDates->removeElement($propalDate)) {
            // set the owning side to null (unless already changed)
            if ($propalDate->getProject() === $this) {
                $propalDate->setProject(null);
            }
        }

        return $this;
    }

    public function getPropalDate(): ?HoPropalDate
    {
        return $this->propalDate;
    }

    public function setPropalDate(?HoPropalDate $propalDate): self
    {
        $this->propalDate = $propalDate;

        return $this;
    }

    /**
     * @return Collection<int, HoPropalHouse>
     */
    public function getPropalHouses(): Collection
    {
        return $this->propalHouses;
    }

    public function addPropalHouse(HoPropalHouse $propalHouse): self
    {
        if (!$this->propalHouses->contains($propalHouse)) {
            $this->propalHouses->add($propalHouse);
            $propalHouse->setProject($this);
        }

        return $this;
    }

    public function removePropalHouse(HoPropalHouse $propalHouse): self
    {
        if ($this->propalHouses->removeElement($propalHouse)) {
            // set the owning side to null (unless already changed)
            if ($propalHouse->getProject() === $this) {
                $propalHouse->setProject(null);
            }
        }

        return $this;
    }

    public function getPropalHouse(): ?HoPropalHouse
    {
        return $this->propalHouse;
    }

    public function setPropalHouse(?HoPropalHouse $propalHouse): self
    {
        $this->propalHouse = $propalHouse;

        return $this;
    }

    /**
     * @return Collection<int, HoPropalActivity>
     */
    public function getPropalActivities(): Collection
    {
        return $this->propalActivities;
    }

    public function addPropalActivity(HoPropalActivity $propalActivity): self
    {
        if (!$this->propalActivities->contains($propalActivity)) {
            $this->propalActivities->add($propalActivity);
            $propalActivity->setProject($this);
        }

        return $this;
    }

    public function removePropalActivity(HoPropalActivity $propalActivity): self
    {
        if ($this->propalActivities->removeElement($propalActivity)) {
            // set the owning side to null (unless already changed)
            if ($propalActivity->getProject() === $this) {
                $propalActivity->setProject(null);
            }
        }

        return $this;
    }
}
