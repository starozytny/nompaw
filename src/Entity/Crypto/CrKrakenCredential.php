<?php

namespace App\Entity\Crypto;

use App\Entity\Main\User;
use App\Repository\Crypto\CrKrakenCredentialRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A user's Kraken API key pair, used by KrakenApiClient to fetch ledger entries on their behalf.
 * apiSecretEncrypted is never stored in clear — see CredentialEncryptionService. apiKey itself is stored
 * plain: like CrCoinbaseCredential::keyName, it's an identifier sent in a header, not a usable secret on
 * its own (every Kraken request must additionally be HMAC-signed with apiSecret).
 */
#[ORM\Entity(repositoryClass: CrKrakenCredentialRepository::class)]
class CrKrakenCredential
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne]
    #[ORM\JoinColumn(nullable: false, unique: true)]
    private ?User $user = null;

    #[ORM\Column(length: 255)]
    private ?string $apiKey = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $apiSecretEncrypted = null;

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

    public function getApiKey(): ?string
    {
        return $this->apiKey;
    }

    public function setApiKey(string $apiKey): static
    {
        $this->apiKey = $apiKey;

        return $this;
    }

    public function getApiSecretEncrypted(): ?string
    {
        return $this->apiSecretEncrypted;
    }

    public function setApiSecretEncrypted(string $apiSecretEncrypted): static
    {
        $this->apiSecretEncrypted = $apiSecretEncrypted;

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
