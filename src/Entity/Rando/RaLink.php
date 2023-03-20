<?php

namespace App\Entity\Rando;

use App\Entity\Main\User;
use App\Repository\Rando\RaLinkRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: RaLinkRepository::class)]
class RaLink
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'roLinks')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'links')]
    #[ORM\JoinColumn(nullable: false)]
    private ?RaGroupe $groupe = null;

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

    public function getGroupe(): ?RaGroupe
    {
        return $this->groupe;
    }

    public function setGroupe(?RaGroupe $groupe): self
    {
        $this->groupe = $groupe;

        return $this;
    }
}
