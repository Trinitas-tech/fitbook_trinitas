<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/** @extends ServiceEntityRepository<User> */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }
        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->flush();
    }

    /**
     * Inscriptions par mois sur les N derniers mois (US-54).
     *
     * @return array<string, int> clé = "AAAA-MM"
     */
    public function countRegistrationsByMonth(int $months = 6): array
    {
        $start = (new \DateTimeImmutable('first day of this month'))->setTime(0, 0)->modify(sprintf('-%d months', $months - 1));
        $out = [];
        for ($i = 0; $i < $months; ++$i) {
            $out[$start->modify("+$i months")->format('Y-m')] = 0;
        }
        $rows = $this->createQueryBuilder('u')->select('u.createdAt AS createdAt')
            ->andWhere('u.createdAt >= :start')->setParameter('start', $start)
            ->getQuery()->getArrayResult();
        foreach ($rows as $row) {
            $key = $row['createdAt']->format('Y-m');
            if (isset($out[$key])) {
                ++$out[$key];
            }
        }

        return $out;
    }

    /** @return array{items: User[], total: int} */
    public function searchPaginated(?string $q, ?string $role, int $page, int $limit): array
    {
        $qb = $this->createQueryBuilder('u')->orderBy('u.createdAt', 'DESC');
        if ($q !== null && $q !== '') {
            $qb->andWhere('u.email LIKE :q OR u.firstName LIKE :q OR u.lastName LIKE :q')->setParameter('q', '%'.$q.'%');
        }
        if ($role !== null && $role !== '') {
            $qb->andWhere('u.roles LIKE :role')->setParameter('role', '%"'.$role.'"%');
        }
        $total = (int) (clone $qb)->select('COUNT(u.id)')->getQuery()->getSingleScalarResult();
        $items = $qb->setFirstResult(($page - 1) * $limit)->setMaxResults($limit)->getQuery()->getResult();

        return ['items' => $items, 'total' => $total];
    }
}
