<?php

namespace App\Service;

use App\Entity\Activity;
use App\Entity\Booking;
use App\Entity\Coach;
use App\Entity\Course;
use App\Entity\Gym;
use App\Entity\Review;
use App\Entity\Session;
use App\Entity\User;
use App\Enum\BookingStatus;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Transforme les entités en tableaux JSON conformes au contrat docs/04-api.md.
 */
class Presenter
{
    public function __construct(private readonly Security $security)
    {
    }

    private function me(): ?User
    {
        $u = $this->security->getUser();

        return $u instanceof User ? $u : null;
    }

    /** @return array<string, mixed> */
    public function user(User $u): array
    {
        $coach = $u->getCoach();

        return [
            'id' => $u->getId(),
            'email' => $u->getEmail(),
            'firstName' => $u->getFirstName(),
            'lastName' => $u->getLastName(),
            'phone' => $u->getPhone(),
            'avatarUrl' => $u->getAvatarUrl(),
            'roles' => $u->getRoles(),
            'isVerified' => $u->isVerified(),
            'isActive' => $u->isActive(),
            'createdAt' => $u->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'coach' => $coach ? ['id' => $coach->getId(), 'isValidated' => $coach->isValidated(), 'isComplete' => $coach->isComplete()] : null,
        ];
    }

    /** @return array<string, mixed> */
    public function userShort(User $u): array
    {
        return ['id' => $u->getId(), 'firstName' => $u->getFirstName(), 'lastName' => $u->getLastName()];
    }

    /** @return array<string, mixed> */
    public function activity(Activity $a): array
    {
        return ['id' => $a->getId(), 'name' => $a->getName(), 'description' => $a->getDescription(), 'icon' => $a->getIcon()];
    }

    /** @return array<string, mixed> */
    public function gymCard(Gym $g): array
    {
        $activities = [];
        foreach ($g->getCourses() as $c) {
            $activities[$c->getActivity()->getName()] = true;
        }
        $me = $this->me();

        return [
            'id' => $g->getId(),
            'name' => $g->getName(),
            'city' => $g->getCity(),
            'postalCode' => $g->getPostalCode(),
            'address' => $g->getAddress(),
            'imageUrl' => $g->getImageUrl(),
            'averageRating' => $g->getAverageRating(),
            'reviewCount' => \count($g->getApprovedReviews()),
            'activities' => array_keys($activities),
            'isFavorite' => $me ? $me->hasFavoriteGym($g) : false,
        ];
    }

    /** @return array<string, mixed> */
    public function gymDetail(Gym $g): array
    {
        $hours = [];
        foreach ($g->getOpeningHours() as $h) {
            $hours[] = ['dayOfWeek' => $h->getDayOfWeek(), 'opensAt' => $h->getOpensAt()->format('H:i'), 'closesAt' => $h->getClosesAt()->format('H:i')];
        }

        return $this->gymCard($g) + [
            'description' => $g->getDescription(),
            'phone' => $g->getPhone(),
            'latitude' => $g->getLatitude() !== null ? (float) $g->getLatitude() : null,
            'longitude' => $g->getLongitude() !== null ? (float) $g->getLongitude() : null,
            'totalCapacity' => $g->getTotalCapacity(),
            'openingHours' => $hours,
            'courses' => array_map(fn (Course $c) => $this->courseCard($c), $g->getCourses()->toArray()),
            'reviews' => array_map(fn (Review $r) => $this->review($r), $g->getApprovedReviews()),
            'manager' => $this->userShort($g->getManager()),
        ];
    }

    /** @return array<string, mixed> */
    public function coachCard(Coach $c): array
    {
        $u = $c->getUser();
        $me = $this->me();

        return [
            'id' => $c->getId(),
            'userId' => $u->getId(),
            'firstName' => $u->getFirstName(),
            'lastName' => $u->getLastName(),
            'specialty' => $c->getSpecialty(),
            'city' => $c->getCity(),
            'hourlyRate' => $c->getHourlyRate() !== null ? (float) $c->getHourlyRate() : null,
            'avatarUrl' => $u->getAvatarUrl(),
            'averageRating' => $c->getAverageRating(),
            'reviewCount' => \count($c->getApprovedReviews()),
            'isFavorite' => $me ? $me->hasFavoriteCoach($c) : false,
        ];
    }

    /**
     * @param Session[] $sessions
     *
     * @return array<string, mixed>
     */
    public function coachDetail(Coach $c, array $sessions = []): array
    {
        $av = [];
        foreach ($c->getAvailabilities() as $a) {
            $av[] = ['dayOfWeek' => $a->getDayOfWeek(), 'startsAt' => $a->getStartsAt()->format('H:i'), 'endsAt' => $a->getEndsAt()->format('H:i')];
        }

        return $this->coachCard($c) + [
            'bio' => $c->getBio(),
            'isValidated' => $c->isValidated(),
            'isComplete' => $c->isComplete(),
            'availabilities' => $av,
            'sessions' => array_map(fn (Session $s) => $this->session($s), $sessions),
            'reviews' => array_map(fn (Review $r) => $this->review($r), $c->getApprovedReviews()),
        ];
    }

