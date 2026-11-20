<?php

namespace App\Entity\Rando;

use App\Entity\Enum\Rando\DifficultyType;
use App\Entity\Enum\Rando\SuggestionType;
use App\Entity\Main\User;
use App\Repository\Rando\RaSuggestionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * A hiking/bivouac idea — hand-written or proposed by an AI assistant through the MCP tool
 * `propose_rando` (see App\Controller\Mcp\McpController). Money fields are stored in cents to
 * avoid float rounding drift, exposed as euros via getX()/setX(), same convention as BuItem::price.
 */
#[ORM\Entity(repositoryClass: RaSuggestionRepository::class)]
class RaSuggestion
{
    const FORM = ['suggestion_form'];
    const LIST = ['suggestion_list'];
    const FOLDER_PHOTOS = 'suggestions/photos';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $author = null;

    #[ORM\Column(length: 255)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?string $name = null;

    #[ORM\Column(enumType: SuggestionType::class)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?SuggestionType $type = null;

    #[ORM\Column(enumType: DifficultyType::class)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?DifficultyType $difficulty = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?string $description = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?string $location = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?float $latitude = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?float $longitude = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?float $distanceKm = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?int $elevationGainM = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?int $altitudeMaxM = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?int $durationMinutes = null;

    #[ORM\Column(type: Types::JSON)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private array $pointsOfInterest = [];

    #[ORM\Column(type: Types::JSON)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private array $photoUrls = [];

    #[ORM\Column(length: 2048, nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?string $sourceUrl = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?string $parkRules = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?int $travelTimeFromPeyrollesMinutes = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?int $travelBudget = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['suggestion_list', 'suggestion_form'])]
    private ?int $randoBudget = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['suggestion_list'])]
    private ?\DateTimeInterface $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;
        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getType(): ?SuggestionType
    {
        return $this->type;
    }

    public function setType(?SuggestionType $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getTypeString(): ?string
    {
        return match ($this->type) {
            SuggestionType::Randonnee => 'Randonnée',
            SuggestionType::Bivouac => 'Bivouac',
            default => null,
        };
    }

    public function getDifficulty(): ?DifficultyType
    {
        return $this->difficulty;
    }

    public function setDifficulty(?DifficultyType $difficulty): static
    {
        $this->difficulty = $difficulty;
        return $this;
    }

    public function getDifficultyString(): ?string
    {
        return match ($this->difficulty) {
            DifficultyType::Facile => 'Facile',
            DifficultyType::Modere => 'Modéré',
            DifficultyType::Difficile => 'Difficile',
            DifficultyType::Expert => 'Expert',
            default => null,
        };
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getLocation(): ?string
    {
        return $this->location;
    }

    public function setLocation(?string $location): static
    {
        $this->location = $location;
        return $this;
    }

    public function getLatitude(): ?float
    {
        return $this->latitude;
    }

    public function setLatitude(?float $latitude): static
    {
        $this->latitude = $latitude;
        return $this;
    }

    public function getLongitude(): ?float
    {
        return $this->longitude;
    }

    public function setLongitude(?float $longitude): static
    {
        $this->longitude = $longitude;
        return $this;
    }

    public function getDistanceKm(): ?float
    {
        return $this->distanceKm;
    }

    public function setDistanceKm(?float $distanceKm): static
    {
        $this->distanceKm = $distanceKm;
        return $this;
    }

    public function getElevationGainM(): ?int
    {
        return $this->elevationGainM;
    }

    public function setElevationGainM(?int $elevationGainM): static
    {
        $this->elevationGainM = $elevationGainM;
        return $this;
    }

    public function getAltitudeMaxM(): ?int
    {
        return $this->altitudeMaxM;
    }

    public function setAltitudeMaxM(?int $altitudeMaxM): static
    {
        $this->altitudeMaxM = $altitudeMaxM;
        return $this;
    }

    public function getDurationMinutes(): ?int
    {
        return $this->durationMinutes;
    }

    public function setDurationMinutes(?int $durationMinutes): static
    {
        $this->durationMinutes = $durationMinutes;
        return $this;
    }

    public function getPointsOfInterest(): array
    {
        return $this->pointsOfInterest;
    }

    public function setPointsOfInterest(array $pointsOfInterest): static
    {
        $this->pointsOfInterest = $pointsOfInterest;
        return $this;
    }

    public function getPhotoUrls(): array
    {
        return $this->photoUrls;
    }

    public function setPhotoUrls(array $photoUrls): static
    {
        $this->photoUrls = $photoUrls;
        return $this;
    }

    public function getSourceUrl(): ?string
    {
        return $this->sourceUrl;
    }

    public function setSourceUrl(?string $sourceUrl): static
    {
        $this->sourceUrl = $sourceUrl;
        return $this;
    }

    public function getParkRules(): ?string
    {
        return $this->parkRules;
    }

    public function setParkRules(?string $parkRules): static
    {
        $this->parkRules = $parkRules;
        return $this;
    }

    public function getTravelTimeFromPeyrollesMinutes(): ?int
    {
        return $this->travelTimeFromPeyrollesMinutes;
    }

    public function setTravelTimeFromPeyrollesMinutes(?int $travelTimeFromPeyrollesMinutes): static
    {
        $this->travelTimeFromPeyrollesMinutes = $travelTimeFromPeyrollesMinutes;
        return $this;
    }

    public function getTravelBudget(): ?float
    {
        return $this->travelBudget !== null ? $this->travelBudget / 100 : null;
    }

    public function setTravelBudget(?float $travelBudget): static
    {
        $this->travelBudget = $travelBudget !== null ? (int) round($travelBudget * 100) : null;
        return $this;
    }

    public function getRandoBudget(): ?float
    {
        return $this->randoBudget !== null ? $this->randoBudget / 100 : null;
    }

    public function setRandoBudget(?float $randoBudget): static
    {
        $this->randoBudget = $randoBudget !== null ? (int) round($randoBudget * 100) : null;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }
}
