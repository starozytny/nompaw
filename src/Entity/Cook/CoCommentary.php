<?php

namespace App\Entity\Cook;

use App\Entity\DataEntity;
use App\Entity\Main\User;
use App\Repository\Cook\CoCommentaryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CoCommentaryRepository::class)]
class CoCommentary extends DataEntity
{
    const FOLDER = "images/editor/commentaries";

    const READ = ['com_read'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['com_read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'coCommentaries')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['com_read'])]
    private ?User $user = null;

    #[ORM\ManyToOne(fetch: 'EAGER', inversedBy: 'commentaries')]
    #[ORM\JoinColumn(nullable: false)]
    private ?CoRecipe $recipe = null;

    #[ORM\Column]
    #[Groups(['com_read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['com_read'])]
    private ?string $message = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['com_read'])]
    private ?int $answerTo = null;

    public function __construct()
    {
        $this->createdAt = $this->initNewDateImmutable();
    }

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

    public function getRecipe(): ?CoRecipe
    {
        return $this->recipe;
    }

    public function setRecipe(?CoRecipe $recipe): self
    {
        $this->recipe = $recipe;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(string $message): self
    {
        $this->message = $message;

        return $this;
    }

    public function getAnswerTo(): ?int
    {
        return $this->answerTo;
    }

    public function setAnswerTo(?int $answerTo): self
    {
        $this->answerTo = $answerTo;

        return $this;
    }
}
