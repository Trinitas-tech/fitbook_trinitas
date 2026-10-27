<?php

namespace App\Entity;

use App\Enum\ReviewStatus;
use App\Repository\ReviewRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Table MLD : avis. Cible une salle OU un coach (XOR). */
#[ORM\Entity(repositoryClass: ReviewRepository::class)]
#[ORM\Table(name: 'avis')]
#[ORM\UniqueConstraint(name: 'uniq_avis_auteur_salle', columns: ['auteur_id', 'salle_id'])]
#[ORM\UniqueConstraint(name: 'uniq_avis_auteur_coach', columns: ['auteur_id', 'coach_id'])]
class Review
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $rating;

    #[ORM\Column(name: 'commentaire', type: Types::TEXT, nullable: true)]
    private ?string $comment = null;

    #[ORM\Column(name: 'date_avis', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'statut_moderation', length: 20, enumType: ReviewStatus::class)]
    private ReviewStatus $status = ReviewStatus::APPROUVE;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'reviews')]
    #[ORM\JoinColumn(name: 'auteur_id', nullable: false, onDelete: 'CASCADE')]
    private User $author;

    #[ORM\ManyToOne(targetEntity: Gym::class, inversedBy: 'reviews')]
    #[ORM\JoinColumn(name: 'salle_id', nullable: true, onDelete: 'CASCADE')]
    private ?Gym $gym = null;

    #[ORM\ManyToOne(targetEntity: Coach::class, inversedBy: 'reviews')]
    #[ORM\JoinColumn(name: 'coach_id', nullable: true, onDelete: 'CASCADE')]
    private ?Coach $coach = null;

    public function __construct(User $author, int $rating, ?string $comment, ?Gym $gym, ?Coach $coach)
    {
        $this->author = $author;
        $this->rating = $rating;
        $this->comment = $comment;
        $this->gym = $gym;
        $this->coach = $coach;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getRating(): int { return $this->rating; }
    public function setRating(int $rating): static { $this->rating = $rating; return $this; }

    public function getComment(): ?string { return $this->comment; }
    public function setComment(?string $comment): static { $this->comment = $comment; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function getStatus(): ReviewStatus { return $this->status; }
    public function setStatus(ReviewStatus $status): static { $this->status = $status; return $this; }

    public function getAuthor(): User { return $this->author; }
    public function getGym(): ?Gym { return $this->gym; }
    public function getCoach(): ?Coach { return $this->coach; }
}
