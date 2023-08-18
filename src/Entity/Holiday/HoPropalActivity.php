<?php

namespace App\Entity\Holiday;

use App\Entity\DataEntity;
use App\Entity\Main\User;
use App\Repository\Holiday\HoPropalActivityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: HoPropalActivityRepository::class)]
class HoPropalActivity extends DataEntity
{
    const FOLDER = "images/entity/holidays/activities/";

    const LIST = ["pr_act_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['pr_act_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['pr_act_list'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::ARRAY)]
    #[Groups(['pr_act_list'])]
    private array $votes = [];

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'propalActivities')]
    #[ORM\JoinColumn(nullable: false)]
    private ?HoProject $project = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'hoPropalActivities')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['pr_act_list'])]
    private ?User $author = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['pr_act_list'])]
    private ?string $url = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['pr_act_list'])]
    private ?float $price = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['pr_act_list'])]
    private ?string $image = null;

    #[ORM\Column]
    #[Groups(['pr_act_list'])]
    private ?bool $isSelected = false;

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

    public function getVotes(): array
    {
        return $this->votes;
    }

    public function setVotes(array $votes): self
    {
        $this->votes = $votes;

        return $this;
    }

    public function getProject(): ?HoProject
    {
        return $this->project;
    }

    public function setProject(?HoProject $project): self
    {
        $this->project = $project;

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

    public function getUrl(): ?string
    {
        return $this->url;
    }

    public function setUrl(?string $url): self
    {
        $this->url = $url;

        return $this;
    }

    public function getPrice(): ?float
    {
        return $this->price;
    }

    public function setPrice(?float $price): self
    {
        $this->price = $price;

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

    #[Groups(['pr_act_list'])]
    public function getImageFile()
    {
        return $this->getFileOrDefault($this->getImage(), self::FOLDER . $this->project->getId());
    }

    public function isIsSelected(): ?bool
    {
        return $this->isSelected;
    }

    public function setIsSelected(bool $isSelected): self
    {
        $this->isSelected = $isSelected;

        return $this;
    }
}
