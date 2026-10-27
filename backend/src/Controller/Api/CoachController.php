<?php

namespace App\Controller\Api;

use App\Entity\Availability;
use App\Entity\Booking;
use App\Entity\Coach;
use App\Entity\Session;
use App\Enum\BookingStatus;
use App\Exception\ApiException;
use App\Repository\SessionRepository;
use App\Security\Voter\SessionVoter;
use App\Service\Presenter;
use App\Service\SessionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints as Assert;

/** Espace coach (US-30 à US-35). */
#[Route('/api/coach')]
class CoachController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly SessionRepository $sessions,
        private readonly SessionService $sessionService,
        private readonly Presenter $presenter,
    ) {
    }

    private function myCoach(): Coach
    {
        $user = $this->currentUser();
        $coach = $user->getCoach();
        if ($coach === null) {
            // Un compte promu coach par l'admin n'a pas encore de profil : on le crée.
            $coach = new Coach();
            $user->setCoach($coach);
            $this->em->persist($coach);
            $this->em->flush();
        }

        return $coach;
    }

    #[Route('/profile', methods: ['GET'])]
    public function profile(): JsonResponse
    {
        $coach = $this->myCoach();

        return $this->ok($this->presenter->coachDetail($coach, $this->sessions->findByCoach($coach, new \DateTimeImmutable(), null)));
    }

    #[Route('/profile', methods: ['PUT', 'PATCH'])]
    public function updateProfile(Request $request): JsonResponse
    {
        $coach = $this->myCoach();
        $data = $this->validate($this->jsonBody($request), [
            'specialty' => new Assert\Optional([new Assert\Length(max: 100)]),
            'bio' => new Assert\Optional([new Assert\Length(max: 5000)]),
            'hourlyRate' => new Assert\Optional([new Assert\Type('numeric'), new Assert\PositiveOrZero()]),
            'city' => new Assert\Optional([new Assert\Length(max: 100)]),
            'avatarUrl' => new Assert\Optional([new Assert\Length(max: 255)]),
        ]);
        if (\array_key_exists('specialty', $data)) { $coach->setSpecialty(trim((string) $data['specialty']) ?: null); }
        if (\array_key_exists('bio', $data)) { $coach->setBio(trim((string) $data['bio']) ?: null); }
        if (\array_key_exists('hourlyRate', $data)) { $coach->setHourlyRate($data['hourlyRate'] !== null && $data['hourlyRate'] !== '' ? number_format((float) $data['hourlyRate'], 2, '.', '') : null); }
        if (\array_key_exists('city', $data)) { $coach->setCity(trim((string) $data['city']) ?: null); }
        if (\array_key_exists('avatarUrl', $data)) { $coach->getUser()->setAvatarUrl($data['avatarUrl'] ?: null); }
        $this->em->flush();

        return $this->ok($this->presenter->coachDetail($coach));
    }

    #[Route('/availabilities', methods: ['GET'])]
    public function availabilities(): JsonResponse
    {
        return $this->ok($this->presenter->coachDetail($this->myCoach())['availabilities']);
    }

    #[Route('/availabilities', methods: ['PUT'])]
    public function updateAvailabilities(Request $request): JsonResponse
    {
        $coach = $this->myCoach();
        $list = $this->jsonBody($request);
        if (!array_is_list($list)) {
            throw ApiException::validation(['availabilities' => 'Un tableau de créneaux est attendu.']);
        }
        $coach->clearAvailabilities();
        foreach ($list as $i => $item) {
            $day = (int) ($item['dayOfWeek'] ?? 0);
            if ($day < 1 || $day > 7) {
                throw ApiException::validation ([(string) $i => 'Jour de semaine invalide (1 à 7).']);
            }
            $start = $this->parseTime($item['startsAt'] ?? null, "$i.startsAt");
            $end = $this->parseTime($item['endsAt'] ?? null, "$i.endsAt");
            if ($end <= $start) {
                throw ApiException::validation([(string) $i => 'L\'heure de fin doit être après l\'heure de début.']);
            }
            $coach->addAvailability(new Availability($day, $start, $end));
        }
        $this->em->flush();

        return $this->ok($this->presenter->coachDetail($coach)['availabilities']);
    }

    #[Route('/sessions', methods: ['GET'])]
    public function sessions(Request $request): JsonResponse
    {
        $coach = $this->myCoach();
        $list = $this->sessions->findByCoach($coach, $this->dateParam($request, 'from'), $this->dateParam($request, 'to'));

        return $this->ok(array_map(fn (Session $s) => $this->presenter->session($s, true), $list));
    }

    /** @return array{0: \DateTimeImmutable, 1: int, 2: ?string, 3: int, 4: string} */
    private function sessionPayload(Request $request): array
    {
        $data = $this->validate($this->jsonBody($request), [
            'startAt' => [new Assert\NotBlank(message: 'La date de début est obligatoire.')],
            'durationMinutes' => [new Assert\NotBlank(), new Assert\Type('integer')],
            'location' => new Assert\Optional([new Assert\Length(max: 255)]),
            'capacity' => [new Assert\NotBlank(), new Assert\Type('integer'), new Assert\Positive()],
            'price' => [new Assert\NotBlank(), new Assert\Type('numeric'), new Assert\PositiveOrZero()],
        ]);

        return [$this->parseDate($data, 'startAt'), (int) $data['durationMinutes'], isset($data['location']) ? (trim($data['location']) ?: null) : null, (int) $data['capacity'], number_format((float) $data['price'], 2, '.', '')];
    }

    #[Route('/sessions', methods: ['POST'])]
    public function createSession(Request $request): JsonResponse
    {
        [$startAt, $duration, $location, $capacity, $price] = $this->sessionPayload($request);
        $session = $this->sessionService->saveForCoach($this->myCoach(), null, $startAt, $duration, $location, $capacity, $price);

        return $this->ok($this->presenter->session($session, true), 201);
    }

    private function mySession(int $id, string $attribute = SessionVoter::MANAGE): Session
    {
        $session = $this->sessions->find($id) ?? throw ApiException::notFound('Séance introuvable.');
        $this->denyAccessUnlessGranted($attribute, $session);

        return $session;
    }

    #[Route('/sessions/{id}', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function updateSession(int $id, Request $request): JsonResponse
    {
        $session = $this->mySession($id);
        if ($session->getCoach() === null) {
            throw ApiException::forbidden('Les séances de cours sont gérées par le gestionnaire de la salle.');
        }
        [$startAt, $duration, $location, $capacity, $price] = $this->sessionPayload($request);
        $session = $this->sessionService->saveForCoach($this->myCoach(), $session, $startAt, $duration, $location, $capacity, $price);

        return $this->ok($this->presenter->session($session, true));
    }

    #[Route('/sessions/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteSession(int $id): JsonResponse
    {
        $this->sessionService->delete($this->mySession($id));

        return $this->noContent();
    }

    #[Route('/sessions/{id}/cancel', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function cancelSession(int $id): JsonResponse
    {
        return $this->ok($this->presenter->session($this->sessionService->cancel($this->mySession($id)), true));
    }

    #[Route('/sessions/{id}/bookings', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function sessionBookings(int $id): JsonResponse
    {
        $session = $this->mySession($id, SessionVoter::VIEW);
        $list = array_filter($session->getBookings()->toArray(), static fn (Booking $b) => $b->getStatus() !== BookingStatus::ANNULEE);

        return $this->ok([
            'session' => $this->presenter->session($session, true),
            'bookings' => array_values(array_map(fn (Booking $b) => $this->presenter->booking($b, true), $list)),
        ]);
    }

    #[Route('/reviews', methods: ['GET'])]
    public function reviews(): JsonResponse
    {
        $coach = $this->myCoach();
        $reviews = $coach->getApprovedReviews();
        usort($reviews, static fn ($a, $b) => $b->getCreatedAt() <=> $a->getCreatedAt());

        return $this->ok(['averageRating' => $coach->getAverageRating(), 'reviews' => array_map(fn ($r) => $this->presenter->review($r), $reviews)]);
    }
}
