<?php

namespace App\Repository;

use App\Entity\Course;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Course> */
class CourseRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Course::class);
    }

    /**
     * Recherche de cours (US-10, US-11).
     *
     * @return Course[]
     */
    public function search(?string $q, ?string $city, ?int $activityId, ?string $level, ?float $priceMax, ?\DateTimeImmutable $date, int $limit = 50): array
    {
        $qb = $this->createQueryBuilder('c')
            ->join('c.gym', 'g')->addSelect('g')
            ->join('c.activity', 'a')->addSelect('a')
            ->leftJoin('c.coach', 'co')->addSelect('co')
            ->orderBy('c.title', 'ASC')
            ->setMaxResults($limit);
        if ($q) {
            $qb->andWhere('c.title LIKE :q OR c.description LIKE :q OR a.name LIKE :q OR g.name LIKE :q')->setParameter('q', '%'.$q.'%');
        }
        if ($city) {
            $qb->andWhere('g.city LIKE :city')->setParameter('city', '%'.$city.'%');
        }
        if ($activityId) {
            $qb->andWhere('c.activity = :act')->setParameter('act', $activityId);
        }
        if ($level) {
            $qb->andWhere('c.level = :level')->setParameter('level', $level);
        }
        if ($priceMax !== null) {
            $qb->andWhere('c.price <= :priceMax')->setParameter('priceMax', $priceMax);
        }
        if ($date !== null) {
            $qb->andWhere('EXISTS (SELECT 1 FROM App\Entity\Session s WHERE s.course = c AND s.startAt >= :d1 AND s.startAt < :d2 AND s.status <> :cancelled)')
                ->setParameter('d1', $date->setTime(0, 0))
                ->setParameter('d2', $date->modify('+1 day')->setTime(0, 0))
                ->setParameter('cancelled', 'annulee');
        }

        return $qb->getQuery()->getResult();
    }
}
