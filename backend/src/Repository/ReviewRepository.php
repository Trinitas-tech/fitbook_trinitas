<?php

namespace App\Repository;

use App\Entity\Review;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Review> */
class ReviewRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Review::class);
    }

    /** @return array{items: Review[], total: int} */
    public function searchAdmin(?string $status, int $page, int $limit): array
    {
        $qb = $this->createQueryBuilder('r')
            ->join('r.author', 'a')->addSelect('a')
            ->leftJoin('r.gym', 'g')->addSelect('g')
            ->leftJoin('r.coach', 'c')->addSelect('c')
            ->orderBy('r.createdAt', 'DESC');
        if ($status) {
            $qb->andWhere('r.status = :status')->setParameter('status', $status);
        }
        $total = (int) (clone $qb)->select('COUNT(r.id)')->resetDQLPart('orderBy')->getQuery()->getSingleScalarResult();
        $items = $qb->setFirstResult(($page - 1) * $limit)->setMaxResults($limit)->getQuery()->getResult();

        return ['items' => $items, 'total' => $total];
    }
}
