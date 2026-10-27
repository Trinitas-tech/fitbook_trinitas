<?php

namespace App\Entity;

use App\Enum\BookingStatus;
use App\Enum\SessionStatus;
use App\Repository\SessionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Table MLD : seance (occurrence datée et réservable).
 * Contrainte XOR : liée à un cours (séance collective) OU à un coach (coaching privé).
 */
#[ORM\Entity(repositoryClass: SessionRepository::class)]
#[ORM\Table(name: 'seance')]
#[ORM\Index(name: 'idx_seance_date_debut', columns: ['date_debut'])]
class Session
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'date_debut', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $startAt;

    #[ORM\Column(name: 'date_fin', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $endAt;

    #[ORM\Column(name: 'capacite')]
    private int $capacity = 1;

    #[ORM\Column(name: 'prix', type: Types::DECIMAL, precision: 8, scale: 2)]
    private string $price = '0.00';

    #[ORM\Column(name: 'statut', length: 20, enumType: SessionStatus::class)]
    private SessionStatus $status = SessionStatus::PLANIFIEE;

    #[ORM\Column(name: 'lieu', length: 255, nullable: true)]
    private ?string $location = null;

    #[ORM\ManyToOne(targetEntity: Course::class, inversedBy: 'sessions')]
    #[ORM\JoinColumn(name: 'cours_id', nullable: true, onDelete: 'CASCADE')]
    private ?Course $course = null;

    #[ORM\ManyToOne(targetEntity: Coach::class, inversedBy: 'sessions')]
    #[ORM\JoinColumn(name: 'coach_id', nullable: true, onDelete: 'CASCADE')]
    private ?Coach $coach = null;

    /** @var Collection<int, Booking> */
    #[ORM\OneToMany(mappedBy: 'session', targetEntity: Booking::class, cascade: ['remove'], orphanRemoval: true)]
    private Collection $bookings;

    public function __construct()
    {
        $this->bookings = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getStartAt(): \DateTimeImmutable { return $this->startAt; }
    public function setStartAt(\DateTimeImmutable $startAt): static { $this->startAt = $startAt; return $this; }

    public function getEndAt(): \DateTimeImmutable { return $this->endAt; }
    public function setEndAt(\DateTimeImmutable $endAt): static { $this->endAt = $endAt; return $this; }

    public function getCapacity(): int { return $this->capacity; }
    public function setCapacity(int $capacity): static { $this->capacity = $capacity; return $this; }

    public function getPrice(): string { return $this->price; }
    public function setPrice(string $price): static { $this->price = $price; return $this; }

    public function getStatus(): SessionStatus { return $this->status; }
    public function setStatus(SessionStatus $status): static { $this->status = $status; return $this; }

    public function getLocation(): ?string { return $this->location; }
    public function setLocation(?string $location): static { $this->location = $location; return $this; }

    public function getCourse(): ?Course { return $this->course; }
    public function setCourse(?Course $course): static { $this->course = $course; return $this; }

    public function getCoach(): ?Coach { return $this->coach; }
    public function setCoach(?Coach $coach): static { $this->coach = $coach; return $this; }

    /** Coach effectif : celui de la séance privée, sinon celui du cours. */
    public function getEffectiveCoach(): ?Coach { return $this->coach ?? $this->course?->getCoach(); }

    public function getGym(): ?Gym { return $this->course?->getGym(); }

    public function getTitle(): string
    {
        if ($this->course !== null) {
            return $this->course->getTitle();
        }

        return 'Coaching privé'.($this->coach ? ' avec '.$this->coach->getUser()->getFullName() : '');
    }

    /** @return Collection<int, Booking> */
    public function getBookings(): Collection { return $this->bookings; }

    public function getBookedSeats(): int
    {
        $total = 0;
        foreach ($this->bookings as $b) {
            if ($b->getStatus() !== BookingStatus::ANNULEE) {
                $total += $b->getSeats();
            }
        }

        return $total;
    }

    public function getRemainingSeats(): int { return max(0, $this->capacity - $this->getBookedSeats()); }

    public function isCancelled(): bool { return $this->status === SessionStatus::ANNULEE; }

    public function isPast(): bool { return $this->startAt < new \DateTimeImmutable(); }

    /** Réservable si planifiée (ou complète mais avec des places libérées), non passée, places restantes > 0. */
    public function isBookable(): bool
    {
        return \in_array($this->status, [SessionStatus::PLANIFIEE, SessionStatus::COMPLETE], true)
            && !$this->isPast()
            && $this->getRemainingSeats() > 0;
    }

    /** Met à jour le statut planifiee/complete selon les places restantes. */
    public function refreshStatus(): void
    {
        if (\in_array($this->status, [SessionStatus::PLANIFIEE, SessionStatus::COMPLETE], true)) {
            $this->status = $this->getRemainingSeats() <= 0 ? SessionStatus::COMPLETE : SessionStatus::PLANIFIEE;
        }
    }
}
