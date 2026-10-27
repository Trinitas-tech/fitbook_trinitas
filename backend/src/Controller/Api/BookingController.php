<?php

namespace App\Controller\Api;

use App\Entity\Booking;
use App\Exception\ApiException;
use App\Repository\BookingRepository;
use App\Security\Voter\BookingVoter;
use App\Service\BookingService;
use App\Service\Presenter;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints as Assert;

/** Réservations du sportif (US-15, US-16, US-17). */
#[Route('/api/bookings')]
class BookingController extends AbstractApiController
{
    public function __construct(
        private readonly BookingService $bookingService,
        private readonly BookingRepository $bookings,
        private readonly Presenter $presenter,
    ) {
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = $this->validate($this->jsonBody($request), [
            'sessionId' => [new Assert\NotBlank(message: 'La séance est obligatoire.'), new Assert\Type('integer')],
            'seats' => new Assert\Optional([new Assert\Type('integer'), new Assert\Range(min: 1, max: 5)]),
        ]);
        $booking = $this->bookingService->book($this->currentUser(), (int) $data['sessionId'], (int) ($data['seats'] ?? 1));

        return $this->ok($this->presenter->booking($booking), 201);
    }

    #[Route('/me', methods: ['GET'])]
    public function mine(Request $request): JsonResponse
    {
        $list = $this->bookings->findByUser($this->currentUser(), $request->query->get('scope'));

        return $this->ok(array_map(fn (Booking $b) => $this->presenter->booking($b), $list));
    }

    #[Route('/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $booking = $this->bookings->find($id) ?? throw ApiException::notFound('Réservation introuvable.');
        $this->denyAccessUnlessGranted(BookingVoter::OWN, $booking);

        return $this->ok($this->presenter->booking($booking));
    }

    #[Route('/{id}/cancel', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function cancel(int $id): JsonResponse
    {
        $booking = $this->bookings->find($id) ?? throw ApiException::notFound('Réservation introuvable.');
        $this->denyAccessUnlessGranted(BookingVoter::OWN, $booking);

        return $this->ok($this->presenter->booking($this->bookingService->cancel($booking)));
    }
}
