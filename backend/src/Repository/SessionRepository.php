<?php

namespace App\Repository;

use App\Entity\Coach;
use App\Entity\Gym;
use App\Entity\Session;
use App\Enum\SessionStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Session> */
class SessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Session::class);
    }

    /** Verrou pessimiste (SELECT ... FOR UPDATE) pour le contrôle de capacité en transaction (US-60). */
    public function findForUpdate(int $id): ?Session
    {
        return $this->find($id, LockMode::PESSIMISTIC_WRITE);
    }

    private function baseQb(?\DateTimeImmutable $from, ?\DateTimeImmutable $to): QueryBuilder
    {
        $qb = $this->createQueryBuilder('s')
            ->leftJoin('s.course', 'c')->addSelect('c')
            ->leftJoin('s.coach', 'co')->addSelect('co')
            ->orderBy('s.startAt', 'ASC');
        if ($from !== null) {
            $qb->andWhere('s.startAt >= :from')->setParameter('from', $from);
        }
        if ($to !== null) {
            $qb->andWhere('s.startAt < :to')->setParameter('to', $to);
        }

        return $qb;
    }

    /** @return Session[] */
    public function findByGym(Gym $gym, ?\DateTimeImmutable $from, ?\DateTimeImmutable $to, ?int $courseId = null): array
    {
        $qb = $this->baseQb($from, $to)->andWhere('c.gym = :gym')->setParameter('gym', $gym);
        if ($courseId) {
            $qb->andWhere('c.id = :courseId')->setParameter('courseId', $courseId);
        }

        return $qb->getQuery()->getResult();
    }

    /** Séances d'un coach : ses séances privées + les séances des cours qu'il anime. @return Session[] */
    public function findByCoach(Coach $coach, ?\DateTimeImmutable $from, ?\DateTimeImmutable $to): array
    {
        return $this->baseQb($from, $to)
            ->andWhere('s.coach = :coach OR c.coach = :coach')->setParameter('coach', $coach)
            ->getQuery()->getResult();
    }

    /** Séances privées à venir d'un coach (fiche publique). @return Session[] */
    public function findUpcomingPrivateByCoach(Coach $coach): array
    {
        return $this->baseQb(new \DateTimeImmutable(), null)
            ->andWhere('s.coach = :coach')->setParameter('coach', $coach)
            ->andWhere('s.status <> :cancelled')->setParameter('cancelled', SessionStatus::ANNULEE)
            ->setMaxResults(50)
            ->getQuery()->getResult();
    }

    /** Séances terminées (date de fin passée) encore ouvertes, pour la commande de clôture (US-63). @return Session[] */
    public function findToClose(): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.endAt < :now')->setParameter('now', new \DateTimeImmutable())
            ->andWhere('s.status IN (:open)')->setParameter('open', [SessionStatus::PLANIFIEE, SessionStatus::COMPLETE])
            ->getQuery()->getResult();
    }

    public function countAll(): int
    {
        return (int) $this->createQueryBuilder('s')->select('COUNT(s.id)')->getQuery()->getSingleScalarResult();
    }
}
