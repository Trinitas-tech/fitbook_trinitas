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

    /** @return array{items: Gym[], total: int} */
    public function search(?string $q, ?string $city, ?int $activityId, int $page, int $limit): array
    {
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
