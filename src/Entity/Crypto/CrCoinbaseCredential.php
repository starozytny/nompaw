<?php

namespace App\Entity\Crypto;

use App\Entity\Main\User;
use App\Repository\Crypto\CrCoinbaseCredentialRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A user's Coinbase Developer Platform (CDP) API key, used by CoinbaseApiClient to fetch transactions
 * on their behalf. privateKeyEncrypted is never stored in clear — see CredentialEncryptionService.
 */
#[ORM\Entity(repositoryClass: CrCoinbaseCredentialRepository::class)]
class CrCoinbaseCredential
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne]
    #[ORM\JoinColumn(nullable: false, unique: true)]
    private ?User $user = null;

    #[ORM\Column(length: 255)]
    private ?string $keyName = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $privateKeyEncrypted = null;

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

    public function getKeyName(): ?string
    {
        return $this->keyName;
    }

    public function setKeyName(string $keyName): static
    {
        $this->keyName = $keyName;

        return $this;
    }

    public function getPrivateKeyEncrypted(): ?string
    {
        return $this->privateKeyEncrypted;
    }

    public function setPrivateKeyEncrypted(string $privateKeyEncrypted): static
    {
        $this->privateKeyEncrypted = $privateKeyEncrypted;

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
