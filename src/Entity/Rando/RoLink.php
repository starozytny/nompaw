<?php

namespace App\Entity\Rando;

use App\Entity\Main\User;
use App\Repository\Rando\RoLinkRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RoLinkRepository::class)]
class RoLink
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'roLinks')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'links')]
    #[ORM\JoinColumn(nullable: false)]
    private ?RoGroupe $groupe = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getGroupe(): ?RoGroupe
    {
        return $this->groupe;
    }

    public function setGroupe(?RoGroupe $groupe): self
    {
        $this->groupe = $groupe;

        return $this;
    }
}
