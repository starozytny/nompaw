<?php

namespace App\Entity\Holiday;

use App\Entity\Main\User;
use App\Repository\Holiday\HoPropalDateRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: HoPropalDateRepository::class)]
class HoPropalDate
{
    const LIST = ["pr_date_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['pr_date_list'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['pr_date_list'])]
    private ?\DateTimeInterface $startAt = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['pr_date_list'])]
    private ?\DateTimeInterface $endAt = null;

    #[ORM\Column(type: Types::ARRAY)]
    #[Groups(['pr_date_list'])]
    private array $votes = [];

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'propalDates')]
    #[ORM\JoinColumn(nullable: false)]
    private ?HoProject $project = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'hoPropalDates')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['pr_date_list'])]
    private ?User $author = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getStartAt(): ?\DateTimeInterface
    {
        return $this->startAt;
    }

    public function setStartAt(\DateTimeInterface $startAt): self
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
}
