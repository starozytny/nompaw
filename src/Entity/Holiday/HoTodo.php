<?php

namespace App\Entity\Holiday;

use App\Repository\Holiday\HoTodoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: HoTodoRepository::class)]
class HoTodo
{
    const LIST = ['ho_todo_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ho_todo_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ho_todo_list'])]
    private ?string $name = null;

    #[ORM\ManyToOne(inversedBy: 'todos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?HoProject $project = null;

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

    public function getProject(): ?HoProject
    {
        return $this->project;
    }

    public function setProject(?HoProject $project): self
    {
        $this->project = $project;

        return $this;
    }
}
