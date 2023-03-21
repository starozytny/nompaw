<?php

namespace App\Entity\Rando;

use App\Entity\Main\User;
use App\Repository\Rando\RaPropalDateRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: RaPropalDateRepository::class)]
class RaPropalDate
{
    const LIST = ["pr_date_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['pr_date_list'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['pr_date_list'])]
    private ?\DateTimeInterface $dateAt = null;

    #[ORM\Column(type: Types::ARRAY)]
    #[Groups(['pr_date_list'])]
    private array $votes = [];

    #[ORM\ManyToOne(inversedBy: 'propalDates')]
    #[ORM\JoinColumn(nullable: false)]
    private ?RaRando $rando = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'raPropalDates')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['pr_date_list'])]
    private ?User $author = null;
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDateAt(): ?\DateTimeInterface
    {
        return $this->dateAt;
    }

    public function setDateAt(\DateTimeInterface $dateAt): self
    {
        $this->dateAt = $dateAt;

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

    public function getRando(): ?RaRando
    {
        return $this->rando;
    }

    public function setRando(?RaRando $rando): self
    {
        $this->rando = $rando;

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
