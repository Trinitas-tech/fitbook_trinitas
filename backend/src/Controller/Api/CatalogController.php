<?php

namespace App\Controller\Api;

use App\Entity\Coach;
use App\Entity\Course;
use App\Entity\Gym;
use App\Entity\Session;
use App\Enum\Level;
use App\Exception\ApiException;
use App\Repository\ActivityRepository;
use App\Repository\CoachRepository;
use App\Repository\CourseRepository;
use App\Repository\GymRepository;
use App\Repository\SessionRepository;
use App\Service\Presenter;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/** Catalogue public : recherche, salles, coachs, cours, séances (US-10 à US-14). */
#[Route('/api')]
class CatalogController extends AbstractApiController
{
    public function __construct(
        private readonly Presenter $presenter,
        private readonly GymRepository $gyms,
        private readonly CoachRepository $coaches,
        private readonly CourseRepository $courses,
        private readonly SessionRepository $sessions,
        private readonly ActivityRepository $activities,
    ) {
    }

    #[Route('/search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query->get('q', '')) ?: null;
        $city = trim((string) $request->query->get('city', '')) ?: null;
        $activityId = $request->query->getInt('activity') ?: null;
        $level = $request->query->get('level') ?: null;
        if ($level !== null && !\in_array($level, Level::values(), true)) {
            throw ApiException::validation(['level' => 'Niveau invalide.']);
        }
        $priceMax = $request->query->get('priceMax') !== null && $request->query->get('priceMax') !== '' ? (float) $request->query->get('priceMax') : null;
        $ratingMin = $request->query->get('ratingMin') !== null && $request->query->get('ratingMin') !== '' ? (float) $request->query->get('ratingMin') : null;
        $date = $this->dateParam($request, 'date');
        $type = $request->query->get('type') ?: null;
        [$lat, $lng] = $this->position($request);

        $byRating = static fn (?float $r) => $ratingMin === null || ($r !== null && $r >= $ratingMin);

        $gymsOut = $coachesOut = $coursesOut = [];
        if ($type === null || $type === 'gym') {
            $gymsOut = array_map(fn (Gym $g) => $this->presenter->gymCard($g), $this->gyms->search($q, $city, $activityId, 1, 50, $lat, $lng)['items']);
            $gymsOut = array_values(array_filter($gymsOut, static fn (array $g) => $byRating($g['averageRating'])));
        }
        if ($type === null || $type === 'coach') {
            $coachesOut = array_map(fn (Coach $c) => $this->presenter->coachCard($c), $this->coaches->searchPublic($q, $city, null, 1, 50)['items']);
            if ($priceMax !== null) {
                $coachesOut = array_filter($coachesOut, static fn (array $c) => $c['hourlyRate'] === null || $c['hourlyRate'] <= $priceMax);
            }
            $coachesOut = array_values(array_filter($coachesOut, static fn (array $c) => $byRating($c['averageRating'])));
        }
        if ($type === null || $type === 'course') {
            $coursesOut = array_map(fn (Course $c) => $this->presenter->courseCard($c), $this->courses->search($q, $city, $activityId, $level, $priceMax, $date));
        }

        return $this->ok([
            'gyms' => $gymsOut,
            'coaches' => $coachesOut,
            'courses' => $coursesOut,
            'total' => \count($gymsOut) + \count($coachesOut) + \count($coursesOut),
        ]);
    }

    /**
     * Position du visiteur (US-21) : query params lat/lng, transmis au Presenter pour distanceKm.
     *
     * @return array{0: ?float, 1: ?float}
     */
    private function position(Request $request): array
    {
        $lat = $request->query->get('lat');
        $lng = $request->query->get('lng');
        if ($lat === null || $lng === null || $lat === '' || $lng === '' || !is_numeric($lat) || !is_numeric($lng)) {
            return [null, null];
        }
        $lat = (float) $lat;
        $lng = (float) $lng;
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            throw ApiException::validation(['lat' => 'Coordonnées invalides.']);
        }
        $this->presenter->setUserPosition($lat, $lng);

        return [$lat, $lng];
    }

    #[Route('/activities', methods: ['GET'])]
    public function activities(): JsonResponse
    {
        return $this->ok(array_map(fn ($a) => $this->presenter->activity($a), $this->activities->findBy([], ['name' => 'ASC'])));
    }

    #[Route('/gyms', methods: ['GET'])]
    public function gyms(Request $request): JsonResponse
    {
        $page = $this->page($request);
        $limit = $this->limit($request);
        [$lat, $lng] = $this->position($request);
        $res = $this->gyms->search(null, $request->query->get('city') ?: null, null, $page, $limit, $lat, $lng);

        return $this->ok($this->presenter->paginated(array_map(fn (Gym $g) => $this->presenter->gymCard($g), $res['items']), $res['total'], $page, $limit));
    }

    #[Route('/gyms/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function gym(int $id): JsonResponse
    {
        $gym = $this->gyms->find($id) ?? throw ApiException::notFound('Salle introuvable.');

        return $this->ok($this->presenter->gymDetail($gym));
    }

    #[Route('/gyms/{id}/sessions', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function gymSessions(int $id, Request $request): JsonResponse
    {
        $gym = $this->gyms->find($id) ?? throw ApiException::notFound('Salle introuvable.');
        $from = $this->dateParam($request, 'from') ?? new \DateTimeImmutable('today');
        $to = $this->dateParam($request, 'to') ?? $from->modify('+7 days');

        return $this->ok(array_map(fn (Session $s) => $this->presenter->session($s), $this->sessions->findByGym($gym, $from, $to)));
    }

    #[Route('/coaches', methods: ['GET'])]
    public function coaches(Request $request): JsonResponse
    {
        $page = $this->page($request);
        $limit = $this->limit($request);
        $res = $this->coaches->searchPublic(null, $request->query->get('city') ?: null, $request->query->get('specialty') ?: null, $page, $limit);

        return $this->ok($this->presenter->paginated(array_map(fn (Coach $c) => $this->presenter->coachCard($c), $res['items']), $res['total'], $page, $limit));
    }

    #[Route('/coaches/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function coach(int $id): JsonResponse
    {
        $coach = $this->coaches->find($id);
        if ($coach === null || !$coach->isPublic()) {
            throw ApiException::notFound('Coach introuvable.');
        }

        return $this->ok($this->presenter->coachDetail($coach, $this->sessions->findUpcomingPrivateByCoach($coach)));
    }

    #[Route('/courses/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function course(int $id): JsonResponse
    {
        $course = $this->courses->find($id) ?? throw ApiException::notFound('Cours introuvable.');

        return $this->ok($this->presenter->courseDetail($course));
    }

    #[Route('/sessions/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function session(int $id): JsonResponse
    {
        $session = $this->sessions->find($id) ?? throw ApiException::notFound('Séance introuvable.');

        return $this->ok($this->presenter->session($session));
    }
}
