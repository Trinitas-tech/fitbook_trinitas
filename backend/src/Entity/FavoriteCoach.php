<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Table MLD : favori_coach (association porteuse de date_ajout, clé composite). */
#[ORM\Entity]
#[ORM\Table(name: 'favori_coach')]
class FavoriteCoach
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'favoriteCoaches')]
    #[ORM\JoinColumn(name: 'utilisateur_id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Coach::class)]
    #[ORM\JoinColumn(name: 'coach_id', nullable: false, onDelete: 'CASCADE')]
    private Coach $coach;

    #[ORM\Column(name: 'date_ajout', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $addedAt;

    public function __construct(User $user, Coach $coach)
    {
        $this->user = $user;
        $this->coach = $coach;
        $this->addedAt = new \DateTimeImmutable();
    }

    public function getUser(): User { return $this->user; }
    public function getCoach(): Coach { return $this->coach; }
    public function getAddedAt(): \DateTimeImmutable { return $this->addedAt; }
}
