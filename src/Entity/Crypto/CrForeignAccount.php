<?php

namespace App\Entity\Crypto;

use App\Entity\Main\User;
use App\Repository\Crypto\CrForeignAccountRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * One row per foreign crypto platform/account the user holds — powers the 3916-BIS declaration (a
 * separate, simpler form than the 2086 capital-gains report: no calculation, just an account listing).
 * Auto-seeded from CrTrade::importedFrom by CrForeignAccountService::sync() (one row per distinct
 * platform actually used), then freely editable/deletable by the user — sourceImportedFrom just prevents
 * the sync from re-creating a row that already exists, it never overwrites a user's edits.
 */
#[ORM\Entity(repositoryClass: CrForeignAccountRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_cr_foreign_account_user_source', columns: ['user_id', 'source_imported_from'])]
class CrForeignAccount
{
    const LIST = ['foreign_account_list'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['foreign_account_list'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['foreign_account_list'])]
    #[Assert\NotBlank]
    private ?string $platform = null;

    /**
     * Raw CrTrade::importedFrom value this row was seeded from; null for a manually-added account.
     * Never shown/edited directly — only used by CrForeignAccountService::sync() to avoid duplicates.
     */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $sourceImportedFrom = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['foreign_account_list'])]
    private ?string $accountIdentifier = null;

    /**
     * Provider's address — never guessed/pre-filled by the app, left for the user to fill in themselves.
     */
    #[ORM\Column(length: 500, nullable: true)]
    #[Groups(['foreign_account_list'])]
    private ?string $address = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['foreign_account_list'])]
    private ?\DateTimeInterface $openedAt = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['foreign_account_list'])]
    private ?\DateTimeInterface $closedAt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['foreign_account_list'])]
    private ?string $notes = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPlatform(): ?string
    {
        return $this->platform;
    }

    public function setPlatform(string $platform): static
    {
        $this->platform = $platform;

        return $this;
    }

    public function getSourceImportedFrom(): ?string
    {
        return $this->sourceImportedFrom;
    }

    public function setSourceImportedFrom(?string $sourceImportedFrom): static
    {
        $this->sourceImportedFrom = $sourceImportedFrom;

        return $this;
    }

    public function getAccountIdentifier(): ?string
    {
        return $this->accountIdentifier;
    }

    public function setAccountIdentifier(?string $accountIdentifier): static
    {
        $this->accountIdentifier = $accountIdentifier;

        return $this;
    }

    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function setAddress(?string $address): static
    {
        $this->address = $address;

        return $this;
    }

    public function getOpenedAt(): ?\DateTimeInterface
    {
        return $this->openedAt;
    }

    public function setOpenedAt(?\DateTimeInterface $openedAt): static
    {
        $this->openedAt = $openedAt;

        return $this;
    }

    public function getClosedAt(): ?\DateTimeInterface
    {
        return $this->closedAt;
    }

    public function setClosedAt(?\DateTimeInterface $closedAt): static
    {
        $this->closedAt = $closedAt;

        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;

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
}
