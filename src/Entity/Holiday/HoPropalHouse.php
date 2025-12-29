<?php

namespace App\Entity\Holiday;

use App\Entity\Main\User;
use App\Repository\Holiday\HoPropalHouseRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: HoPropalHouseRepository::class)]
class HoPropalHouse
{
    const LIST = ["pr_house_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['pr_house_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['pr_house_list'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::ARRAY)]
    #[Groups(['pr_house_list'])]
    private array $votes = [];

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'propalHouses')]
    #[ORM\JoinColumn(nullable: false)]
    private ?HoProject $project = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'hoPropalHouses')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['pr_house_list'])]
    private ?User $author = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['pr_house_list'])]
    private ?string $url = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['pr_house_list'])]
    private ?float $price = null;

    #[ORM\Column]
    #[Groups(['pr_house_list'])]
    private ?int $nbNights = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['pr_house_list'])]
    private ?string $localisation = null;

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

    public function getNbNights(): ?int
    {
        return $this->nbNights;
    }

    public function setNbNights(int $nbNights): static
    {
        $this->nbNights = $nbNights;

        return $this;
    }

    public function getLocalisation(): ?string
    {
        return $this->localisation;
    }

    public function setLocalisation(?string $localisation): static
    {
        $this->localisation = $localisation;

        return $this;
    }
}
