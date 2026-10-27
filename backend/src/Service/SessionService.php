<?php

namespace App\Service;

use App\Entity\Coach;
use App\Entity\Course;
use App\Entity\Session;
use App\Enum\BookingStatus;
use App\Enum\SessionStatus;
use App\Exception\ApiException;
use Doctrine\ORM\EntityManagerInterface;

/** Planification et annulation de séances (US-31, US-32, US-43, US-45). */
class SessionService
{
    public function __construct(private readonly EntityManagerInterface $em, private readonly MailerService $mailer)
    {
    }

    /**
     * Planifie une séance d'un cours, éventuellement répétée chaque semaine (US-43).
     *
     * @return Session[]
     */
    public function createForCourse(Course $course, \DateTimeImmutable $startAt, ?int $capacity, ?string $price, int $repeatWeeks = 0): array
    {
        $capacity ??= $course->getCapacity();
        $price ??= $course->getPrice();
        if ($capacity < 1) {
            throw ApiException::validation(['capacity' => 'La capacité doit être d\'au moins 1.']);
        }
        if ($course->getGym()->getTotalCapacity() > 0 && $capacity > $course->getGym()->getTotalCapacity()) {
            throw ApiException::validation(['capacity' => sprintf('La capacité ne peut pas dépasser celle de la salle (%d).', $course->getGym()->getTotalCapacity())]);
        }
        if ($startAt < new \DateTimeImmutable()) {
            throw ApiException::validation(['startAt' => 'La date de début doit être dans le futur.']);
        }
        $repeatWeeks = max(0, min(12, $repeatWeeks));
        $created = [];
        for ($i = 0; $i <= $repeatWeeks; ++$i) {
            $start = $startAt->modify(sprintf('+%d weeks', $i));
            $session = (new Session())
                ->setCourse($course)
                ->setStartAt($start)
                ->setEndAt($start->modify(sprintf('+%d minutes', $course->getDurationMinutes())))
                ->setCapacity($capacity)
                ->setPrice($price);
            $course->getSessions()->add($session);
            $this->em->persist($session);
            $created[] = $session;
        }
        $this->em->flush();

        return $created;
    }

    /** Crée ou met à jour une séance privée d'un coach, dans ses disponibilités (US-31, US-32). */
    public function saveForCoach(Coach $coach, ?Session $session, \DateTimeImmutable $startAt, int $durationMinutes, ?string $location, int $capacity, string $price): Session
    {
        if ($durationMinutes < 15 || $durationMinutes > 480) {
            throw ApiException::validation(['durationMinutes' => 'Durée entre 15 et 480 minutes.']);
        }
        if ($capacity < 1) {
            throw ApiException::validation(['capacity' => 'La capacité doit être d\'au moins 1.']);
        }
        $endAt = $startAt->modify(sprintf('+%d minutes', $durationMinutes));
        if ($session === null && $startAt < new \DateTimeImmutable()) {
            throw ApiException::validation(['startAt' => 'La date de début doit être dans le futur.']);
        }
        if (!$coach->isAvailable($startAt, $endAt)) {
            throw ApiException::conflict('Ce créneau est en dehors de vos disponibilités hebdomadaires.');
        }
        if ($session !== null && $capacity < $session->getBookedSeats()) {
            throw ApiException::conflict('La capacité ne peut pas être inférieure au nombre de places déjà réservées.');
        }
        $session ??= (new Session())->setCoach($coach);
        $session->setStartAt($startAt)->setEndAt($endAt)->setLocation($location)->setCapacity($capacity)->setPrice($price);
        $session->refreshStatus();
        $this->em->persist($session);
        $this->em->flush();

        return $session;
    }

    /** Suppression définitive : refusée si des réservations confirmées existent (US-31). */
    public function delete(Session $session): void
    {
        foreach ($session->getBookings() as $b) {
            if ($b->getStatus() === BookingStatus::CONFIRMEE) {
                throw ApiException::conflict('Des réservations confirmées existent : annulez la séance plutôt que de la supprimer.');
            }
        }
        $this->em->remove($session);
        $this->em->flush();
    }

    /** Annule la séance, passe toutes les réservations en « annulée » et prévient les sportifs (US-45). */
    public function cancel(Session $session): Session
    {
        if ($session->isCancelled()) {
            throw ApiException::conflict('Cette séance est déjà annulée.');
        }
        $session->setStatus(SessionStatus::ANNULEE);
        foreach ($session->getBookings() as $b) {
            if ($b->getStatus() === BookingStatus::CONFIRMEE) {
                $b->setStatus(BookingStatus::ANNULEE);
                $this->mailer->sendSessionCancelled($b, $session);
            }
        }
        $this->em->flush();

        return $session;
    }
}
