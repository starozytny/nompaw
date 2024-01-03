<?php

namespace App\Entity\Birthday;

use App\Entity\DataEntity;
use App\Entity\Main\User;
use App\Repository\Birthday\BiBirthdayRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: BiBirthdayRepository::class)]
class BiBirthday extends DataEntity
{
    const FOLDER = "images/entity/birthdays/cover/";

    const FORM = ['bibirth_form'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['bibirth_form'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['bibirth_form'])]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['bibirth_form'])]
    private ?string $image = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['bibirth_form'])]
    private ?\DateTimeInterface $startAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['bibirth_form'])]
    private ?\DateTimeInterface $timeAt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['bibirth_form'])]
    private ?string $description = null;

    #[ORM\Column(length: 255)]
    #[Groups(['bibirth_form'])]
    private ?string $slug = null;

    #[ORM\Column(length: 255)]
    #[Groups(['bibirth_form'])]
    private ?string $code = null;

    #[ORM\ManyToOne(inversedBy: 'biBirthdays')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $author = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['bibirth_form'])]
    private ?string $iframeRoute = null;

    #[ORM\OneToMany(mappedBy: 'birthday', targetEntity: BiPresent::class)]
    private Collection $presents;

    public function __construct()
    {
        $this->presents = new ArrayCollection();
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

    #[Groups(['bibirth_form'])]
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

    public function getTimeAt(): ?\DateTimeInterface
    {
        return $this->timeAt;
    }

    public function setTimeAt(?\DateTimeInterface $timeAt): self
    {
        $this->timeAt = $timeAt;

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

    public function getIframeRoute(): ?string
    {
        return $this->iframeRoute;
    }

    public function setIframeRoute(?string $iframeRoute): self
    {
        $this->iframeRoute = $iframeRoute;

        return $this;
    }

    /**
     * @return Collection<int, BiPresent>
     */
    public function getPresents(): Collection
    {
        return $this->presents;
    }

    public function addPresent(BiPresent $present): self
    {
        if (!$this->presents->contains($present)) {
            $this->presents->add($present);
            $present->setBirthday($this);
        }

        return $this;
    }

    public function removePresent(BiPresent $present): self
    {
        if ($this->presents->removeElement($present)) {
            // set the owning side to null (unless already changed)
            if ($present->getBirthday() === $this) {
                $present->setBirthday(null);
            }
        }

        return $this;
    }
}
