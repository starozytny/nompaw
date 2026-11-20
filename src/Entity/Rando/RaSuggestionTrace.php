<?php

namespace App\Entity\Rando;

use App\Repository\Rando\RaSuggestionTraceRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * One GPX route proposed for a RaSuggestion (a suggestion can have several alternative routes).
 * The GPX file lives under public/FOLDER; stats are computed once at import by GpxService.
 */
#[ORM\Entity(repositoryClass: RaSuggestionTraceRepository::class)]
class RaSuggestionTrace
{
    const FOLDER = 'suggestions/traces';
    const SOURCE_USER = 'user';
    const SOURCE_AI = 'ai';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'traces')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?RaSuggestion $suggestion = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 255)]
    private ?string $fileName = null;

    #[ORM\Column(nullable: true)]
    private ?float $distanceKm = null;

    #[ORM\Column(nullable: true)]
    private ?int $elevationGainM = null;

    #[ORM\Column(nullable: true)]
    private ?int $altitudeMaxM = null;

    #[ORM\Column(length: 10)]
    private string $source = self::SOURCE_USER;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getSuggestion(): ?RaSuggestion { return $this->suggestion; }
    public function setSuggestion(?RaSuggestion $suggestion): static { $this->suggestion = $suggestion; return $this; }
    public function getName(): ?string { return $this->name; }
    public function setName(?string $name): static { $this->name = $name; return $this; }
    public function getFileName(): ?string { return $this->fileName; }
    public function setFileName(?string $fileName): static { $this->fileName = $fileName; return $this; }
    public function getDistanceKm(): ?float { return $this->distanceKm; }
    public function setDistanceKm(?float $distanceKm): static { $this->distanceKm = $distanceKm; return $this; }
    public function getElevationGainM(): ?int { return $this->elevationGainM; }
    public function setElevationGainM(?int $elevationGainM): static { $this->elevationGainM = $elevationGainM; return $this; }
    public function getAltitudeMaxM(): ?int { return $this->altitudeMaxM; }
    public function setAltitudeMaxM(?int $altitudeMaxM): static { $this->altitudeMaxM = $altitudeMaxM; return $this; }
    public function getSource(): string { return $this->source; }
    public function setSource(string $source): static { $this->source = $source; return $this; }
    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
}
