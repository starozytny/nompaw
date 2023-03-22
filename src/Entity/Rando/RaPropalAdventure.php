<?php

namespace App\Entity\Rando;

use App\Entity\Main\User;
use App\Repository\Rando\RaPropalAdventureRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: RaPropalAdventureRepository::class)]
class RaPropalAdventure
{
    const LIST = ["pr_adv_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['pr_adv_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['pr_adv_list'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::ARRAY)]
    #[Groups(['pr_adv_list'])]
    private array $votes = [];

    #[ORM\ManyToOne(inversedBy: 'propalAdventures')]
    #[ORM\JoinColumn(nullable: false)]
    private ?RaRando $rando = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'raPropalAdventures')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['pr_adv_list'])]
    private ?User $author = null;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    #[Groups(['pr_adv_list'])]
    private ?\DateTimeInterface $duration = null;

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

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): self
    {
        $this->author = $author;

        return $this;
    }

    public function getDuration(): ?\DateTimeInterface
    {
        return $this->duration;
    }

    public function setDuration(?\DateTimeInterface $duration): self
    {
        $this->duration = $duration;

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
}
