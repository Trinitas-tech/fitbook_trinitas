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

    /**
     * Réservations confirmées dont la séance commence dans la fenêtre, sans rappel déjà envoyé (US-20).
     *
     * @return Booking[]
     */
    public function findToRemind(\DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        return $this->createQueryBuilder('b')
            ->join('b.session', 's')->addSelect('s')
            ->join('b.user', 'u')->addSelect('u')
            ->andWhere('b.status = :confirmed')->setParameter('confirmed', BookingStatus::CONFIRMEE)
            ->andWhere('s.startAt BETWEEN :from AND :to')->setParameter('from', $from)->setParameter('to', $to)
            ->andWhere('s.status <> :cancelled')->setParameter('cancelled', 'annulee')
            ->andWhere('NOT EXISTS (SELECT 1 FROM App\Entity\Notification n WHERE n.booking = b AND n.type = :rappel)')->setParameter('rappel', 'rappel')
            ->getQuery()->getResult();
    }

    /**
     * Réservations par mois de séance sur les N derniers mois (US-54).
     *
     * @return array<string, array{confirmed: int, cancelled: int}> clé = "AAAA-MM"
     */
    public function countByMonth(int $months = 6): array
    {
        $start = (new \DateTimeImmutable('first day of this month'))->setTime(0, 0)->modify(sprintf('-%d months', $months - 1));
        $rows = $this->createQueryBuilder('b')
            ->select('b.bookedAt AS bookedAt', 'b.status AS status')
            ->andWhere('b.bookedAt >= :start')->setParameter('start', $start)
            ->getQuery()->getArrayResult();
        $out = [];
        for ($i = 0; $i < $months; ++$i) {
            $out[$start->modify("+$i months")->format('Y-m')] = ['confirmed' => 0, 'cancelled' => 0];
        }
        foreach ($rows as $row) {
            $key = $row['bookedAt']->format('Y-m');
            if (!isset($out[$key])) {
                continue;
            }
            $status = $row['status'] instanceof BookingStatus ? $row['status'] : BookingStatus::from($row['status']);
            if ($status === BookingStatus::ANNULEE) {
                ++$out[$key]['cancelled'];
            } else {
                ++$out[$key]['confirmed'];
            }
        }

        return $out;
    }

    /** @return array<string, int> statut => nombre */
    public function countByStatus(): array
    {
        $rows = $this->createQueryBuilder('b')->select('b.status AS status', 'COUNT(b.id) AS n')->groupBy('b.status')->getQuery()->getArrayResult();
        $out = ['confirmee' => 0, 'annulee' => 0, 'terminee' => 0];
        foreach ($rows as $row) {
            $key = $row['status'] instanceof BookingStatus ? $row['status']->value : (string) $row['status'];
            $out[$key] = (int) $row['n'];
        }

        return $out;
    }

    /** @return list<array{name: string, bookings: int}> */
    public function topActivities(int $limit = 5): array
    {
        $rows = $this->createQueryBuilder('b')
            ->select('a.name AS name', 'COUNT(b.id) AS bookings')
            ->join('b.session', 's')->join('s.course', 'c')->join('c.activity', 'a')
            ->andWhere('b.status <> :cancelled')->setParameter('cancelled', BookingStatus::ANNULEE)
            ->groupBy('a.id')->orderBy('bookings', 'DESC')->setMaxResults($limit)
            ->getQuery()->getArrayResult();

        return array_map(static fn (array $r) => ['name' => $r['name'], 'bookings' => (int) $r['bookings']], $rows);
    }

    /** @return list<array{name: string, bookings: int}> */
    public function topGyms(int $limit = 5): array
    {
        $rows = $this->createQueryBuilder('b')
            ->select('g.name AS name', 'COUNT(b.id) AS bookings')
            ->join('b.session', 's')->join('s.course', 'c')->join('c.gym', 'g')
            ->andWhere('b.status <> :cancelled')->setParameter('cancelled', BookingStatus::ANNULEE)
            ->groupBy('g.id')->orderBy('bookings', 'DESC')->setMaxResults($limit)
            ->getQuery()->getArrayResult();

        return array_map(static fn (array $r) => ['name' => $r['name'], 'bookings' => (int) $r['bookings']], $rows);
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
