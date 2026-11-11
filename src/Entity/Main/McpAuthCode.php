<?php

namespace App\Entity\Main;

use App\Repository\Main\McpAuthCodeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A short-lived, single-use authorization code for the MCP OAuth flow (RFC 6749 §4.1 + PKCE).
 * Stored hashed, never in clear, exactly like a password-reset token.
 */
#[ORM\Entity(repositoryClass: McpAuthCodeRepository::class)]
class McpAuthCode
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 64, unique: true)]
    private ?string $codeHash = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(length: 2048)]
    private ?string $redirectUri = null;

    #[ORM\Column(length: 255)]
    private ?string $codeChallenge = null;

    #[ORM\Column(length: 16)]
    private ?string $codeChallengeMethod = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $expiresAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $usedAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCodeHash(): ?string
    {
        return $this->codeHash;
    }

    public function setCodeHash(string $codeHash): static
    {
        $this->codeHash = $codeHash;
        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getRedirectUri(): ?string
    {
        return $this->redirectUri;
    }

    public function setRedirectUri(string $redirectUri): static
    {
        $this->redirectUri = $redirectUri;
        return $this;
    }

    public function getCodeChallenge(): ?string
    {
        return $this->codeChallenge;
    }

    public function setCodeChallenge(string $codeChallenge): static
    {
        $this->codeChallenge = $codeChallenge;
        return $this;
    }

    public function getCodeChallengeMethod(): ?string
    {
        return $this->codeChallengeMethod;
    }

    public function setCodeChallengeMethod(string $codeChallengeMethod): static
    {
        $this->codeChallengeMethod = $codeChallengeMethod;
        return $this;
    }

    public function getExpiresAt(): ?\DateTimeInterface
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTimeInterface $expiresAt): static
    {
        $this->expiresAt = $expiresAt;
        return $this;
    }

    public function getUsedAt(): ?\DateTimeInterface
    {
        return $this->usedAt;
    }

    public function setUsedAt(?\DateTimeInterface $usedAt): static
    {
        $this->usedAt = $usedAt;
        return $this;
    }

    public function isUsable(\DateTimeInterface $now): bool
    {
        return $this->usedAt === null && $this->expiresAt > $now;
    }
}
