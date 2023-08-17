<?php

namespace App\Entity\Holiday;

use App\Entity\DataEntity;
use App\Entity\Enum\Rando\StatusType;
use App\Entity\Main\User;
use App\Repository\Holiday\HoProjectRepository;
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

    #[ORM\Column]
    private ?int $status = StatusType::Propal;

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
}
