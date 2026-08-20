<?php

namespace App\Entity\Crypto;

use App\Entity\Main\User;
use App\Repository\Crypto\CrImportLogRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * One row per completed import batch — a single recognized CSV file (CryptoImportService::import(), one
 * row per file even when a zip contains several) or a single exchange sync call
 * (CryptoImportService::importFromApi(), used by the Kraken/Coinbase/Binance/Crypto.com controllers) —
 * so the "Historique des imports" panel can show every past attempt per platform, including ones that
 * only produced duplicates or partially failed, rather than just the last in-memory result shown right
 * after the request that triggered it.
 */
#[ORM\Entity(repositoryClass: CrImportLogRepository::class)]
class CrImportLog
{
    const LIST = ['import_log_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['import_log_list'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    /**
     * Matches CrTrade::importedFrom — a parser's or mapper's getSourceName(), e.g. "Kraken",
     * "Coinbase API", "Coinbase Pro/Fills".
     */
    #[ORM\Column(length: 100)]
    #[Groups(['import_log_list'])]
    private ?string $source = null;

    /**
     * 'file' for a CSV upload via ImportController, 'api' for an exchange sync (Kraken/Coinbase/Binance/
     * Crypto.com controllers) — both funnel through CryptoImportService.
     */
    #[ORM\Column(length: 10)]
    #[Groups(['import_log_list'])]
    private ?string $via = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['import_log_list'])]
    private ?string $fileName = null;

    #[ORM\Column]
    #[Groups(['import_log_list'])]
    private ?int $importedCount = null;

    #[ORM\Column]
    #[Groups(['import_log_list'])]
    private ?int $duplicatesCount = null;

    #[ORM\Column]
    #[Groups(['import_log_list'])]
    private ?int $errorsCount = null;

    /**
     * @var list<array{file: string, importedId: ?string, message: string}>|null
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['import_log_list'])]
    private ?array $errors = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['import_log_list'])]
    private ?\DateTimeInterface $createdAt = null;

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

    public function getSource(): ?string
    {
        return $this->source;
    }

    public function setSource(string $source): static
    {
        $this->source = $source;

        return $this;
    }

    public function getVia(): ?string
    {
        return $this->via;
    }

    public function setVia(string $via): static
    {
        $this->via = $via;

        return $this;
    }

    public function getFileName(): ?string
    {
        return $this->fileName;
    }

    public function setFileName(?string $fileName): static
    {
        $this->fileName = $fileName;

        return $this;
    }

    public function getImportedCount(): ?int
    {
        return $this->importedCount;
    }

    public function setImportedCount(int $importedCount): static
    {
        $this->importedCount = $importedCount;

        return $this;
    }

    public function getDuplicatesCount(): ?int
    {
        return $this->duplicatesCount;
    }

    public function setDuplicatesCount(int $duplicatesCount): static
    {
        $this->duplicatesCount = $duplicatesCount;

        return $this;
    }

    public function getErrorsCount(): ?int
    {
        return $this->errorsCount;
    }

    public function setErrorsCount(int $errorsCount): static
    {
        $this->errorsCount = $errorsCount;

        return $this;
    }

    public function getErrors(): ?array
    {
        return $this->errors;
    }

    public function setErrors(?array $errors): static
    {
        $this->errors = $errors;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }
}
