<?php

namespace App\Entity\Main;

use App\Entity\Cook\CoCommentary;
use App\Entity\Cook\CoFavorite;
use App\Entity\Cook\CoRecipe;
use App\Entity\DataEntity;
use App\Entity\Rando\RaGroupe;
use App\Entity\Rando\RaLink;
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
    #[Groups(['user_list', 'user_form', 'com_read', 'user_select'])]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Groups(['user_list', 'user_form', 'com_read', 'user_select'])]
    private ?string $username = null;

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
    #[Groups(['user_list', 'user_form', 'com_read', 'user_select'])]
    private ?string $lastname = null;

    #[ORM\Column(length: 255)]
    #[Groups(['user_list', 'user_form', 'com_read', 'user_select'])]
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

    #[Groups(['user_list', 'user_form', 'com_read', 'user_select'])]
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
}
