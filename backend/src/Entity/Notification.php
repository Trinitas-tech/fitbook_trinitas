<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Table MLD : notification (trace des e-mails envoyés à un utilisateur). */
#[ORM\Entity]
#[ORM\Table(name: 'notification')]
class Notification
{
    public const TYPE_CONFIRMATION = 'confirmation';
    public const TYPE_ANNULATION = 'annulation';
    public const TYPE_RAPPEL = 'rappel';
    public const TYPE_INFO = 'info';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    private string $type;

    #[ORM\Column(name: 'sujet', length: 255)]
    private string $subject;

    #[ORM\Column(name: 'contenu', type: Types::TEXT)]
    private string $content;

    #[ORM\Column(name: 'date_envoi', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $sentAt;

    #[ORM\Column(name: 'est_lue')]
    private bool $isRead = false;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'notifications')]
    #[ORM\JoinColumn(name: 'utilisateur_id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Booking::class)]
    #[ORM\JoinColumn(name: 'reservation_id', nullable: true, onDelete: 'SET NULL')]
    private ?Booking $booking = null;

    public function __construct(User $user, string $type, string $subject, string $content, ?Booking $booking = null)
    {
        $this->user = $user;
        $this->type = $type;
        $this->subject = $subject;
        $this->content = $content;
        $this->booking = $booking;
        $this->sentAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getType(): string { return $this->type; }
    public function getSubject(): string { return $this->subject; }
    public function getContent(): string { return $this->content; }
    public function getSentAt(): \DateTimeImmutable { return $this->sentAt; }
    public function isRead(): bool { return $this->isRead; }
    public function setIsRead(bool $isRead): static { $this->isRead = $isRead; return $this; }
    public function getUser(): User { return $this->user; }
    public function getBooking(): ?Booking { return $this->booking; }
}
