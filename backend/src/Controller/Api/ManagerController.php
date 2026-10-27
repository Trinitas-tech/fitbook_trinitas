<?php

namespace App\Controller\Api;

use App\Entity\Booking;
use App\Entity\Course;
use App\Entity\Gym;
use App\Entity\OpeningHour;
use App\Entity\Session;
use App\Enum\BookingStatus;
use App\Enum\Level;
use App\Enum\SessionStatus;
use App\Exception\ApiException;
use App\Repository\ActivityRepository;
use App\Repository\BookingRepository;
use App\Repository\CoachRepository;
use App\Repository\CourseRepository;
use App\Repository\GymRepository;
use App\Repository\SessionRepository;
use App\Security\Voter\CourseVoter;
use App\Security\Voter\GymVoter;
use App\Security\Voter\SessionVoter;
use App\Service\Presenter;
use App\Service\SessionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints as Assert;

/** Espace gestionnaire de salle (US-40 à US-46). */
#[Route('/api/manager')]
class ManagerController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly GymRepository $gyms,
        private readonly CourseRepository $courses,
        private readonly SessionRepository $sessions,
        private readonly BookingRepository $bookings,
        private readonly ActivityRepository $activities,
        private readonly CoachRepository $coaches,
        private readonly SessionService $sessionService,
        private readonly Presenter $presenter,
    ) {
    }

    private function myGym(int $id): Gym
    {
        $gym = $this->gyms->find($id) ?? throw ApiException::notFound('Salle introuvable.');
        $this->denyAccessUnlessGranted(GymVoter::MANAGE, $gym);

        return $gym;
    }

    private function myCourse(int $id): Course
    {
        $course = $this->courses->find($id) ?? throw ApiException::notFound('Cours introuvable.');
        $this->denyAccessUnlessGranted(CourseVoter::MANAGE, $course);

        return $course;
    }

    // ----- Salles (US-40) -----

    #[Route('/gyms', methods: ['GET'])]
    public function gyms(): JsonResponse
    {
        $list = $this->gyms->findBy(['manager' => $this->currentUser()], ['name' => 'ASC']);

        return $this->ok(array_map(fn (Gym $g) => $this->presenter->gymDetail($g), $list));
    }

    /** @return array<string, mixed> */
    private function gymPayload(Request $request): array
    {
        return $this->validate($this->jsonBody($request), [
            'name' => [new Assert\NotBlank(message: 'Le nom est obligatoire.'), new Assert\Length(max: 150)],
            'description' => new Assert\Optional([new Assert\Length(max: 5000)]),
            'address' => [new Assert\NotBlank(message: 'L\'adresse est obligatoire.'), new Assert\Length(max: 255)],
            'city' => [new Assert\NotBlank(message: 'La ville est obligatoire.'), new Assert\Length(max: 100)],
            'postalCode' => [new Assert\NotBlank(message: 'Le code postal est obligatoire.'), new Assert\Length(max: 10)],
            'phone' => new Assert\Optional([new Assert\Length(max: 20)]),
            'imageUrl' => new Assert\Optional([new Assert\Length(max: 255)]),
            'totalCapacity' => [new Assert\NotBlank(), new Assert\Type('integer'), new Assert\PositiveOrZero()],
            'latitude' => new Assert\Optional([new Assert\Type('numeric')]),
            'longitude' => new Assert\Optional([new Assert\Type('numeric')]),
        ]);
    }

    /** @param array<string, mixed> $data */
    private function fillGym(Gym $gym, array $data): void
    {
        $gym->setName(trim($data['name']))
            ->setDescription(isset($data['description']) ? (trim($data['description']) ?: null) : null)
            ->setAddress(trim($data['address']))
            ->setCity(trim($data['city']))
            ->setPostalCode(trim($data['postalCode']))
            ->setPhone(isset($data['phone']) ? (trim($data['phone']) ?: null) : null)
            ->setImageUrl(isset($data['imageUrl']) ? (trim($data['imageUrl']) ?: null) : null)
            ->setTotalCapacity((int) $data['totalCapacity'])
            ->setLatitude(isset($data['latitude']) && $data['latitude'] !== '' ? (string) $data['latitude'] : null)
            ->setLongitude(isset($data['longitude']) && $data['longitude'] !== '' ? (string) $data['longitude'] : null);
    }

    #[Route('/gyms', methods: ['POST'])]
    public function createGym(Request $request): JsonResponse
    {
        $gym = (new Gym())->setManager($this->currentUser());
        $this->fillGym($gym, $this->gymPayload($request));
        $this->em->persist($gym);
        $this->em->flush();

        return $this->ok($this->presenter->gymDetail($gym), 201);
    }

    #[Route('/gyms/{id}', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function updateGym(int $id, Request $request): JsonResponse
    {
        $gym = $this->myGym($id);
        $this->fillGym($gym, $this->gymPayload($request));
        $this->em->flush();

        return $this->ok($this->presenter->gymDetail($gym));
    }

    #[Route('/gyms/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteGym(int $id): JsonResponse
    {
        $gym = $this->myGym($id);
        $this->em->remove($gym);
        $this->em->flush();

        return $this->noContent();
    }

    // ----- Horaires (US-41) -----

    #[Route('/gyms/{id}/opening-hours', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function openingHours(int $id, Request $request): JsonResponse
    {
        $gym = $this->myGym($id);
        $list = $this->jsonBody($request);
        if (!array_is_list($list)) {
            throw ApiException::validation(['openingHours' => 'Un tableau de créneaux est attendu.']);
        }
        $gym->clearOpeningHours();
        $this->em->flush(); // supprime les anciens créneaux avant d'insérer (contrainte UNIQUE salle/jour)
        $seen = [];
        foreach ($list as $i => $item) {
            $day = (int) ($item['dayOfWeek'] ?? 0);
            if ($day < 1 || $day > 7) {
                throw ApiException::validation([(string) $i => 'Jour de semaine invalide (1 à 7).']);
            }
            if (isset($seen[$day])) {
                throw ApiException::validation([(string) $i => 'Un seul créneau par jour.']);
            }
            $seen[$day] = true;
            $open = $this->parseTime($item['opensAt'] ?? null, "$i.opensAt");
            $close = $this->parseTime($item['closesAt'] ?? null, "$i.closesAt");
            if ($close <= $open) {
                throw ApiException::validation([(string) $i => 'L\'heure de fermeture doit être après l\'ouverture.']);
            }
            $gym->addOpeningHour(new OpeningHour($day, $open, $close));
        }
        $this->em->flush();

        return $this->ok($this->presenter->gymDetail($gym)['openingHours']);
    }

    // ----- Cours (US-42) -----

    /** @return array<string, mixed> */
    private function coursePayload(Request $request): array
    {
        return $this->validate($this->jsonBody($request), [
            'title' => [new Assert\NotBlank(message: 'Le titre est obligatoire.'), new Assert\Length(max: 150)],
            'description' => new Assert\Optional([new Assert\Length(max: 5000)]),
            'activityId' => [new Assert\NotBlank(message: 'L\'activité est obligatoire.'), new Assert\Type('integer')],
            'level' => [new Assert\NotBlank(), new Assert\Choice(choices: Level::values(), message: 'Niveau invalide.')],
            'durationMinutes' => [new Assert\NotBlank(), new Assert\Type('integer'), new Assert\Range(min: 15, max: 480)],
            'price' => [new Assert\NotBlank(), new Assert\Type('numeric'), new Assert\PositiveOrZero()],
            'capacity' => [new Assert\NotBlank(), new Assert\Type('integer'), new Assert\Positive()],
            'imageUrl' => new Assert\Optional([new Assert\Length(max: 255)]),
            'coachId' => new Assert\Optional([new Assert\Type(['integer', 'null'])]),
        ]);
    }

    /** @param array<string, mixed> $data */
    private function fillCourse(Course $course, array $data): void
    {
        $activity = $this->activities->find((int) $data['activityId']) ?? throw ApiException::validation(['activityId' => 'Activité introuvable.']);
        $coach = null;
        if (!empty($data['coachId'])) {
            $coach = $this->coaches->find((int) $data['coachId']) ?? throw ApiException::validation(['coachId' => 'Coach introuvable.']);
        }
        if ($course->getGym()->getTotalCapacity() > 0 && (int) $data['capacity'] > $course->getGym()->getTotalCapacity()) {
            throw ApiException::validation(['capacity' => sprintf('La capacité ne peut pas dépasser celle de la salle (%d).', $course->getGym()->getTotalCapacity())]);
        }
        $course->setTitle(trim($data['title']))
            ->setDescription(isset($data['description']) ? (trim($data['description']) ?: null) : null)
            ->setActivity($activity)
            ->setLevel(Level::from($data['level']))
            ->setDurationMinutes((int) $data['durationMinutes'])
            ->setPrice(number_format((float) $data['price'], 2, '.', ''))
            ->setCapacity((int) $data['capacity'])
            ->setImageUrl(isset($data['imageUrl']) ? (trim($data['imageUrl']) ?: null) : null)
            ->setCoach($coach);
    }

    #[Route('/gyms/{id}/courses', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function gymCourses(int $id): JsonResponse
    {
        $gym = $this->myGym($id);

        return $this->ok(array_map(fn (Course $c) => $this->presenter->courseDetail($c), $gym->getCourses()->toArray()));
    }

    #[Route('/gyms/{id}/courses', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function createCourse(int $id, Request $request): JsonResponse
    {
        $gym = $this->myGym($id);
        $course = (new Course())->setGym($gym);
        $this->fillCourse($course, $this->coursePayload($request));
        $gym->getCourses()->add($course);
        $this->em->persist($course);
        $this->em->flush();

        return $this->ok($this->presenter->courseDetail($course), 201);
    }

    #[Route('/courses/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function course(int $id): JsonResponse
    {
        return $this->ok($this->presenter->courseDetail($this->myCourse($id)));
    }

    #[Route('/courses/{id}', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function updateCourse(int $id, Request $request): JsonResponse
    {
        $course = $this->myCourse($id);
        $this->fillCourse($course, $this->coursePayload($request));
        $this->em->flush();

        return $this->ok($this->presenter->courseDetail($course));
    }

    #[Route('/courses/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteCourse(int $id): JsonResponse
    {
        $course = $this->myCourse($id);
        foreach ($course->getSessions() as $s) {
            if (!$s->isPast() && !$s->isCancelled() && $s->getBookedSeats() > 0) {
                throw ApiException::conflict('Des séances à venir ont des réservations : annulez-les avant de supprimer le cours.');
            }
        }
        $this->em->remove($course);
        $this->em->flush();

        return $this->noContent();
    }

    // ----- Séances (US-43, US-44, US-45) -----

    #[Route('/courses/{id}/sessions', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function planSessions(int $id, Request $request): JsonResponse
    {
        $course = $this->myCourse($id);
        $data = $this->validate($this->jsonBody($request), [
            'startAt' => [new Assert\NotBlank(message: 'La date de début est obligatoire.')],
            'capacity' => new Assert\Optional([new Assert\Type('integer'), new Assert\Positive()]),
            'price' => new Assert\Optional([new Assert\Type('numeric'), new Assert\PositiveOrZero()]),
            'repeatWeeks' => new Assert\Optional([new Assert\Type('integer'), new Assert\Range(min: 0, max: 12)]),
        ]);
        $created = $this->sessionService->createForCourse(
            $course,
            $this->parseDate($data, 'startAt'),
            isset($data['capacity']) ? (int) $data['capacity'] : null,
            isset($data['price']) ? number_format((float) $data['price'], 2, '.', '') : null,
            (int) ($data['repeatWeeks'] ?? 0),
        );

        return $this->ok(array_map(fn (Session $s) => $this->presenter->session($s, true), $created), 201);
    }

    #[Route('/gyms/{id}/sessions', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function gymSessions(int $id, Request $request): JsonResponse
    {
        $gym = $this->myGym($id);
        $list = $this->sessions->findByGym($gym, $this->dateParam($request, 'from'), $this->dateParam($request, 'to'), $request->query->getInt('courseId') ?: null);

        return $this->ok(array_map(fn (Session $s) => $this->presenter->session($s, true), $list));
    }

    #[Route('/gyms/{id}/bookings', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function gymBookings(int $id, Request $request): JsonResponse
    {
        $gym = $this->myGym($id);
        $list = $this->bookings->findByGym($gym, $this->dateParam($request, 'from'), $this->dateParam($request, 'to'), $request->query->getInt('courseId') ?: null, $request->query->get('status') ?: null);

        return $this->ok(array_map(fn (Booking $b) => $this->presenter->booking($b, true), $list));
    }

    #[Route('/sessions/{id}', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function updateSession(int $id, Request $request): JsonResponse
    {
        $session = $this->sessions->find($id) ?? throw ApiException::notFound('Séance introuvable.');
        $this->denyAccessUnlessGranted(SessionVoter::MANAGE, $session);
        $data = $this->validate($this->jsonBody($request), [
            'startAt' => new Assert\Optional([new Assert\NotBlank()]),
            'capacity' => new Assert\Optional([new Assert\Type('integer'), new Assert\Positive()]),
            'price' => new Assert\Optional([new Assert\Type('numeric'), new Assert\PositiveOrZero()]),
        ]);
        if (isset($data['startAt'])) {
            $start = $this->parseDate($data, 'startAt');
            $duration = $session->getCourse()?->getDurationMinutes() ?? (int) (($session->getEndAt()->getTimestamp() - $session->getStartAt()->getTimestamp()) / 60);
            $session->setStartAt($start)->setEndAt($start->modify("+$duration minutes"));
        }
        if (isset($data['capacity'])) {
            if ((int) $data['capacity'] < $session->getBookedSeats()) {
                throw ApiException::conflict('La capacité ne peut pas être inférieure aux places déjà réservées.');
            }
            $session->setCapacity((int) $data['capacity']);
        }
        if (isset($data['price'])) {
            $session->setPrice(number_format((float) $data['price'], 2, '.', ''));
        }
        $session->refreshStatus();
        $this->em->flush();

        return $this->ok($this->presenter->session($session, true));
    }

    #[Route('/sessions/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteSession(int $id): JsonResponse
    {
        $session = $this->sessions->find($id) ?? throw ApiException::notFound('Séance introuvable.');
        $this->denyAccessUnlessGranted(SessionVoter::MANAGE, $session);
        $this->sessionService->delete($session);

        return $this->noContent();
    }

    #[Route('/sessions/{id}/cancel', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function cancelSession(int $id): JsonResponse
    {
        $session = $this->sessions->find($id) ?? throw ApiException::notFound('Séance introuvable.');
        $this->denyAccessUnlessGranted(SessionVoter::MANAGE, $session);

        return $this->ok($this->presenter->session($this->sessionService->cancel($session), true));
    }

    // ----- Avis et statistiques (US-46) -----

    #[Route('/gyms/{id}/reviews', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function gymReviews(int $id): JsonResponse
    {
        $gym = $this->myGym($id);
        $reviews = $gym->getApprovedReviews();
        usort($reviews, static fn ($a, $b) => $b->getCreatedAt() <=> $a->getCreatedAt());

        return $this->ok(['averageRating' => $gym->getAverageRating(), 'reviews' => array_map(fn ($r) => $this->presenter->review($r), $reviews)]);
    }

    #[Route('/gyms/{id}/stats', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function gymStats(int $id): JsonResponse
    {
        $gym = $this->myGym($id);
        $now = new \DateTimeImmutable();
        $upcoming = $this->sessions->findByGym($gym, $now, null);
        $upcoming = array_filter($upcoming, static fn (Session $s) => !$s->isCancelled());
        $weekStart = $now->modify('monday this week')->setTime(0, 0);
        $weekBookings = array_filter($this->bookings->findByGym($gym, $weekStart, $weekStart->modify('+7 days'), null, null), static fn (Booking $b) => $b->getStatus() !== BookingStatus::ANNULEE);
        $past = array_filter($this->sessions->findByGym($gym, $now->modify('-30 days'), $now), static fn (Session $s) => $s->getStatus() !== SessionStatus::ANNULEE);
        $cap = $booked = 0;
        foreach ($past as $s) {
            $cap += $s->getCapacity();
            $booked += $s->getBookedSeats();
        }

        return $this->ok([
            'upcomingSessions' => \count($upcoming),
            'bookingsThisWeek' => \count($weekBookings),
            'fillRate' => $cap > 0 ? round($booked / $cap * 100) : 0,
            'averageRating' => $gym->getAverageRating(),
            'reviewCount' => \count($gym->getApprovedReviews()),
            'courseCount' => $gym->getCourses()->count(),
        ]);
    }
}
