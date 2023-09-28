<?php

namespace App\Entity\Firebase;

use App\Entity\Birthday\BiBirthday;
use App\Repository\Firebase\FiTokenRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FiTokenRepository::class)]
class FiToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $token = null;

    #[ORM\Column(nullable: true)]
    private ?int $birthdayId = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function setToken(string $token): self
    {
        $this->token = $token;

        return $this;
    }

    public function getBirthdayId(): ?int
    {
        return $this->birthdayId;
    }

    public function setBirthdayId(?int $birthdayId): self
    {
        $this->birthdayId = $birthdayId;

        return $this;
    }
}
