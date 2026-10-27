<?php

namespace App\Entity;

use App\Enum\BookingStatus;
use App\Repository\BookingRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Table MLD : reservation. Une seule réservation par sportif et par séance. */
#[ORM\Entity(repositoryClass: BookingRepository::class)]
#[ORM\Table(name: 'reservation')]
#[ORM\UniqueConstraint(name: 'uniq_reservation_utilisateur_seance', columns: ['utilisateur_id', 'seance_id'])]
class Booking
{
    /** Délai minimal d'annulation avant le début de la séance (US-17). */
    public const CANCEL_DEADLINE_HOURS = 2;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'date_reservation', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $bookedAt;

    #[ORM\Column(name: 'statut', length: 20, enumType: BookingStatus::class)]
    private BookingStatus $status = BookingStatus::CONFIRMEE;

    #[ORM\Column(name: 'nb_places')]
    private int $seats = 1;

    #[ORM\Column(name: 'code_qr', length: 255, nullable: true)]
    private ?string $qrCode = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'bookings')]
    #[ORM\JoinColumn(name: 'utilisateur_id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Session::class, inversedBy: 'bookings')]
    #[ORM\JoinColumn(name: 'seance_id', nullable: false, onDelete: 'CASCADE')]
    private Session $session;

    public function __construct(User $user, Session $session, int $seats = 1)
    {
        $this->bookedAt = new \DateTimeImmutable();
        $this->user = $user;
        $this->session = $session;
        $this->seats = $seats;
        $this->qrCode = 'FB-'.strtoupper(bin2hex(random_bytes(6)));
    }

    public function getId(): ?int { return $this->id; }
    public function getBookedAt(): \DateTimeImmutable { return $this->bookedAt; }

    public function getStatus(): BookingStatus { return $this->status; }
    public function setStatus(BookingStatus $status): static { $this->status = $status; return $this; }

    public function getSeats(): int { return $this->seats; }
    public function setSeats(int $seats): static { $this->seats = $seats; return $this; }

    public function getQrCode(): ?string { return $this->qrCode; }

    /** Nouvelle date et nouveau code lors de la réactivation d'une réservation annulée. */
    public function renew(): static
    {
        $this->bookedAt = new \DateTimeImmutable();
        $this->qrCode = 'FB-'.strtoupper(bin2hex(random_bytes(6)));

        return $this;
    }

    public function getUser(): User { return $this->user; }
    public function getSession(): Session { return $this->session; }

    /** Annulable jusqu'à 2 h avant le début, si encore confirmée. */
    public function canBeCancelled(): bool
    {
        if ($this->status !== BookingStatus::CONFIRMEE) {
            return false;
        }
        $deadline = $this->session->getStartAt()->modify('-'.self::CANCEL_DEADLINE_HOURS.' hours');

        return new \DateTimeImmutable() < $deadline;
    }
}
