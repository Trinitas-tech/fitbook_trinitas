<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Booking;
use App\Entity\Session;
use App\Entity\User;
use App\Enum\BookingStatus;
use App\Enum\SessionStatus;
use PHPUnit\Framework\TestCase;

/** US-60 : contrôle de capacité et statut d'une séance. */
final class SessionTest extends TestCase
{
    private function session(int $capacity, string $start = '+2 days'): Session
    {
        $startAt = new \DateTimeImmutable($start);

        return (new Session())->setStartAt($startAt)->setEndAt($startAt->modify('+1 hour'))->setCapacity($capacity)->setPrice('10.00');
    }

    private function book(Session $session, int $seats, BookingStatus $status = BookingStatus::CONFIRMEE): Booking
    {
        $booking = (new Booking(new User(), $session, $seats))->setStatus($status);
        $session->getBookings()->add($booking);

        return $booking;
    }

    public function testRemainingSeatsIgnoresCancelledBookings(): void
    {
        $session = $this->session(10);
        $this->book($session, 3);
        $this->book($session, 2, BookingStatus::ANNULEE);
        $this->book($session, 1, BookingStatus::TERMINEE);

        self::assertSame(4, $session->getBookedSeats());
        self::assertSame(6, $session->getRemainingSeats());
    }

    public function testRemainingSeatsNeverNegative(): void
    {
        $session = $this->session(1);
        $this->book($session, 5);

        self::assertSame(0, $session->getRemainingSeats());
    }

    public function testRefreshStatusSwitchesBetweenPlanifieeAndComplete(): void
    {
        $session = $this->session(2);
        self::assertSame(SessionStatus::PLANIFIEE, $session->getStatus());

        $booking = $this->book($session, 2);
        $session->refreshStatus();
        self::assertSame(SessionStatus::COMPLETE, $session->getStatus());
        self::assertFalse($session->isBookable());

        $booking->setStatus(BookingStatus::ANNULEE);
        $session->refreshStatus();
        self::assertSame(SessionStatus::PLANIFIEE, $session->getStatus());
        self::assertTrue($session->isBookable());
    }

    public function testRefreshStatusDoesNotReviveCancelledSession(): void
    {
        $session = $this->session(5)->setStatus(SessionStatus::ANNULEE);
        $session->refreshStatus();

        self::assertSame(SessionStatus::ANNULEE, $session->getStatus());
        self::assertFalse($session->isBookable());
    }

    public function testPastSessionIsNotBookable(): void
    {
        $session = $this->session(5, '-1 day');

        self::assertTrue($session->isPast());
        self::assertFalse($session->isBookable());
    }

    public function testTitleOfPrivateCoachingWithoutCourse(): void
    {
        self::assertSame('Coaching privé', $this->session(1)->getTitle());
    }
}
