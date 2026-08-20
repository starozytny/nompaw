<?php

namespace App\Entity\Crypto;

use App\Entity\Main\User;
use App\Repository\Crypto\CrBitpandaCredentialRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A user's Bitpanda API key, used by BitpandaApiClient to fetch operations on their behalf.
 * apiKeyEncrypted is never stored in clear — see CredentialEncryptionService. Unlike Coinbase/Kraken,
 * Bitpanda's key is a single bearer-style secret (no separate public identifier), so apiKeyPreview (last
 * 4 characters only, not sensitive) is stored in clear purely for UI display.
 */
#[ORM\Entity(repositoryClass: CrBitpandaCredentialRepository::class)]
class CrBitpandaCredential
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne]
    #[ORM\JoinColumn(nullable: false, unique: true)]
    private ?User $user = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $apiKeyEncrypted = null;

    #[ORM\Column(length: 20)]
    private ?string $apiKeyPreview = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $connectedAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $lastSyncedAt = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $lastSyncError = null;

    public function getId(): ?int
    {
        return $this->id;
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

    public function getApiKeyEncrypted(): ?string
    {
        return $this->apiKeyEncrypted;
    }

    public function setApiKeyEncrypted(string $apiKeyEncrypted): static
    {
        $this->apiKeyEncrypted = $apiKeyEncrypted;

        return $this;
    }

    public function getApiKeyPreview(): ?string
    {
        return $this->apiKeyPreview;
    }

    public function setApiKeyPreview(string $apiKeyPreview): static
    {
        $this->apiKeyPreview = $apiKeyPreview;

        return $this;
    }

    public function getConnectedAt(): ?\DateTimeInterface
    {
        return $this->connectedAt;
    }

    public function setConnectedAt(\DateTimeInterface $connectedAt): static
    {
        $this->connectedAt = $connectedAt;

        return $this;
    }

    public function getLastSyncedAt(): ?\DateTimeInterface
    {
        return $this->lastSyncedAt;
    }

    public function setLastSyncedAt(?\DateTimeInterface $lastSyncedAt): static
    {
        $this->lastSyncedAt = $lastSyncedAt;

        return $this;
    }

    public function getLastSyncError(): ?string
    {
        return $this->lastSyncError;
    }

    public function setLastSyncError(?string $lastSyncError): static
    {
        $this->lastSyncError = $lastSyncError;

        return $this;
    }
}
