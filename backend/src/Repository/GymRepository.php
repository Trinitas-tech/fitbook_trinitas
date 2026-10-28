<?php

namespace App\Repository;

use App\Entity\Gym;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Gym> */
class GymRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Gym::class);
    }

    /**
     * Recherche de salles. Avec une position (lat/lng), les résultats sont triés par distance croissante,
     * les salles non géolocalisées en dernier (US-21).
     *
     * @return array{items: Gym[], total: int}
     */
    public function search(?string $q, ?string $city, ?int $activityId, int $page, int $limit, ?float $lat = null, ?float $lng = null): array
    {
        if ($lat !== null && $lng !== null) {
            $all = $this->search($q, $city, $activityId, 1, 1000)['items'];
            usort($all, static function (Gym $a, Gym $b) use ($lat, $lng) {
                $da = $a->distanceTo($lat, $lng) ?? PHP_FLOAT_MAX;
                $db = $b->distanceTo($lat, $lng) ?? PHP_FLOAT_MAX;

                return $da <=> $db ?: strcmp($a->getName(), $b->getName());
            });

            return ['items' => \array_slice($all, ($page - 1) * $limit, $limit), 'total' => \count($all)];
        }

        $qb = $this->createQueryBuilder('g')->orderBy('g.name', 'ASC');
        if ($q) {
            $qb->andWhere('g.name LIKE :q OR g.description LIKE :q OR g.city LIKE :q')->setParameter('q', '%'.$q.'%');
        }
        if ($city) {
            $qb->andWhere('g.city LIKE :city')->setParameter('city', '%'.$city.'%');
        }
        if ($activityId) {
            $qb->andWhere('EXISTS (SELECT 1 FROM App\Entity\Course c WHERE c.gym = g AND c.activity = :act)')->setParameter('act', $activityId);
        }
        $total = (int) (clone $qb)->select('COUNT(g.id)')->resetDQLPart('orderBy')->getQuery()->getSingleScalarResult();
        $items = $qb->setFirstResult(($page - 1) * $limit)->setMaxResults($limit)->getQuery()->getResult();

        return ['items' => $items, 'total' => $total];
    }
}
