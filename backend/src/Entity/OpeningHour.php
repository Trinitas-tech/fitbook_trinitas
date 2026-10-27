<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Table MLD : horaire (ouverture d'une salle, un créneau par jour). */
#[ORM\Entity]
#[ORM\Table(name: 'horaire')]
#[ORM\UniqueConstraint(name: 'uniq_horaire_salle_jour', columns: ['salle_id', 'jour_semaine'])]
class OpeningHour
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** 1 = lundi ... 7 = dimanche */
    #[ORM\Column(name: 'jour_semaine', type: Types::SMALLINT)]
    private int $dayOfWeek;

    #[ORM\Column(name: 'heure_ouverture', type: Types::TIME_IMMUTABLE)]
    private \DateTimeImmutable $opensAt;

    #[ORM\Column(name: 'heure_fermeture', type: Types::TIME_IMMUTABLE)]
    private \DateTimeImmutable $closesAt;

    #[ORM\ManyToOne(targetEntity: Gym::class, inversedBy: 'openingHours')]
    #[ORM\JoinColumn(name: 'salle_id', nullable: false, onDelete: 'CASCADE')]
    private Gym $gym;

    public function __construct(int $dayOfWeek, \DateTimeImmutable $opensAt, \DateTimeImmutable $closesAt)
    {
        $this->dayOfWeek = $dayOfWeek;
        $this->opensAt = $opensAt;
        $this->closesAt = $closesAt;
    }

    public function getId(): ?int { return $this->id; }
    public function getDayOfWeek(): int { return $this->dayOfWeek; }
    public function getOpensAt(): \DateTimeImmutable { return $this->opensAt; }
    public function getClosesAt(): \DateTimeImmutable { return $this->closesAt; }
    public function getGym(): Gym { return $this->gym; }
    public function setGym(Gym $gym): static { $this->gym = $gym; return $this; }
}
