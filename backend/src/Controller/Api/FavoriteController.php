<?php

namespace App\Controller\Api;

use App\Entity\FavoriteCoach;
use App\Entity\FavoriteGym;
use App\Exception\ApiException;
use App\Repository\CoachRepository;
use App\Repository\GymRepository;
use App\Service\Presenter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/** Favoris salles / coachs (US-18). */
#[Route('/api/favorites')]
class FavoriteController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly GymRepository $gyms,
        private readonly CoachRepository $coaches,
        private readonly Presenter $presenter,
    ) {
    }

    #[Route('/me', methods: ['GET'])]
    public function mine(): JsonResponse
    {
        $user = $this->currentUser();

        return $this->ok([
            'gyms' => array_map(fn (FavoriteGym $f) => $this->presenter->gymCard($f->getGym()), $user->getFavoriteGyms()->toArray()),
            'coaches' => array_map(fn (FavoriteCoach $f) => $this->presenter->coachCard($f->getCoach()), $user->getFavoriteCoaches()->toArray()),
        ]);
    }

    #[Route('/gyms/{id}', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function addGym(int $id): JsonResponse
    {
        $user = $this->currentUser();
        $gym = $this->gyms->find($id) ?? throw ApiException::notFound('Salle introuvable.');
        if (!$user->hasFavoriteGym($gym)) {
            $user->getFavoriteGyms()->add(new FavoriteGym($user, $gym));
            $this->em->flush();
        }

        return $this->noContent();
    }

    #[Route('/gyms/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function removeGym(int $id): JsonResponse
    {
        $user = $this->currentUser();
        foreach ($user->getFavoriteGyms() as $fav) {
            if ($fav->getGym()->getId() === $id) {
                $user->getFavoriteGyms()->removeElement($fav);
            }
        }
        $this->em->flush();

        return $this->noContent();
    }

    #[Route('/coaches/{id}', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function addCoach(int $id): JsonResponse
    {
        $user = $this->currentUser();
        $coach = $this->coaches->find($id) ?? throw ApiException::notFound('Coach introuvable.');
        if (!$user->hasFavoriteCoach($coach)) {
            $user->getFavoriteCoaches()->add(new FavoriteCoach($user, $coach));
            $this->em->flush();
        }

        return $this->noContent();
    }

    #[Route('/coaches/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function removeCoach(int $id): JsonResponse
    {
        $user = $this->currentUser();
        foreach ($user->getFavoriteCoaches() as $fav) {
            if ($fav->getCoach()->getId() === $id) {
                $user->getFavoriteCoaches()->removeElement($fav);
            }
        }
        $this->em->flush();

        return $this->noContent();
    }
}
