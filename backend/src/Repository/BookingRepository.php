<?php

namespace App\Repository;

use App\Entity\Booking;
use App\Entity\Coach;
use App\Entity\Gym;
use App\Entity\User;
use App\Enum\BookingStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Booking> */
class BookingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Booking::class);
    }

    /** @return Booking[] */
    public function findByUser(User $user, ?string $scope): array
    {
        $qb = $this->createQueryBuilder('b')
            ->join('b.session', 's')->addSelect('s')
            ->andWhere('b.user = :user')->setParameter('user', $user);
        $now = new \DateTimeImmutable();
        if ($scope === 'upcoming') {
            $qb->andWhere('s.startAt >= :now')->setParameter('now', $now)->orderBy('s.startAt', 'ASC');
        } elseif ($scope === 'past') {
            $qb->andWhere('s.startAt < :now')->setParameter('now', $now)->orderBy('s.startAt', 'DESC');
        } else {
            $qb->orderBy('s.startAt', 'DESC');
        }

        return $qb->getQuery()->getResult();
    }

    /** @return Booking[] */
    public function findByGym(Gym $gym, ?\DateTimeImmutable $from, ?\DateTimeImmutable $to, ?int $courseId, ?string $status): array
    {
        $qb = $this->createQueryBuilder('b')
            ->join('b.session', 's')->addSelect('s')
            ->join('s.course', 'c')->addSelect('c')
            ->join('b.user', 'u')->addSelect('u')
            ->andWhere('c.gym = :gym')->setParameter('gym', $gym)
            ->orderBy('s.startAt', 'DESC');
        if ($from) {
            $qb->andWhere('s.startAt >= :from')->setParameter('from', $from);
        }
        if ($to) {
            $qb->andWhere('s.startAt < :to')->setParameter('to', $to);
        }
        if ($courseId) {
            $qb->andWhere('c.id = :courseId')->setParameter('courseId', $courseId);
        }
        if ($status) {
            $qb->andWhere('b.status = :status')->setParameter('status', $status);
        }

        return $qb->getQuery()->getResult();
    }

    /** L'utilisateur a-t-il une réservation terminée dans cette salle ? (condition pour publier un avis, US-19) */
    public function hasCompletedBookingForGym(User $user, Gym $gym): bool
    {
        return (int) $this->createQueryBuilder('b')->select('COUNT(b.id)')
            ->join('b.session', 's')->join('s.course', 'c')
            ->andWhere('b.user = :user')->setParameter('user', $user)
            ->andWhere('c.gym = :gym')->setParameter('gym', $gym)
            ->andWhere('b.status = :done')->setParameter('done', BookingStatus::TERMINEE)
            ->getQuery()->getSingleScalarResult() > 0;
    }

    /** L'utilisateur a-t-il une réservation terminée avec ce coach (séance privée ou cours animé) ? */
    public function hasCompletedBookingForCoach(User $user, Coach $coach): bool
    {
        return (int) $this->createQueryBuilder('b')->select('COUNT(b.id)')
            ->join('b.session', 's')->leftJoin('s.course', 'c')
            ->andWhere('b.user = :user')->setParameter('user', $user)
            ->andWhere('s.coach = :coach OR c.coach = :coach')->setParameter('coach', $coach)
            ->andWhere('b.status = :done')->setParameter('done', BookingStatus::TERMINEE)
            ->getQuery()->getSingleScalarResult() > 0;
    }

    /** @return array{items: Booking[], total: int} */
    public function searchAdmin(?string $status, ?\DateTimeImmutable $date, ?int $userId, int $page, int $limit): array
    {
        $qb = $this->createQueryBuilder('b')
            ->join('b.session', 's')->addSelect('s')
            ->join('b.user', 'u')->addSelect('u')
            ->orderBy('b.bookedAt', 'DESC');
        if ($status) {
            $qb->andWhere('b.status = :status')->setParameter('status', $status);
        }
        if ($date) {
            $qb->andWhere('s.startAt >= :d1 AND s.startAt < :d2')
                ->setParameter('d1', $date->setTime(0, 0))->setParameter('d2', $date->modify('+1 day')->setTime(0, 0));
        }
        if ($userId) {
            $qb->andWhere('u.id = :uid')->setParameter('uid', $userId);
        }
        $total = (int) (clone $qb)->select('COUNT(b.id)')->resetDQLPart('orderBy')->getQuery()->getSingleScalarResult();
        $items = $qb->setFirstResult(($page - 1) * $limit)->setMaxResults($limit)->getQuery()->getResult();

        return ['items' => $items, 'total' => $total];
    }

    public function countAll(?BookingStatus $status = null): int
    {
        $qb = $this->createQueryBuilder('b')->select('COUNT(b.id)');
        if ($status) {
            $qb->andWhere('b.status = :s')->setParameter('s', $status);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}
