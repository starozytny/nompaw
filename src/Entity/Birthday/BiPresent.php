<?php

namespace App\Entity\Birthday;

use App\Entity\DataEntity;
use App\Entity\Main\User;
use App\Repository\Birthday\BiPresentRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: BiPresentRepository::class)]
class BiPresent extends DataEntity
{
    const FOLDER = "images/entity/birthdays/presents/";

    const LIST = ["bi_present_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['bi_present_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['bi_present_list'])]
    private ?string $name = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['bi_present_list'])]
    private ?float $price = null;

    #[ORM\Column]
    #[Groups(['bi_present_list'])]
    private ?bool $isSelected = false;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['bi_present_list'])]
    private ?string $image = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['bi_present_list'])]
    private ?string $url = null;

    #[ORM\ManyToOne(inversedBy: 'biPresents')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['bi_present_list'])]
    private ?User $author = null;

    #[ORM\ManyToOne(inversedBy: 'presents')]
    #[ORM\JoinColumn(nullable: false)]
    private ?BiBirthday $birthday = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['bi_present_list'])]
    private ?string $guestName = null;

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

    public function getPrice(): ?float
    {
        return $this->price;
    }

    public function setPrice(?float $price): self
    {
        $this->price = $price;

        return $this;
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

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): self
    {
        $this->image = $image;

        return $this;
    }

    #[Groups(['bi_present_list'])]
    public function getImageFile()
    {
        return $this->getFileOrDefault($this->getImage(), self::FOLDER . $this->birthday->getId());
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

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): self
    {
        $this->author = $author;

        return $this;
    }

    public function getBirthday(): ?BiBirthday
    {
        return $this->birthday;
    }

    public function setBirthday(?BiBirthday $birthday): self
    {
        $this->birthday = $birthday;

        return $this;
    }

    public function getGuestName(): ?string
    {
        return $this->guestName;
    }

    public function setGuestName(?string $guestName): self
    {
        $this->guestName = $guestName;

        return $this;
    }
}
