<?php

namespace App\Entity\Photo;

use App\Entity\Main\User;
use App\Repository\Photo\PhShareLinkRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: PhShareLinkRepository::class)]
class PhShareLink
{
    const LIST = ["ph_share_link_list"];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ph_share_link_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 64, unique: true)]
    private ?string $token = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    #[Groups(['ph_share_link_list'])]
    private ?PhMedia $media = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    #[Groups(['ph_share_link_list'])]
    private ?PhAlbum $album = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $createdBy = null;

    #[ORM\Column]
    #[Groups(['ph_share_link_list'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['ph_share_link_list'])]
    private ?\DateTime $expiresAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTime $revokedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['ph_share_link_list'])]
    private ?\DateTime $lastViewedAt = null;

    #[ORM\Column]
    #[Groups(['ph_share_link_list'])]
    private int $viewCount = 0;

    public function __construct()
    {
        $this->token = bin2hex(random_bytes(32));
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function getMedia(): ?PhMedia
    {
        return $this->media;
    }

    public function setMedia(?PhMedia $media): static
    {
        $this->media = $media;

        return $this;
    }

    public function getAlbum(): ?PhAlbum
    {
        return $this->album;
    }

    public function setAlbum(?PhAlbum $album): static
    {
        $this->album = $album;

        return $this;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): static
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getExpiresAt(): ?\DateTime
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTime $expiresAt): static
    {
        $this->expiresAt = $expiresAt;

        return $this;
    }

    public function getRevokedAt(): ?\DateTime
    {
        return $this->revokedAt;
    }

    public function setRevokedAt(?\DateTime $revokedAt): static
    {
        $this->revokedAt = $revokedAt;

        return $this;
    }

    public function getLastViewedAt(): ?\DateTime
    {
        return $this->lastViewedAt;
    }

    public function setLastViewedAt(?\DateTime $lastViewedAt): static
    {
        $this->lastViewedAt = $lastViewedAt;

        return $this;
    }

    public function getViewCount(): int
    {
        return $this->viewCount;
    }

    public function incrementViewCount(): static
    {
        $this->viewCount++;

        return $this;
    }

    public function isActive(): bool
    {
        if ($this->revokedAt !== null) {
            return false;
        }

        return $this->expiresAt >= new \DateTime();
    }
}
