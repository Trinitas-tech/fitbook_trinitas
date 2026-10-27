<?php

namespace App\Entity;

use App\Enum\ReviewStatus;
use App\Repository\CoachRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Table MLD : coach (profil professionnel lié 1-1 à un utilisateur). */
#[ORM\Entity(repositoryClass: CoachRepository::class)]
#[ORM\Table(name: 'coach')]
class Coach
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'specialite', length: 100, nullable: true)]
    private ?string $specialty = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $bio = null;

    #[ORM\Column(name: 'tarif_horaire', type: Types::DECIMAL, precision: 8, scale: 2, nullable: true)]
    private ?string $hourlyRate = null;

    #[ORM\Column(name: 'ville', length: 100, nullable: true)]
    private ?string $city = null;

    #[ORM\Column(name: 'est_valide')]
    private bool $isValidated = false;

    #[ORM\OneToOne(inversedBy: 'coach', targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'utilisateur_id', nullable: false, unique: true, onDelete: 'CASCADE')]
    private User $user;

    /** @var Collection<int, Availability> */
    #[ORM\OneToMany(mappedBy: 'coach', targetEntity: Availability::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['dayOfWeek' => 'ASC', 'startsAt' => 'ASC'])]
    private Collection $availabilities;

    /** @var Collection<int, Course> */
    #[ORM\OneToMany(mappedBy: 'coach', targetEntity: Course::class)]
    private Collection $courses;

    /** @var Collection<int, Session> */
    #[ORM\OneToMany(mappedBy: 'coach', targetEntity: Session::class)]
    private Collection $sessions;

    /** @var Collection<int, Review> */
    #[ORM\OneToMany(mappedBy: 'coach', targetEntity: Review::class)]
    private Collection $reviews;

    public function __construct()
    {
        $this->availabilities = new ArrayCollection();
        $this->courses = new ArrayCollection();
        $this->sessions = new ArrayCollection();
        $this->reviews = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getSpecialty(): ?string { return $this->specialty; }
    public function setSpecialty(?string $specialty): static { $this->specialty = $specialty; return $this; }

    public function getBio(): ?string { return $this->bio; }
    public function setBio(?string $bio): static { $this->bio = $bio; return $this; }

    public function getHourlyRate(): ?string { return $this->hourlyRate; }
    public function setHourlyRate(?string $hourlyRate): static { $this->hourlyRate = $hourlyRate; return $this; }

    public function getCity(): ?string { return $this->city; }
    public function setCity(?string $city): static { $this->city = $city; return $this; }

    public function isValidated(): bool { return $this->isValidated; }
    public function setIsValidated(bool $isValidated): static { $this->isValidated = $isValidated; return $this; }

    public function getUser(): User { return $this->user; }
    public function setUser(User $user): static { $this->user = $user; return $this; }

    /** Profil complet = visible dans la recherche (US-30). */
    public function isComplete(): bool
    {
        return $this->specialty !== null && $this->specialty !== ''
            && $this->hourlyRate !== null
            && $this->city !== null && $this->city !== '';
    }

    public function isPublic(): bool { return $this->isComplete() && $this->isValidated && $this->user->isActive(); }

    /** @return Collection<int, Availability> */
    public function getAvailabilities(): Collection { return $this->availabilities; }
    public function addAvailability(Availability $availability): static
    {
        if (!$this->availabilities->contains($availability)) {
            $this->availabilities->add($availability);
            $availability->setCoach($this);
        }

        return $this;
    }
    public function clearAvailabilities(): static { $this->availabilities->clear(); return $this; }

    /** Une séance est-elle contenue dans une disponibilité déclarée ? (US-32) */
    public function isAvailable(\DateTimeInterface $start, \DateTimeInterface $end): bool
    {
        if ($start->format('Y-m-d') !== $end->format('Y-m-d')) {
            return false;
        }
        $day = (int) $start->format('N');
        $from = $start->format('H:i');
        $to = $end->format('H:i');
        foreach ($this->availabilities as $a) {
            if ($a->getDayOfWeek() === $day && $a->getStartsAt()->format('H:i') <= $from && $a->getEndsAt()->format('H:i') >= $to) {
                return true;
            }
        }

        return false;
    }

    /** @return Collection<int, Course> */
    public function getCourses(): Collection { return $this->courses; }

    /** @return Collection<int, Session> */
    public function getSessions(): Collection { return $this->sessions; }

    /** @return Collection<int, Review> */
    public function getReviews(): Collection { return $this->reviews; }

    /** @return Review[] */
    public function getApprovedReviews(): array
    {
        return array_values(array_filter($this->reviews->toArray(), static fn (Review $r) => $r->getStatus() === ReviewStatus::APPROUVE));
    }

    /** Note moyenne sur les avis approuvés, arrondie à 1 décimale (US-62). */
    public function getAverageRating(): ?float
    {
        $reviews = $this->getApprovedReviews();
        if ($reviews === []) {
            return null;
        }

        return round(array_sum(array_map(static fn (Review $r) => $r->getRating(), $reviews)) / \count($reviews), 1);
    }
}
