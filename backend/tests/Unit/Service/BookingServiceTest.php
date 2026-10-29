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
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;

/** Règles métier de réservation (US-15, US-17, US-60, US-61) testées sans base de données. */
final class BookingServiceTest extends TestCase
{
    private EntityManagerInterface&Stub $em;
    private SessionRepository&Stub $sessions;
    private MailerService&MockObject $mailer;

    protected function setUp(): void
    {
        $this->em = $this->createStub(EntityManagerInterface::class);
        $this->sessions = $this->createStub(SessionRepository::class);
        $this->mailer = $this->createMock(MailerService::class);
        // Le service exécute la réservation dans une transaction : on l'exécute directement.
        $this->em->method('wrapInTransaction')->willReturnCallback(static fn (callable $fn) => $fn());
    }

    private function service(?EntityManagerInterface $em = null): BookingService
    {
        return new BookingService($em ?? $this->em, $this->sessions, $this->mailer);
    }

    /** Gestionnaire d'entités espion, pour vérifier les appels à persist(). */
    private function emMock(): EntityManagerInterface&MockObject
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('wrapInTransaction')->willReturnCallback(static fn (callable $fn) => $fn());

        return $em;
    }

    private function session(int $capacity, string $start = '+2 days'): Session
    {
        $startAt = new \DateTimeImmutable($start);

        return (new Session())->setStartAt($startAt)->setEndAt($startAt->modify('+1 hour'))->setCapacity($capacity)->setPrice('10.00');
    }

    /** @return array{Session, BookingService} */
    private function bookable(int $capacity): array
    {
        $session = $this->session($capacity);
        $this->sessions->method('findForUpdate')->willReturn($session);
        $this->mailer->expects(self::once())->method('sendBookingConfirmation');

        return [$session, $this->service()];
    }

    /** @return array{Session, BookingService} */
    private function notBookable(Session $session): array
    {
        $this->sessions->method('findForUpdate')->willReturn($session);
        $this->mailer->expects(self::never())->method('sendBookingConfirmation');

        return [$session, $this->service()];
    }

    public function testSeatsMustBeBetweenOneAndFive(): void
    {
        $this->mailer->expects(self::never())->method('sendBookingConfirmation');

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Données invalides.');
        $this->service()->book(new User(), 1, 6);
    }

    public function testBookingUnknownSessionIsNotFound(): void
    {
        $this->sessions->method('findForUpdate')->willReturn(null);
        $this->mailer->expects(self::never())->method('sendBookingConfirmation');

        try {
            $this->service()->book(new User(), 999);
            self::fail('Une exception 404 était attendue.');
        } catch (ApiException $e) {
            self::assertSame(404, $e->getStatusCode());
        }
    }

    public function testBookingConfirmsAndSendsEmail(): void
    {
        [$session] = $this->bookable(2);
        $em = $this->emMock();
        $em->expects(self::once())->method('persist')->with(self::isInstanceOf(Booking::class));

        $booking = $this->service($em)->book(new User(), 1, 2);

        self::assertSame(BookingStatus::CONFIRMEE, $booking->getStatus());
        self::assertSame(2, $booking->getSeats());
        self::assertSame(0, $session->getRemainingSeats());
        self::assertSame(SessionStatus::COMPLETE, $session->getStatus());
    }

    public function testCannotExceedCapacity(): void
    {
        $session = $this->session(1);
        $session->getBookings()->add(new Booking(new User(), $session));
        [, $service] = $this->notBookable($session);

        try {
            $service->book(new User(), 1);
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
        [, $service] = $this->notBookable($session);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Vous avez déjà réservé cette séance.');
        $service->book($user, 1);
    }

    public function testCancelledBookingIsReactivatedInsteadOfDuplicated(): void
    {
        $user = new User();
        [$session] = $this->bookable(10);
        $old = (new Booking($user, $session))->setStatus(BookingStatus::ANNULEE);
        $session->getBookings()->add($old);
        $em = $this->emMock();
        $em->expects(self::never())->method('persist');

        $booking = $this->service($em)->book($user, 1);

        self::assertSame($old, $booking);
        self::assertSame(BookingStatus::CONFIRMEE, $booking->getStatus());
    }

    public function testCannotBookPastSession(): void
    {
        [, $service] = $this->notBookable($this->session(10, '-1 hour'));

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Cette séance est déjà passée.');
        $service->book(new User(), 1);
    }

    public function testCannotBookCancelledSession(): void
    {
        [, $service] = $this->notBookable($this->session(10)->setStatus(SessionStatus::ANNULEE));

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Cette séance a été annulée.');
        $service->book(new User(), 1);
    }

    public function testCancelFreesSeatAndSendsEmail(): void
    {
        $session = $this->session(1);
        $booking = new Booking(new User(), $session);
        $session->getBookings()->add($booking);
        $session->refreshStatus();
        self::assertSame(SessionStatus::COMPLETE, $session->getStatus());
        $this->mailer->expects(self::once())->method('sendBookingCancellation')->with($booking, false);

        $this->service()->cancel($booking);

        self::assertSame(BookingStatus::ANNULEE, $booking->getStatus());
        self::assertSame(SessionStatus::PLANIFIEE, $session->getStatus());
        self::assertSame(1, $session->getRemainingSeats());
    }

    public function testCancelRefusedLessThanTwoHoursBeforeUnlessForced(): void
    {
        $session = $this->session(5, '+30 minutes');
        $booking = new Booking(new User(), $session);
        // Seule l'annulation forcée (administrateur, US-52) envoie l'e-mail.
        $this->mailer->expects(self::once())->method('sendBookingCancellation')->with($booking, true);
        $service = $this->service();

        try {
            $service->cancel($booking);
            self::fail('Une exception 409 était attendue.');
        } catch (ApiException $e) {
            self::assertSame(409, $e->getStatusCode());
        }
        self::assertSame(BookingStatus::CONFIRMEE, $booking->getStatus());

        $service->cancel($booking, true);
        self::assertSame(BookingStatus::ANNULEE, $booking->getStatus());
    }
}
