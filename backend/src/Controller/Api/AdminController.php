<?php

namespace App\Controller\Api;

use App\Entity\Activity;
use App\Entity\Booking;
use App\Entity\Coach;
use App\Entity\Gym;
use App\Entity\Review;
use App\Entity\User;
use App\Enum\BookingStatus;
use App\Enum\ReviewStatus;
use App\Exception\ApiException;
use App\Repository\ActivityRepository;
use App\Repository\BookingRepository;
use App\Repository\CoachRepository;
use App\Repository\GymRepository;
use App\Repository\ReviewRepository;
use App\Repository\SessionRepository;
use App\Repository\UserRepository;
use App\Service\BookingService;
use App\Service\Presenter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints as Assert;

/** Administration (US-50 à US-54). */
#[Route('/api/admin')]
class AdminController extends AbstractApiController
{
    private const ROLES = ['ROLE_USER', 'ROLE_COACH', 'ROLE_MANAGER', 'ROLE_ADMIN'];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $users,
        private readonly CoachRepository $coaches,
        private readonly ActivityRepository $activities,
        private readonly GymRepository $gyms,
        private readonly BookingRepository $bookings,
        private readonly ReviewRepository $reviews,
        private readonly SessionRepository $sessions,
        private readonly BookingService $bookingService,
        private readonly Presenter $presenter,
    ) {
    }

    // ----- Utilisateurs (US-50) -----

    #[Route('/users', methods: ['GET'])]
    public function users(Request $request): JsonResponse
    {
        $page = $this->page($request);
        $limit = $this->limit($request);
        $res = $this->users->searchPaginated($request->query->get('q'), $request->query->get('role'), $page, $limit);

        return $this->ok($this->presenter->paginated(array_map(fn (User $u) => $this->presenter->user($u), $res['items']), $res['total'], $page, $limit));
    }

    #[Route('/users/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function user(int $id): JsonResponse
    {
        return $this->ok($this->presenter->user($this->users->find($id) ?? throw ApiException::notFound('Utilisateur introuvable.')));
    }

    #[Route('/users/{id}', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function updateUser(int $id, Request $request): JsonResponse
    {
        $user = $this->users->find($id) ?? throw ApiException::notFound('Utilisateur introuvable.');
        $data = $this->validate($this->jsonBody($request), [
            'roles' => new Assert\Optional([new Assert\Type('array'), new Assert\All([new Assert\Choice(choices: self::ROLES, message: 'Rôle invalide.')])]),
            'isActive' => new Assert\Optional([new Assert\Type('bool')]),
            'isVerified' => new Assert\Optional([new Assert\Type('bool')]),
            'firstName' => new Assert\Optional([new Assert\NotBlank(), new Assert\Length(max: 100)]),
            'lastName' => new Assert\Optional([new Assert\NotBlank(), new Assert\Length(max: 100)]),
        ]);
        if (isset($data['roles'])) {
            if ($user === $this->currentUser() && !\in_array('ROLE_ADMIN', $data['roles'], true)) {
                throw ApiException::conflict('Vous ne pouvez pas retirer votre propre rôle administrateur.');
            }
            $user->setRoles($data['roles']);
            if (\in_array('ROLE_COACH', $data['roles'], true) && $user->getCoach() === null) {
                $user->setCoach(new Coach());
            }
        }
        if (isset($data['isActive'])) {
            if ($user === $this->currentUser() && !$data['isActive']) {
                throw ApiException::conflict('Vous ne pouvez pas désactiver votre propre compte.');
            }
            $user->setIsActive($data['isActive']);
        }
        if (isset($data['isVerified'])) { $user->setIsVerified($data['isVerified']); }
        if (isset($data['firstName'])) { $user->setFirstName(trim($data['firstName'])); }
        if (isset($data['lastName'])) { $user->setLastName(trim($data['lastName'])); }
        $this->em->flush();

        return $this->ok($this->presenter->user($user));
    }

    #[Route('/users/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteUser(int $id): JsonResponse
    {
        $user = $this->users->find($id) ?? throw ApiException::notFound('Utilisateur introuvable.');
        if ($user === $this->currentUser()) {
            throw ApiException::conflict('Vous ne pouvez pas supprimer votre propre compte.');
        }
        if (!$user->getGyms()->isEmpty()) {
            throw ApiException::conflict('Cet utilisateur gère des salles : supprimez ou réattribuez ses salles avant.');
        }
        $this->em->remove($user);
        $this->em->flush();

        return $this->noContent();
    }

    // ----- Coachs (US-51) -----

    #[Route('/coaches', methods: ['GET'])]
    public function coachList(Request $request): JsonResponse
    {
        $criteria = [];
        if ($request->query->has('validated')) {
            $criteria['isValidated'] = filter_var($request->query->get('validated'), FILTER_VALIDATE_BOOLEAN);
        }
        $list = $this->coaches->findBy($criteria, ['id' => 'DESC']);

        return $this->ok(array_map(fn (Coach $c) => $this->presenter->coachDetail($c) + ['email' => $c->getUser()->getEmail()], $list));
    }

    #[Route('/coaches/{id}/validate', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function validateCoach(int $id, Request $request): JsonResponse
    {
        $coach = $this->coaches->find($id) ?? throw ApiException::notFound('Coach introuvable.');
        $data = $this->validate($this->jsonBody($request), ['isValidated' => [new Assert\NotNull(), new Assert\Type('bool')]]);
        $coach->setIsValidated($data['isValidated']);
        $this->em->flush();

        return $this->ok($this->presenter->coachDetail($coach));
    }

    // ----- Activités (US-51) -----

    #[Route('/activities', methods: ['GET'])]
    public function activityList(): JsonResponse
    {
        return $this->ok(array_map(fn (Activity $a) => $this->presenter->activity($a) + ['courseCount' => $a->getCourses()->count()], $this->activities->findBy([], ['name' => 'ASC'])));
    }

    /** @return array<string, mixed> */
    private function activityPayload(Request $request): array
    {
        return $this->validate($this->jsonBody($request), [
            'name' => [new Assert\NotBlank(message: 'Le nom est obligatoire.'), new Assert\Length(max: 100)],
            'description' => new Assert\Optional([new Assert\Length(max: 2000)]),
            'icon' => new Assert\Optional([new Assert\Length(max: 100)]),
        ]);
    }

    #[Route('/activities', methods: ['POST'])]
    public function createActivity(Request $request): JsonResponse
    {
        $data = $this->activityPayload($request);
        if ($this->activities->findOneBy(['name' => trim($data['name'])]) !== null) {
            throw ApiException::conflict('Une activité porte déjà ce nom.');
        }
        $activity = (new Activity())->setName(trim($data['name']))->setDescription($data['description'] ?? null)->setIcon($data['icon'] ?? null);
        $this->em->persist($activity);
        $this->em->flush();

        return $this->ok($this->presenter->activity($activity), 201);
    }

    #[Route('/activities/{id}', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function updateActivity(int $id, Request $request): JsonResponse
    {
        $activity = $this->activities->find($id) ?? throw ApiException::notFound('Activité introuvable.');
        $data = $this->activityPayload($request);
        $existing = $this->activities->findOneBy(['name' => trim($data['name'])]);
        if ($existing !== null && $existing !== $activity) {
            throw ApiException::conflict('Une activité porte déjà ce nom.');
        }
        $activity->setName(trim($data['name']))->setDescription($data['description'] ?? null)->setIcon($data['icon'] ?? null);
        $this->em->flush();

        return $this->ok($this->presenter->activity($activity));
    }

    #[Route('/activities/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteActivity(int $id): JsonResponse
    {
        $activity = $this->activities->find($id) ?? throw ApiException::notFound('Activité introuvable.');
        if (!$activity->getCourses()->isEmpty()) {
            throw ApiException::conflict('Des cours utilisent cette activité.');
        }
        $this->em->remove($activity);
        $this->em->flush();

        return $this->noContent();
    }

    // ----- Salles (US-51) -----

    #[Route('/gyms', methods: ['GET'])]
    public function gymList(Request $request): JsonResponse
    {
        $page = $this->page($request);
        $limit = $this->limit($request);
        $res = $this->gyms->search($request->query->get('q'), $request->query->get('city'), null, $page, $limit);

        return $this->ok($this->presenter->paginated(array_map(fn (Gym $g) => $this->presenter->gymDetail($g), $res['items']), $res['total'], $page, $limit));
    }

    #[Route('/gyms/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteGym(int $id): JsonResponse
    {
        $gym = $this->gyms->find($id) ?? throw ApiException::notFound('Salle introuvable.');
        $this->em->remove($gym);
        $this->em->flush();

        return $this->noContent();
    }

    // ----- Réservations (US-52) -----

    #[Route('/bookings', methods: ['GET'])]
    public function bookingList(Request $request): JsonResponse
    {
        $page = $this->page($request);
        $limit = $this->limit($request);
        $res = $this->bookings->searchAdmin($request->query->get('status'), $this->dateParam($request, 'date'), $request->query->getInt('userId') ?: null, $page, $limit);

        return $this->ok($this->presenter->paginated(array_map(fn (Booking $b) => $this->presenter->booking($b, true), $res['items']), $res['total'], $page, $limit));
    }

    #[Route('/bookings/{id}/cancel', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function cancelBooking(int $id): JsonResponse
    {
        $booking = $this->bookings->find($id) ?? throw ApiException::notFound('Réservation introuvable.');

        return $this->ok($this->presenter->booking($this->bookingService->cancel($booking, true), true));
    }

    // ----- Avis (US-53) -----

    #[Route('/reviews', methods: ['GET'])]
    public function reviewList(Request $request): JsonResponse
    {
        $page = $this->page($request);
        $limit = $this->limit($request);
        $res = $this->reviews->searchAdmin($request->query->get('status'), $page, $limit);

        return $this->ok($this->presenter->paginated(array_map(fn (Review $r) => $this->presenter->review($r), $res['items']), $res['total'], $page, $limit));
    }

    #[Route('/reviews/{id}', methods: ['PATCH', 'PUT'], requirements: ['id' => '\d+'])]
    public function moderateReview(int $id, Request $request): JsonResponse
    {
        $review = $this->reviews->find($id) ?? throw ApiException::notFound('Avis introuvable.');
        $data = $this->validate($this->jsonBody($request), [
            'status' => [new Assert\NotBlank(), new Assert\Choice(choices: ['en_attente', 'approuve', 'masque'], message: 'Statut invalide.')],
        ]);
        $review->setStatus(ReviewStatus::from($data['status']));
        $this->em->flush();

        return $this->ok($this->presenter->review($review));
    }

    #[Route('/reviews/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteReview(int $id): JsonResponse
    {
        $review = $this->reviews->find($id) ?? throw ApiException::notFound('Avis introuvable.');
        $this->em->remove($review);
        $this->em->flush();

        return $this->noContent();
    }

    // ----- Statistiques (US-54) -----

    #[Route('/stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        $cap = $booked = 0;
        foreach ($this->sessions->findToClose() + $this->sessions->findBy(['status' => 'terminee']) as $s) {
            $cap += $s->getCapacity();
            $booked += $s->getBookedSeats();
        }

        return $this->ok([
            'users' => $this->users->count([]),
            'coaches' => $this->coaches->count([]),
            'pendingCoaches' => $this->coaches->count(['isValidated' => false]),
            'gyms' => $this->gyms->count([]),
            'sessions' => $this->sessions->countAll(),
            'bookings' => $this->bookings->countAll(),
            'confirmedBookings' => $this->bookings->countAll(BookingStatus::CONFIRMEE),
            'cancelledBookings' => $this->bookings->countAll(BookingStatus::ANNULEE),
            'pendingReviews' => $this->reviews->count(['status' => ReviewStatus::EN_ATTENTE]),
            'fillRate' => $cap > 0 ? round($booked / $cap * 100) : 0,
            // US-54 : séries pour les graphiques
            'registrationsByMonth' => array_map(static fn (string $m, int $n) => ['month' => $m, 'count' => $n], array_keys($registrations = $this->users->countRegistrationsByMonth()), $registrations),
            'bookingsByMonth' => array_map(static fn (string $m, array $v) => ['month' => $m, 'confirmed' => $v['confirmed'], 'cancelled' => $v['cancelled']], array_keys($byMonth = $this->bookings->countByMonth()), $byMonth),
            'bookingsByStatus' => $this->bookings->countByStatus(),
            'topActivities' => $this->bookings->topActivities(),
            'topGyms' => $this->bookings->topGyms(),
        ]);
    }
}
