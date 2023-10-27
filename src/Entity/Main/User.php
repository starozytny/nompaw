<?php

namespace App\Entity\Main;

use App\Entity\Birthday\BiBirthday;
use App\Entity\Birthday\BiPresent;
use App\Entity\Budget\BuCategory;
use App\Entity\Budget\BuItem;
use App\Entity\Cook\CoCommentary;
use App\Entity\Cook\CoFavorite;
use App\Entity\Cook\CoRecipe;
use App\Entity\DataEntity;
use App\Entity\Holiday\HoProject;
use App\Entity\Holiday\HoPropalActivity;
use App\Entity\Holiday\HoPropalDate;
use App\Entity\Holiday\HoPropalHouse;
use App\Entity\Rando\RaGroupe;
use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaLink;
use App\Entity\Rando\RaPropalAdventure;
use App\Entity\Rando\RaPropalDate;
use App\Entity\Rando\RaRando;
use App\Repository\Main\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Exception;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: UserRepository::class)]
class User extends DataEntity implements UserInterface, PasswordAuthenticatedUserInterface
{
    const FOLDER = "avatars";

    const LIST   = ['user_list'];
    const FORM   = ['user_form'];
    const SELECT = ['user_select'];

    const CODE_ROLE_USER = 0;
    const CODE_ROLE_DEVELOPER = 1;
    const CODE_ROLE_ADMIN = 2;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups([
        'user_list', 'user_form', 'com_read', 'user_select',
        'pr_date_list', 'pr_house_list', 'pr_act_list',
        'ra_img_list', 'rando_form', 'bi_present_list'
    ])]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Groups(['user_list', 'user_form', 'com_read', 'user_select', 'ra_img_list'])]
    private ?string $username = null;

    #[ORM\Column(length: 180)]
    #[Groups(['user_list', 'user_form', 'com_read', 'user_select', 'ra_img_list', 'bi_present_list'])]
    private ?string $displayName = null;

    #[ORM\Column]
    #[Groups(['user_form'])]
    private array $roles = ["ROLE_USER"];

    /**
     * @var string The hashed password
     */
    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 255)]
    #[Groups(['user_list', 'user_form'])]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    #[Groups(['user_list', 'user_form', 'com_read', 'user_select', 'ra_img_list'])]
    private ?string $lastname = null;

    #[ORM\Column(length: 255)]
    #[Groups(['user_list', 'user_form', 'com_read', 'user_select', 'ra_img_list'])]
    private ?string $firstname = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTime $updatedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['user_list'])]
    private ?\DateTime $lastLoginAt = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $lostCode = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTime $lostAt = null;

    #[ORM\Column(length: 255)]
    #[Groups(['user_list'])]
    private ?string $token = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $avatar = null;

    #[ORM\Column(length: 40)]
    #[Groups(['user_list'])]
    private ?string $manager = "default";

    #[ORM\ManyToOne(inversedBy: 'users')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['user_list', 'user_form'])]
    private ?Society $society = null;

    #[ORM\Column]
    #[Groups(['user_list'])]
    private ?bool $blocked = false;


    #[ORM\Column(nullable: true)]
    private ?string $googleId = null;

    #[ORM\Column(nullable: true)]
    private ?string $facebookId = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $googleAccessToken = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $googleRefreshToken = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTime $googleTokenExpiresAt = null;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: CoRecipe::class)]
    private Collection $coRecipes;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: CoCommentary::class)]
    private Collection $coCommentaries;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: CoFavorite::class)]
    private Collection $coFavorites;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: RaLink::class)]
    private Collection $roLinks;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: RaGroupe::class)]
    private Collection $roGroupes;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: RaRando::class)]
    private Collection $raRandos;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: RaPropalDate::class)]
    private Collection $raPropalDates;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: RaPropalAdventure::class)]
    private Collection $raPropalAdventures;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: RaImage::class)]
    private Collection $raImages;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: HoProject::class)]
    private Collection $hoProjects;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: HoPropalDate::class)]
    private Collection $hoPropalDates;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: HoPropalHouse::class)]
    private Collection $hoPropalHouses;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: HoPropalActivity::class)]
    private Collection $hoPropalActivities;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: BiBirthday::class)]
    private Collection $biBirthdays;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: BiPresent::class)]
    private Collection $biPresents;

    #[ORM\OneToMany(mappedBy: 'guest', targetEntity: BiPresent::class)]
    private Collection $buyPresents;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: BuItem::class)]
    private Collection $buItems;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: BuCategory::class)]
    private Collection $buCategories;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Mail::class)]
    private Collection $mails;

    #[ORM\Column(nullable: true)]
    private ?int $budgetYear = null;

    #[ORM\Column(nullable: true)]
    private ?float $budgetInit = null;

    /**
     * @throws Exception
     */
    public function __construct()
    {
        $this->createdAt = $this->initNewDateImmutable();
        $this->token = $this->initToken();
        $this->coRecipes = new ArrayCollection();
        $this->coCommentaries = new ArrayCollection();
        $this->coFavorites = new ArrayCollection();
        $this->roLinks = new ArrayCollection();
        $this->roGroupes = new ArrayCollection();
        $this->raRandos = new ArrayCollection();
        $this->raPropalDates = new ArrayCollection();
        $this->raPropalAdventures = new ArrayCollection();
        $this->raImages = new ArrayCollection();
        $this->hoProjects = new ArrayCollection();
        $this->hoPropalDates = new ArrayCollection();
        $this->hoPropalHouses = new ArrayCollection();
        $this->hoPropalActivities = new ArrayCollection();
        $this->biBirthdays = new ArrayCollection();
        $this->biPresents = new ArrayCollection();
        $this->buyPresents = new ArrayCollection();
        $this->buItems = new ArrayCollection();
        $this->buCategories = new ArrayCollection();
        $this->mails = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): self
    {
        $this->username = $username;

        return $this;
    }

    public function getDisplayName(): ?string
    {
        return $this->displayName;
    }

    public function setDisplayName(string $displayName): self
    {
        $this->displayName = $displayName;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->username;
    }

    /**
     * @see UserInterface
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return $this->isBlocked() ? ['ROLE_BLOCKED'] : array_unique($roles);
    }

    #[Groups(['user_list'])]
    public function getHighRole(): string
    {
        $rolesSortedByImportance = ['ROLE_DEVELOPER', 'ROLE_ADMIN', 'ROLE_USER'];
        $rolesLabel = ['Développeur', 'Administrateur', 'Utilisateur'];
        $i = 0;
        foreach ($rolesSortedByImportance as $role)
        {
            if (in_array($role, $this->roles)) return $rolesLabel[$i];
            $i++;
        }

        return $this->isBlocked() ? "Bloqué" : "Utilisateur";
    }

    #[Groups(['user_list'])]
    public function getHighRoleCode(): int
    {
        return match ($this->getHighRole()) {
            'Développeur' => self::CODE_ROLE_DEVELOPER,
            'Administrateur' => self::CODE_ROLE_ADMIN,
            default => self::CODE_ROLE_USER,
        };
    }

    public function setRoles(array $roles): self
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): self
    {
        $this->password = $password;

        return $this;
    }

    /**
     * @see UserInterface
     */
    public function eraseCredentials()
    {
        // If you store any temporary, sensitive data on the user, clear it here
        // $this->plainPassword = null;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = $email;

        return $this;
    }

    public function getHiddenEmail(): string
    {
        $email = $this->getEmail();
        $at = strpos($email, "@");
        $domain = substr($email, $at, strlen($email));
        $firstLetter = substr($email, 0, 1);
        $etoiles = "";
        for($i=1 ; $i < $at ; $i++){
            $etoiles .= "*";
        }
        return $firstLetter . $etoiles . $domain;
    }

    public function getLastname(): ?string
    {
        return $this->lastname;
    }

    public function setLastname(string $lastname): self
    {
        $this->lastname = $lastname;

        return $this;
    }

    public function getFirstname(): ?string
    {
        return $this->firstname;
    }

    public function setFirstname(string $firstname): self
    {
        $this->firstname = $firstname;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTime
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTime $updatedAt): self
    {
        $updatedAt->setTimezone(new \DateTimeZone("Europe/Paris"));
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getLastLoginAt(): ?\DateTime
    {
        return $this->lastLoginAt;
    }

    public function setLastLoginAt(?\DateTime $lastLoginAt): self
    {
        $lastLoginAt->setTimezone(new \DateTimeZone("Europe/Paris"));
        $this->lastLoginAt = $lastLoginAt;

        return $this;
    }

    public function getLostCode(): ?string
    {
        return $this->lostCode;
    }

    public function setLostCode(?string $lostCode): self
    {
        $this->lostCode = $lostCode;

        return $this;
    }

    public function getLostAt(): ?\DateTime
    {
        return $this->lostAt;
    }

    public function setLostAt(?\DateTime $lostAt): self
    {
        $this->lostAt = $lostAt;

        return $this;
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function setToken(string $token): self
    {
        $this->token = $token;

        return $this;
    }

    public function getAvatar(): ?string
    {
        return $this->avatar;
    }

    public function setAvatar(?string $avatar): self
    {
        $this->avatar = $avatar;

        return $this;
    }

    #[Groups(['user_list', 'user_form', 'com_read', 'user_select', 'ra_img_list'])]
    public function getAvatarFile(): ?string
    {
        return $this->getFileOrDefault($this->avatar, self::FOLDER, null);
    }

    public function getManager(): ?string
    {
        return $this->manager;
    }

    public function setManager(string $manager): self
    {
        $this->manager = $manager;

        return $this;
    }

    public function getSociety(): ?Society
    {
        return $this->society;
    }

    public function setSociety(?Society $society): self
    {
        $this->society = $society;

        return $this;
    }

    public function isBlocked(): ?bool
    {
        return $this->blocked;
    }

    public function setBlocked(bool $blocked): self
    {
        $this->blocked = $blocked;

        return $this;
    }

    /**
     * @return Collection<int, CoRecipe>
     */
    public function getCoRecipes(): Collection
    {
        return $this->coRecipes;
    }

    public function addCoRecipe(CoRecipe $coRecipe): self
    {
        if (!$this->coRecipes->contains($coRecipe)) {
            $this->coRecipes->add($coRecipe);
            $coRecipe->setAuthor($this);
        }

        return $this;
    }

    public function removeCoRecipe(CoRecipe $coRecipe): self
    {
        if ($this->coRecipes->removeElement($coRecipe)) {
            // set the owning side to null (unless already changed)
            if ($coRecipe->getAuthor() === $this) {
                $coRecipe->setAuthor(null);
            }
        }

        return $this;
    }

    public function isAdmin(): bool
    {
        return $this->getHighRoleCode() == self::CODE_ROLE_DEVELOPER || $this->getHighRoleCode() == self::CODE_ROLE_ADMIN;
    }

    /**
     * @return Collection<int, CoCommentary>
     */
    public function getCoCommentaries(): Collection
    {
        return $this->coCommentaries;
    }

    public function addCoCommentary(CoCommentary $coCommentary): self
    {
        if (!$this->coCommentaries->contains($coCommentary)) {
            $this->coCommentaries->add($coCommentary);
            $coCommentary->setUser($this);
        }

        return $this;
    }

    public function removeCoCommentary(CoCommentary $coCommentary): self
    {
        if ($this->coCommentaries->removeElement($coCommentary)) {
            // set the owning side to null (unless already changed)
            if ($coCommentary->getUser() === $this) {
                $coCommentary->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, CoFavorite>
     */
    public function getCoFavorites(): Collection
    {
        return $this->coFavorites;
    }

    public function addCoFavorite(CoFavorite $coFavorite): self
    {
        if (!$this->coFavorites->contains($coFavorite)) {
            $this->coFavorites->add($coFavorite);
            $coFavorite->setUser($this);
        }

        return $this;
    }

    public function removeCoFavorite(CoFavorite $coFavorite): self
    {
        if ($this->coFavorites->removeElement($coFavorite)) {
            // set the owning side to null (unless already changed)
            if ($coFavorite->getUser() === $this) {
                $coFavorite->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, RaLink>
     */
    public function getRoLinks(): Collection
    {
        return $this->roLinks;
    }

    public function addRoLink(RaLink $roLink): self
    {
        if (!$this->roLinks->contains($roLink)) {
            $this->roLinks->add($roLink);
            $roLink->setUser($this);
        }

        return $this;
    }

    public function removeRoLink(RaLink $roLink): self
    {
        if ($this->roLinks->removeElement($roLink)) {
            // set the owning side to null (unless already changed)
            if ($roLink->getUser() === $this) {
                $roLink->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, RaGroupe>
     */
    public function getRoGroupes(): Collection
    {
        return $this->roGroupes;
    }

    public function addRoGroupe(RaGroupe $roGroupe): self
    {
        if (!$this->roGroupes->contains($roGroupe)) {
            $this->roGroupes->add($roGroupe);
            $roGroupe->setAuthor($this);
        }

        return $this;
    }

    public function removeRoGroupe(RaGroupe $roGroupe): self
    {
        if ($this->roGroupes->removeElement($roGroupe)) {
            // set the owning side to null (unless already changed)
            if ($roGroupe->getAuthor() === $this) {
                $roGroupe->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, RaRando>
     */
    public function getRaRandos(): Collection
    {
        return $this->raRandos;
    }

    public function addRaRando(RaRando $raRando): self
    {
        if (!$this->raRandos->contains($raRando)) {
            $this->raRandos->add($raRando);
            $raRando->setAuthor($this);
        }

        return $this;
    }

    public function removeRaRando(RaRando $raRando): self
    {
        if ($this->raRandos->removeElement($raRando)) {
            // set the owning side to null (unless already changed)
            if ($raRando->getAuthor() === $this) {
                $raRando->setAuthor(null);
            }
        }

        return $this;
    }

    public function getGoogleAccessToken(): ?string
    {
        return $this->googleAccessToken;
    }

    public function setGoogleAccessToken(?string $googleAccessToken): self
    {
        $this->googleAccessToken = $googleAccessToken;

        return $this;
    }

    public function getGoogleRefreshToken(): ?string
    {
        return $this->googleRefreshToken;
    }

    public function setGoogleRefreshToken(?string $googleRefreshToken): self
    {
        $this->googleRefreshToken = $googleRefreshToken;

        return $this;
    }

    public function getGoogleTokenExpiresAt(): ?\DateTime
    {
        return $this->googleTokenExpiresAt;
    }

    public function setGoogleTokenExpiresAt(?\DateTime $googleTokenExpiresAt): self
    {
        $this->googleTokenExpiresAt = $googleTokenExpiresAt;

        return $this;
    }

    public function getGoogleId(): ?string
    {
        return $this->googleId;
    }

    public function setGoogleId(?string $googleId): self
    {
        $this->googleId = $googleId;

        return $this;
    }

    public function getFacebookId(): ?string
    {
        return $this->facebookId;
    }

    public function setFacebookId(?string $facebookId): self
    {
        $this->facebookId = $facebookId;

        return $this;
    }

    /**
     * @return Collection<int, RaPropalDate>
     */
    public function getRaPropalDates(): Collection
    {
        return $this->raPropalDates;
    }

    public function addRaPropalDate(RaPropalDate $raPropalDate): self
    {
        if (!$this->raPropalDates->contains($raPropalDate)) {
            $this->raPropalDates->add($raPropalDate);
            $raPropalDate->setAuthor($this);
        }

        return $this;
    }

    public function removeRaPropalDate(RaPropalDate $raPropalDate): self
    {
        if ($this->raPropalDates->removeElement($raPropalDate)) {
            // set the owning side to null (unless already changed)
            if ($raPropalDate->getAuthor() === $this) {
                $raPropalDate->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, RaPropalAdventure>
     */
    public function getRaPropalAdventures(): Collection
    {
        return $this->raPropalAdventures;
    }

    public function addRaPropalAdventure(RaPropalAdventure $raPropalAdventure): self
    {
        if (!$this->raPropalAdventures->contains($raPropalAdventure)) {
            $this->raPropalAdventures->add($raPropalAdventure);
            $raPropalAdventure->setAuthor($this);
        }

        return $this;
    }

    public function removeRaPropalAdventure(RaPropalAdventure $raPropalAdventure): self
    {
        if ($this->raPropalAdventures->removeElement($raPropalAdventure)) {
            // set the owning side to null (unless already changed)
            if ($raPropalAdventure->getAuthor() === $this) {
                $raPropalAdventure->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, RaImage>
     */
    public function getRaImages(): Collection
    {
        return $this->raImages;
    }

    public function addRaImage(RaImage $raImage): self
    {
        if (!$this->raImages->contains($raImage)) {
            $this->raImages->add($raImage);
            $raImage->setAuthor($this);
        }

        return $this;
    }

    public function removeRaImage(RaImage $raImage): self
    {
        if ($this->raImages->removeElement($raImage)) {
            // set the owning side to null (unless already changed)
            if ($raImage->getAuthor() === $this) {
                $raImage->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, HoProject>
     */
    public function getHoProjects(): Collection
    {
        return $this->hoProjects;
    }

    public function addHoProject(HoProject $hoProject): self
    {
        if (!$this->hoProjects->contains($hoProject)) {
            $this->hoProjects->add($hoProject);
            $hoProject->setAuthor($this);
        }

        return $this;
    }

    public function removeHoProject(HoProject $hoProject): self
    {
        if ($this->hoProjects->removeElement($hoProject)) {
            // set the owning side to null (unless already changed)
            if ($hoProject->getAuthor() === $this) {
                $hoProject->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, HoPropalDate>
     */
    public function getHoPropalDates(): Collection
    {
        return $this->hoPropalDates;
    }

    public function addHoPropalDate(HoPropalDate $hoPropalDate): self
    {
        if (!$this->hoPropalDates->contains($hoPropalDate)) {
            $this->hoPropalDates->add($hoPropalDate);
            $hoPropalDate->setAuthor($this);
        }

        return $this;
    }

    public function removeHoPropalDate(HoPropalDate $hoPropalDate): self
    {
        if ($this->hoPropalDates->removeElement($hoPropalDate)) {
            // set the owning side to null (unless already changed)
            if ($hoPropalDate->getAuthor() === $this) {
                $hoPropalDate->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, HoPropalHouse>
     */
    public function getHoPropalHouses(): Collection
    {
        return $this->hoPropalHouses;
    }

    public function addHoPropalHouse(HoPropalHouse $hoPropalHouse): self
    {
        if (!$this->hoPropalHouses->contains($hoPropalHouse)) {
            $this->hoPropalHouses->add($hoPropalHouse);
            $hoPropalHouse->setAuthor($this);
        }

        return $this;
    }

    public function removeHoPropalHouse(HoPropalHouse $hoPropalHouse): self
    {
        if ($this->hoPropalHouses->removeElement($hoPropalHouse)) {
            // set the owning side to null (unless already changed)
            if ($hoPropalHouse->getAuthor() === $this) {
                $hoPropalHouse->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, HoPropalActivity>
     */
    public function getHoPropalActivities(): Collection
    {
        return $this->hoPropalActivities;
    }

    public function addHoPropalActivity(HoPropalActivity $hoPropalActivity): self
    {
        if (!$this->hoPropalActivities->contains($hoPropalActivity)) {
            $this->hoPropalActivities->add($hoPropalActivity);
            $hoPropalActivity->setAuthor($this);
        }

        return $this;
    }

    public function removeHoPropalActivity(HoPropalActivity $hoPropalActivity): self
    {
        if ($this->hoPropalActivities->removeElement($hoPropalActivity)) {
            // set the owning side to null (unless already changed)
            if ($hoPropalActivity->getAuthor() === $this) {
                $hoPropalActivity->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, BiBirthday>
     */
    public function getBiBirthdays(): Collection
    {
        return $this->biBirthdays;
    }

    public function addBiBirthday(BiBirthday $biBirthday): self
    {
        if (!$this->biBirthdays->contains($biBirthday)) {
            $this->biBirthdays->add($biBirthday);
            $biBirthday->setAuthor($this);
        }

        return $this;
    }

    public function removeBiBirthday(BiBirthday $biBirthday): self
    {
        if ($this->biBirthdays->removeElement($biBirthday)) {
            // set the owning side to null (unless already changed)
            if ($biBirthday->getAuthor() === $this) {
                $biBirthday->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, BiPresent>
     */
    public function getBiPresents(): Collection
    {
        return $this->biPresents;
    }

    public function addBiPresent(BiPresent $biPresent): self
    {
        if (!$this->biPresents->contains($biPresent)) {
            $this->biPresents->add($biPresent);
            $biPresent->setAuthor($this);
        }

        return $this;
    }

    public function removeBiPresent(BiPresent $biPresent): self
    {
        if ($this->biPresents->removeElement($biPresent)) {
            // set the owning side to null (unless already changed)
            if ($biPresent->getAuthor() === $this) {
                $biPresent->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, BiPresent>
     */
    public function getBuyPresents(): Collection
    {
        return $this->buyPresents;
    }

    public function addBuyPresent(BiPresent $buyPresent): self
    {
        if (!$this->buyPresents->contains($buyPresent)) {
            $this->buyPresents->add($buyPresent);
            $buyPresent->setGuest($this);
        }

        return $this;
    }

    public function removeBuyPresent(BiPresent $buyPresent): self
    {
        if ($this->buyPresents->removeElement($buyPresent)) {
            // set the owning side to null (unless already changed)
            if ($buyPresent->getGuest() === $this) {
                $buyPresent->setGuest(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, BuItem>
     */
    public function getBuItems(): Collection
    {
        return $this->buItems;
    }

    public function addBuItem(BuItem $buItem): static
    {
        if (!$this->buItems->contains($buItem)) {
            $this->buItems->add($buItem);
            $buItem->setUser($this);
        }

        return $this;
    }

    public function removeBuItem(BuItem $buItem): static
    {
        if ($this->buItems->removeElement($buItem)) {
            // set the owning side to null (unless already changed)
            if ($buItem->getUser() === $this) {
                $buItem->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, BuCategory>
     */
    public function getBuCategories(): Collection
    {
        return $this->buCategories;
    }

    public function addBuCategory(BuCategory $buCategory): static
    {
        if (!$this->buCategories->contains($buCategory)) {
            $this->buCategories->add($buCategory);
            $buCategory->setUser($this);
        }

        return $this;
    }


    public function removeBuCategory(BuCategory $buCategory): static
    {
        if ($this->buCategories->removeElement($buCategory)) {
            // set the owning side to null (unless already changed)
            if ($buCategory->getUser() === $this) {
                $buCategory->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Mail>
     */
    public function getMails(): Collection
    {
        return $this->mails;
    }

    public function addMail(Mail $mail): static
    {
        if (!$this->mails->contains($mail)) {
            $this->mails->add($mail);
            $mail->setUser($this);
        }

        return $this;
    }

    public function removeMail(Mail $mail): static
    {
        if ($this->mails->removeElement($mail)) {
            // set the owning side to null (unless already changed)
            if ($mail->getUser() === $this) {
                $mail->setUser(null);
            }
        }

        return $this;
    }

    public function getBudgetYear(): ?int
    {
        return $this->budgetYear;
    }

    public function setBudgetYear(?int $budgetYear): static
    {
        $this->budgetYear = $budgetYear;

        return $this;
    }

    public function getBudgetInit(): ?float
    {
        return $this->budgetInit;
    }

    public function setBudgetInit(?float $budgetInit): static
    {
        $this->budgetInit = $budgetInit;

        return $this;
    }
}
