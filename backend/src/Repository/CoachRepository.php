<?php

namespace App\Repository;

use App\Entity\Coach;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Coach> */
class CoachRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Coach::class);
    }

    /** Coachs visibles publiquement : validés, profil complet, compte actif. */
    public function publicQueryBuilder(): QueryBuilder
    {
        return $this->createQueryBuilder('c')
            ->join('c.user', 'u')->addSelect('u')
            ->andWhere('c.isValidated = true')
            ->andWhere('u.isActive = true')
            ->andWhere('c.specialty IS NOT NULL AND c.hourlyRate IS NOT NULL AND c.city IS NOT NULL')
            ->orderBy('u.lastName', 'ASC');
    }

    /** @return array{items: Coach[], total: int} */
    public function searchPublic(?string $q, ?string $city, ?string $specialty, int $page, int $limit): array
    {
        $qb = $this->publicQueryBuilder();
        if ($q) {
            $qb->andWhere('u.firstName LIKE :q OR u.lastName LIKE :q OR c.specialty LIKE :q OR c.bio LIKE :q')->setParameter('q', '%'.$q.'%');
        }
        if ($city) {
            $qb->andWhere('c.city LIKE :city')->setParameter('city', '%'.$city.'%');
        }
        if ($specialty) {
            $qb->andWhere('c.specialty LIKE :sp')->setParameter('sp', '%'.$specialty.'%');
        }
        $total = (int) (clone $qb)->select('COUNT(c.id)')->resetDQLPart('orderBy')->getQuery()->getSingleScalarResult();
        $items = $qb->setFirstResult(($page - 1) * $limit)->setMaxResults($limit)->getQuery()->getResult();

        return ['items' => $items, 'total' => $total];
    }
}
