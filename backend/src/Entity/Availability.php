<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Table MLD : disponibilite (plage hebdomadaire de travail d'un coach). */
#[ORM\Entity]
#[ORM\Table(name: 'disponibilite')]
class Availability
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** 1 = lundi ... 7 = dimanche */
    #[ORM\Column(name: 'jour_semaine', type: Types::SMALLINT)]
    private int $dayOfWeek;

    #[ORM\Column(name: 'heure_debut', type: Types::TIME_IMMUTABLE)]
    private \DateTimeImmutable $startsAt;

    #[ORM\Column(name: 'heure_fin', type: Types::TIME_IMMUTABLE)]
    private \DateTimeImmutable $endsAt;

    #[ORM\ManyToOne(targetEntity: Coach::class, inversedBy: 'availabilities')]
    #[ORM\JoinColumn(name: 'coach_id', nullable: false, onDelete: 'CASCADE')]
    private Coach $coach;

    public function __construct(int $dayOfWeek, \DateTimeImmutable $startsAt, \DateTimeImmutable $endsAt)
    {
        $this->dayOfWeek = $dayOfWeek;
        $this->startsAt = $startsAt;
        $this->endsAt = $endsAt;
    }

    public function getId(): ?int { return $this->id; }
    public function getDayOfWeek(): int { return $this->dayOfWeek; }
    public function getStartsAt(): \DateTimeImmutable { return $this->startsAt; }
    public function getEndsAt(): \DateTimeImmutable { return $this->endsAt; }
    public function getCoach(): Coach { return $this->coach; }
    public function setCoach(Coach $coach): static { $this->coach = $coach; return $this; }
}
