<?php

namespace App\Tests\Unit\Service;

use App\Entity\Booking;
use App\Entity\Session;
use App\Entity\User;
use App\Enum\BookingStatus;
use App\Enum\SessionStatus;
use App\Exception\ApiException;
use App\Repository\SessionRepository;
use App\Service\BookingService;
use App\Service\MailerService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

/** Règles métier de réservation (US-15, US-17, US-60, US-61) testées sans base de données. */
#[AllowMockObjectsWithoutExpectations]
final class BookingServiceTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private SessionRepository&MockObject $sessions;
    private MailerService&MockObject $mailer;
    private BookingService $service;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->sessions = $this->createMock(SessionRepository::class);
        $this->mailer = $this->createMock(MailerService::class);
        // Le service exécute la réservation dans une transaction : on l'exécute directement.
        $this->em->method('wrapInTransaction')->willReturnCallback(static fn (callable $fn) => $fn());
        $this->service = new BookingService($this->em, $this->sessions, $this->mailer);
    }

    private function session(int $capacity, string $start = '+2 days'): Session
    {
        $startAt = new \DateTimeImmutable($start);

        return (new Session())->setStartAt($startAt)->setEndAt($startAt->modify('+1 hour'))->setCapacity($capacity)->setPrice('10.00');
    }

    public function testSeatsMustBeBetweenOneAndFive(): void
    {
        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Données invalides.');
        $this->service->book(new User(), 1, 6);
    }

    public function testBookingUnknownSessionIsNotFound(): void
    {
        $this->sessions->method('findForUpdate')->willReturn(null);

        try {
            $this->service->book(new User(), 999);
            self::fail('Une exception 404 était attendue.');
        } catch (ApiException $e) {
            self::assertSame(404, $e->getStatusCode());
        }
    }

    public function testBookingConfirmsAndSendsEmail(): void
    {
        $session = $this->session(2);
        $this->sessions->method('findForUpdate')->willReturn($session);
        $this->em->expects(self::once())->method('persist')->with(self::isInstanceOf(Booking::class));
        $this->mailer->expects(self::once())->method('sendBookingConfirmation');

        $booking = $this->service->book(new User(), 1, 2);

        self::assertSame(BookingStatus::CONFIRMEE, $booking->getStatus());
        self::assertSame(2, $booking->getSeats());
        self::assertSame(0, $session->getRemainingSeats());
        self::assertSame(SessionStatus::COMPLETE, $session->getStatus());
    }

    public function testCannotExceedCapacity(): void
    {
        $session = $this->session(1);
        $session->getBookings()->add(new Booking(new User(), $session));
        $this->sessions->method('findForUpdate')->willReturn($session);
        $this->mailer->expects(self::never())->method('sendBookingConfirmation');

        try {
            $this->service->book(new User(), 1);
            self::fail('Une exception 409 était attendue.');
        } catch (ApiException $e) {
            self::assertSame(409, $e->getStatusCode());
            self::assertSame('Séance complète.', $e->getMessage());
        }
    }

    public function testCannotBookTwiceTheSameSession(): void
    {
        $user = new User();
        $session = $this->session(10);
        $session->getBookings()->add(new Booking($user, $session));
        $this->sessions->method('findForUpdate')->willReturn($session);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Vous avez déjà réservé cette séance.');
        $this->service->book($user, 1);
    }

    public function testCancelledBookingIsReactivatedInsteadOfDuplicated(): void
    {
        $user = new User();
        $session = $this->session(10);
        $old = (new Booking($user, $session))->setStatus(BookingStatus::ANNULEE);
        $session->getBookings()->add($old);
        $this->sessions->method('findForUpdate')->willReturn($session);
        $this->em->expects(self::never())->method('persist');

        $booking = $this->service->book($user, 1);

        self::assertSame($old, $booking);
        self::assertSame(BookingStatus::CONFIRMEE, $booking->getStatus());
    }

    public function testCannotBookPastOrCancelledSession(): void
    {
        $past = $this->session(10, '-1 hour');
        $cancelled = $this->session(10)->setStatus(SessionStatus::ANNULEE);
        $this->sessions->method('findForUpdate')->willReturnOnConsecutiveCalls($past, $cancelled);

        foreach (['Cette séance est déjà passée.', 'Cette séance a été annulée.'] as $expected) {
            try {
                $this->service->book(new User(), 1);
                self::fail('Une exception 409 était attendue.');
            } catch (ApiException $e) {
                self::assertSame(409, $e->getStatusCode());
                self::assertSame($expected, $e->getMessage());
            }
        }
    }

    public function testCancelFreesSeatAndSendsEmail(): void
    {
        $session = $this->session(1);
        $booking = new Booking(new User(), $session);
        $session->getBookings()->add($booking);
        $session->refreshStatus();
        self::assertSame(SessionStatus::COMPLETE, $session->getStatus());
        $this->mailer->expects(self::once())->method('sendBookingCancellation')->with($booking, false);

        $this->service->cancel($booking);

        self::assertSame(BookingStatus::ANNULEE, $booking->getStatus());
        self::assertSame(SessionStatus::PLANIFIEE, $session->getStatus());
        self::assertSame(1, $session->getRemainingSeats());
    }

    public function testCancelRefusedLessThanTwoHoursBeforeUnlessForced(): void
    {
        $session = $this->session(5, '+30 minutes');
        $booking = new Booking(new User(), $session);

        try {
            $this->service->cancel($booking);
            self::fail('Une exception 409 était attendue.');
        } catch (ApiException $e) {
            self::assertSame(409, $e->getStatusCode());
        }
        self::assertSame(BookingStatus::CONFIRMEE, $booking->getStatus());

        // L'administrateur peut forcer l'annulation (US-52).
        $this->service->cancel($booking, true);
        self::assertSame(BookingStatus::ANNULEE, $booking->getStatus());
    }
}
