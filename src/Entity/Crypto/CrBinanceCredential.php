<?php

namespace App\Entity\Crypto;

use App\Entity\Main\User;
use App\Repository\Crypto\CrBinanceCredentialRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A user's Binance API key pair, used by BinanceApiClient to fetch trades/deposits/withdrawals on their
 * behalf. apiSecretEncrypted is never stored in clear — see CredentialEncryptionService. apiKey itself is
 * stored plain: like CrKrakenCredential::apiKey, it's an identifier sent in a header, not a usable secret
 * on its own (every Binance request must additionally be HMAC-signed with apiSecret).
 *
 * manualSymbols is a user-maintained comma-separated list of extra trading pairs to sync (e.g.
 * "BTCUSDT,ETHUSDT") — Binance's GET /api/v3/myTrades requires a symbol and has no "all trades" endpoint,
 * so BinanceController::sync() can only auto-detect pairs from current non-zero balances; a fully closed
 * position (bought then fully sold, balance back to zero) needs to be listed here to keep being synced.
 */
#[ORM\Entity(repositoryClass: CrBinanceCredentialRepository::class)]
class CrBinanceCredential
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

    #[ORM\Column(length: 1000, nullable: true)]
    private ?string $manualSymbols = null;

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

    public function getManualSymbols(): ?string
    {
        return $this->manualSymbols;
    }

    public function setManualSymbols(?string $manualSymbols): static
    {
        $this->manualSymbols = $manualSymbols;

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