    /** @return array<string, mixed> */
    public function courseCard(Course $c): array
    {
        $upcoming = $c->getUpcomingSessions();
        $g = $c->getGym();

        return [
            'id' => $c->getId(),
            'title' => $c->getTitle(),
            'level' => $c->getLevel()->value,
            'durationMinutes' => $c->getDurationMinutes(),
            'price' => (float) $c->getPrice(),
            'capacity' => $c->getCapacity(),
            'imageUrl' => $c->getImageUrl(),
            'activity' => $this->activity($c->getActivity()),
            'gym' => ['id' => $g->getId(), 'name' => $g->getName(), 'city' => $g->getCity()],
            'coach' => $c->getCoach() ? $this->coachCard($c->getCoach()) : null,
            'nextSessionAt' => $upcoming !== [] ? $upcoming[0]->getStartAt()->format(\DateTimeInterface::ATOM) : null,
        ];
    }

    /** @return array<string, mixed> */
    public function courseDetail(Course $c): array
    {
        return $this->courseCard($c) + [
            'description' => $c->getDescription(),
            'sessions' => array_map(fn (Session $s) => $this->session($s), $c->getUpcomingSessions()),
        ];
    }

    /** @return array<string, mixed> */
    public function session(Session $s, bool $withBookingCount = false): array
    {
        $me = $this->me();
        $myBookingId = null;
        if ($me) {
            foreach ($s->getBookings() as $b) {
                if ($b->getUser() === $me && $b->getStatus() !== BookingStatus::ANNULEE) {
                    $myBookingId = $b->getId();
                }
            }
        }
        $course = $s->getCourse();
        $coach = $s->getEffectiveCoach();
        $data = [
            'id' => $s->getId(),
            'title' => $s->getTitle(),
            'startAt' => $s->getStartAt()->format(\DateTimeInterface::ATOM),
            'endAt' => $s->getEndAt()->format(\DateTimeInterface::ATOM),
            'capacity' => $s->getCapacity(),
            'remainingSeats' => $s->getRemainingSeats(),
            'price' => (float) $s->getPrice(),
            'status' => $s->getStatus()->value,
            'location' => $s->getLocation() ?? ($course ? $course->getGym()->getAddress().', '.$course->getGym()->getCity() : null),
            'course' => $course ? ['id' => $course->getId(), 'title' => $course->getTitle(), 'level' => $course->getLevel()->value, 'activity' => $course->getActivity()->getName(), 'gym' => ['id' => $course->getGym()->getId(), 'name' => $course->getGym()->getName(), 'city' => $course->getGym()->getCity()]] : null,
            'coach' => $coach ? $this->coachCard($coach) : null,
            'isBookable' => $s->isBookable(),
            'myBookingId' => $myBookingId,
        ];
        if ($withBookingCount) {
            $data['bookingCount'] = $s->getBookedSeats();
        }

        return $data;
    }

    /** @return array<string, mixed> */
    public function booking(Booking $b, bool $withUser = false): array
    {
        $data = [
            'id' => $b->getId(),
            'bookedAt' => $b->getBookedAt()->format(\DateTimeInterface::ATOM),
            'status' => $b->getStatus()->value,
            'seats' => $b->getSeats(),
            'qrCode' => $b->getQrCode(),
            'session' => $this->session($b->getSession()),
            'canBeCancelled' => $b->canBeCancelled(),
        ];
        if ($withUser) {
            $u = $b->getUser();
            $data['user'] = $this->userShort($u) + ['email' => $u->getEmail()];
        }

        return $data;
    }

    /** @return array<string, mixed> */
    public function review(Review $r): array
    {
        $coach = $r->getCoach();

        return [
            'id' => $r->getId(),
            'rating' => $r->getRating(),
            'comment' => $r->getComment(),
            'createdAt' => $r->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'status' => $r->getStatus()->value,
            'author' => $this->userShort($r->getAuthor()),
            'gym' => $r->getGym() ? ['id' => $r->getGym()->getId(), 'name' => $r->getGym()->getName()] : null,
            'coach' => $coach ? ['id' => $coach->getId(), 'firstName' => $coach->getUser()->getFirstName(), 'lastName' => $coach->getUser()->getLastName()] : null,
        ];
    }

    /**
     * @param list<mixed> $items
     *
     * @return array<string, mixed>
     */
    public function paginated(array $items, int $total, int $page, int $limit): array
    {
        return ['items' => $items, 'total' => $total, 'page' => $page, 'limit' => $limit];
    }
}
