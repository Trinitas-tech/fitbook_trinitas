<?php

namespace App\Service;

use App\Entity\Booking;
use App\Entity\User;
use App\Enum\BookingStatus;
use App\Exception\ApiException;
use App\Repository\SessionRepository;
use Doctrine\ORM\EntityManagerInterface;

/** Règles métier de réservation (US-15, US-17, US-60, US-61). */
class BookingService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly SessionRepository $sessions,
        private readonly MailerService $mailer,
    ) {
    }

    /** Réserve en transaction avec verrou sur la séance : impossible de dépasser la capacité. */
    public function book(User $user, int $sessionId, int $seats = 1): Booking
    {
        if ($seats < 1 || $seats > 5) {
            throw ApiException::validation(['seats' => 'Entre 1 et 5 places par réservation.']);
        }

        $booking = $this->em->wrapInTransaction(function () use ($user, $sessionId, $seats): Booking {
            $session = $this->sessions->findForUpdate($sessionId);
            if ($session === null) {
                throw ApiException::notFound('Séance introuvable.');
            }
            if ($session->isCancelled()) {
                throw ApiException::conflict('Cette séance a été annulée.');
            }
            if ($session->isPast()) {
                throw ApiException::conflict('Cette séance est déjà passée.');
            }
            $cancelled = null;
            foreach ($session->getBookings() as $existing) {
                if ($existing->getUser() !== $user) {
                    continue;
                }
                if ($existing->getStatus() !== BookingStatus::ANNULEE) {
                    throw ApiException::conflict('Vous avez déjà réservé cette séance.');
                }
                $cancelled = $existing;
            }
            if ($session->getRemainingSeats() < $seats) {
                throw ApiException::conflict('Séance complète.');
            }

            if ($cancelled !== null) {
                // Une réservation annulée existe (contrainte UNIQUE utilisateur/séance) : on la réactive.
                $booking = $cancelled->setStatus(BookingStatus::CONFIRMEE)->setSeats($seats)->renew();
            } else {
                $booking = new Booking($user, $session, $seats);
                $session->getBookings()->add($booking);
                $this->em->persist($booking);
            }
            $session->refreshStatus();
            $this->em->flush();

            return $booking;
        });

        $this->mailer->sendBookingConfirmation($booking);
        $this->em->flush();

        return $booking;
    }

    /** Annulation par le sportif (délai 2 h) ou par un administrateur (sans délai). */
    public function cancel(Booking $booking, bool $force = false): Booking
    {
        if ($booking->getStatus() !== BookingStatus::CONFIRMEE) {
            throw ApiException::conflict('Cette réservation ne peut plus être annulée.');
        }
        if (!$force && !$booking->canBeCancelled()) {
            throw ApiException::conflict(sprintf('Annulation impossible moins de %d h avant le début de la séance.', Booking::CANCEL_DEADLINE_HOURS));
        }
        $booking->setStatus(BookingStatus::ANNULEE);
        $booking->getSession()->refreshStatus();
        $this->mailer->sendBookingCancellation($booking, $force);
        $this->em->flush();

        return $booking;
    }
}
