<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Table MLD : utilisateur. Compte unique avec rôles (ROLE_USER, ROLE_COACH, ROLE_MANAGER, ROLE_ADMIN).
 */
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'utilisateur')]
#[ORM\UniqueConstraint(name: 'uniq_utilisateur_email', columns: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private string $email;

    #[ORM\Column(name: 'mot_de_passe', length: 255)]
    private string $password;

    #[ORM\Column(name: 'nom', length: 100)]
    private string $lastName;

    #[ORM\Column(name: 'prenom', length: 100)]
    private string $firstName;

    #[ORM\Column(name: 'telephone', length: 20, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(name: 'avatar_url', length: 255, nullable: true)]
    private ?string $avatarUrl = null;

    /** @var string[] */
    #[ORM\Column(type: Types::JSON)]
    private array $roles = [];

    #[ORM\Column(name: 'est_verifie')]
    private bool $isVerified = false;

    #[ORM\Column(name: 'est_actif')]
    private bool $isActive = true;

    #[ORM\Column(name: 'date_creation', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'token_verification', length: 64, nullable: true)]
    private ?string $verificationToken = null;

    #[ORM\Column(name: 'token_verification_expire', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $verificationTokenExpiresAt = null;

    #[ORM\Column(name: 'token_reset', length: 64, nullable: true)]
    private ?string $resetToken = null;

    #[ORM\Column(name: 'token_reset_expire', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $resetTokenExpiresAt = null;

    #[ORM\OneToOne(mappedBy: 'user', targetEntity: Coach::class, cascade: ['persist', 'remove'])]
    private ?Coach $coach = null;

    /** @var Collection<int, Gym> */
    #[ORM\OneToMany(mappedBy: 'manager', targetEntity: Gym::class)]
    private Collection $gyms;

    /** @var Collection<int, Booking> */
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Booking::class, cascade: ['remove'])]
    private Collection $bookings;

    /** @var Collection<int, Review> */
    #[ORM\OneToMany(mappedBy: 'author', targetEntity: Review::class, cascade: ['remove'])]
    private Collection $reviews;

    /** @var Collection<int, Notification> */
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Notification::class, cascade: ['remove'])]
    private Collection $notifications;

    /** @var Collection<int, FavoriteGym> */
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: FavoriteGym::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $favoriteGyms;

    /** @var Collection<int, FavoriteCoach> */
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: FavoriteCoach::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $favoriteCoaches;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->gyms = new ArrayCollection();
        $this->bookings = new ArrayCollection();
        $this->reviews = new ArrayCollection();
        $this->notifications = new ArrayCollection();
        $this->favoriteGyms = new ArrayCollection();
        $this->favoriteCoaches = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): static { $this->email = mb_strtolower(trim($email)); return $this; }

    public function getUserIdentifier(): string { return $this->email; }

    public function getPassword(): string { return $this->password; }
    public function setPassword(string $password): static { $this->password = $password; return $this; }

    public function getLastName(): string { return $this->lastName; }
    public function setLastName(string $lastName): static { $this->lastName = $lastName; return $this; }

    public function getFirstName(): string { return $this->firstName; }
    public function setFirstName(string $firstName): static { $this->firstName = $firstName; return $this; }

    public function getFullName(): string { return trim($this->firstName.' '.$this->lastName); }

    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $phone): static { $this->phone = $phone; return $this; }

    public function getAvatarUrl(): ?string { return $this->avatarUrl; }
    public function setAvatarUrl(?string $avatarUrl): static { $this->avatarUrl = $avatarUrl; return $this; }

    /** @return string[] */
    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';

        return array_values(array_unique($roles));
    }

    /** @param string[] $roles */
    public function setRoles(array $roles): static { $this->roles = array_values(array_unique($roles)); return $this; }

    public function hasRole(string $role): bool { return \in_array($role, $this->getRoles(), true); }

    public function isVerified(): bool { return $this->isVerified; }
    public function setIsVerified(bool $isVerified): static { $this->isVerified = $isVerified; return $this; }

    public function isActive(): bool { return $this->isActive; }
    public function setIsActive(bool $isActive): static { $this->isActive = $isActive; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function getVerificationToken(): ?string { return $this->verificationToken; }
    public function setVerificationToken(?string $token, ?\DateTimeImmutable $expiresAt): static
    {
        $this->verificationToken = $token;
        $this->verificationTokenExpiresAt = $expiresAt;

        return $this;
    }
    public function getVerificationTokenExpiresAt(): ?\DateTimeImmutable { return $this->verificationTokenExpiresAt; }

    public function getResetToken(): ?string { return $this->resetToken; }
    public function setResetToken(?string $token, ?\DateTimeImmutable $expiresAt): static
    {
        $this->resetToken = $token;
        $this->resetTokenExpiresAt = $expiresAt;

        return $this;
    }
    public function getResetTokenExpiresAt(): ?\DateTimeImmutable { return $this->resetTokenExpiresAt; }

    public function getCoach(): ?Coach { return $this->coach; }
    public function setCoach(?Coach $coach): static
    {
        $this->coach = $coach;
        $coach?->setUser($this);

        return $this;
    }

    /** @return Collection<int, Gym> */
    public function getGyms(): Collection { return $this->gyms; }

    /** @return Collection<int, Booking> */
    public function getBookings(): Collection { return $this->bookings; }

    /** @return Collection<int, Review> */
    public function getReviews(): Collection { return $this->reviews; }

    /** @return Collection<int, Notification> */
    public function getNotifications(): Collection { return $this->notifications; }

    /** @return Collection<int, FavoriteGym> */
    public function getFavoriteGyms(): Collection { return $this->favoriteGyms; }

    /** @return Collection<int, FavoriteCoach> */
    public function getFavoriteCoaches(): Collection { return $this->favoriteCoaches; }

    public function hasFavoriteGym(Gym $gym): bool
    {
        foreach ($this->favoriteGyms as $fav) {
            if ($fav->getGym() === $gym) {
                return true;
            }
        }

        return false;
    }

    public function hasFavoriteCoach(Coach $coach): bool
    {
        foreach ($this->favoriteCoaches as $fav) {
            if ($fav->getCoach() === $coach) {
                return true;
            }
        }

        return false;
    }

    public function eraseCredentials(): void
    {
    }
}
