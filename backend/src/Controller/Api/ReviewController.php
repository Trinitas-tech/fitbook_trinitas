<?php

namespace App\Controller\Api;

use App\Entity\Review;
use App\Exception\ApiException;
use App\Repository\BookingRepository;
use App\Repository\CoachRepository;
use App\Repository\GymRepository;
use App\Repository\ReviewRepository;
use App\Security\Voter\ReviewVoter;
use App\Service\Presenter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints as Assert;

/** Avis et notes sur une salle ou un coach (US-19, US-62). */
#[Route('/api/reviews')]
class ReviewController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ReviewRepository $reviews,
        private readonly BookingRepository $bookings,
        private readonly GymRepository $gyms,
        private readonly CoachRepository $coaches,
        private readonly Presenter $presenter,
    ) {
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->currentUser();
        $data = $this->validate($this->jsonBody($request), [
            'gymId' => new Assert\Optional([new Assert\Type('integer')]),
            'coachId' => new Assert\Optional([new Assert\Type('integer')]),
            'rating' => [new Assert\NotBlank(message: 'La note est obligatoire.'), new Assert\Type('integer'), new Assert\Range(min: 1, max: 5, notInRangeMessage: 'La note doit être comprise entre 1 et 5.')],
            'comment' => new Assert\Optional([new Assert\Length(max: 2000)]),
        ]);
        $gymId = $data['gymId'] ?? null;
        $coachId = $data['coachId'] ?? null;
        if (($gymId === null) === ($coachId === null)) {
            throw ApiException::validation(['gymId' => 'Indiquez soit une salle, soit un coach.']);
        }

        $gym = $coach = null;
        if ($gymId !== null) {
            $gym = $this->gyms->find($gymId) ?? throw ApiException::notFound('Salle introuvable.');
            if (!$this->bookings->hasCompletedBookingForGym($user, $gym)) {
                throw ApiException::forbidden('Vous devez avoir participé à une séance dans cette salle pour publier un avis.');
            }
            if ($this->reviews->findOneBy(['author' => $user, 'gym' => $gym]) !== null) {
                throw ApiException::conflict('Vous avez déjà publié un avis sur cette salle. Modifiez-le plutôt.');
            }
        } else {
            $coach = $this->coaches->find($coachId) ?? throw ApiException::notFound('Coach introuvable.');
            if (!$this->bookings->hasCompletedBookingForCoach($user, $coach)) {
                throw ApiException::forbidden('Vous devez avoir participé à une séance avec ce coach pour publier un avis.');
            }
            if ($this->reviews->findOneBy(['author' => $user, 'coach' => $coach]) !== null) {
                throw ApiException::conflict('Vous avez déjà publié un avis sur ce coach. Modifiez-le plutôt.');
            }
        }

        $review = new Review($user, (int) $data['rating'], isset($data['comment']) ? trim($data['comment']) ?: null : null, $gym, $coach);
        $this->em->persist($review);
        $this->em->flush();

        return $this->ok($this->presenter->review($review), 201);
    }

    #[Route('/{id}', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $review = $this->reviews->find($id) ?? throw ApiException::notFound('Avis introuvable.');
        $this->denyAccessUnlessGranted(ReviewVoter::EDIT, $review);
        $data = $this->validate($this->jsonBody($request), [
            'rating' => new Assert\Optional([new Assert\Type('integer'), new Assert\Range(min: 1, max: 5)]),
            'comment' => new Assert\Optional([new Assert\Length(max: 2000)]),
        ]);
        if (isset($data['rating'])) { $review->setRating((int) $data['rating']); }
        if (\array_key_exists('comment', $data)) { $review->setComment(trim((string) $data['comment']) ?: null); }
        $this->em->flush();

        return $this->ok($this->presenter->review($review));
    }

    #[Route('/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $review = $this->reviews->find($id) ?? throw ApiException::notFound('Avis introuvable.');
        $this->denyAccessUnlessGranted(ReviewVoter::EDIT, $review);
        $this->em->remove($review);
        $this->em->flush();

        return $this->noContent();
    }
}
