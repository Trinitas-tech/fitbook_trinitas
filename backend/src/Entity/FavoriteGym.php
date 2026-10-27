<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Table MLD : favori_salle (association porteuse de date_ajout, clé composite). */
#[ORM\Entity]
#[ORM\Table(name: 'favori_salle')]
class FavoriteGym
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'favoriteGyms')]
    #[ORM\JoinColumn(name: 'utilisateur_id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Gym::class)]
    #[ORM\JoinColumn(name: 'salle_id', nullable: false, onDelete: 'CASCADE')]
    private Gym $gym;

    #[ORM\Column(name: 'date_ajout', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $addedAt;

    public function __construct(User $user, Gym $gym)
    {
        $this->user = $user;
        $this->gym = $gym;
        $this->addedAt = new \DateTimeImmutable();
    }

    public function getUser(): User { return $this->user; }
    public function getGym(): Gym { return $this->gym; }
    public function getAddedAt(): \DateTimeImmutable { return $this->addedAt; }
}
