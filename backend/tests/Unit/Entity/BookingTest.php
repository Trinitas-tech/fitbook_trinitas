<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Booking;
use App\Entity\Session;
use App\Entity\User;
use App\Enum\BookingStatus;
use PHPUnit\Framework\TestCase;

/** US-17 : annulation jusqu'à 2 h avant la séance ; US-22 : code de confirmation. */
final class BookingTest extends TestCase
{
    private function bookingStartingIn(string $modifier): Booking
    {
        $startAt = new \DateTimeImmutable($modifier);
        $session = (new Session())->setStartAt($startAt)->setEndAt($startAt->modify('+1 hour'))->setCapacity(5)->setPrice('10.00');

        return new Booking(new User(), $session);
    }

    public function testCanBeCancelledMoreThanTwoHoursBefore(): void
    {
        self::assertTrue($this->bookingStartingIn('+3 hours')->canBeCancelled());
    }

    public function testCannotBeCancelledLessThanTwoHoursBefore(): void
    {
        self::assertFalse($this->bookingStartingIn('+90 minutes')->canBeCancelled());
    }

    public function testCannotBeCancelledTwice(): void
    {
        $booking = $this->bookingStartingIn('+3 days')->setStatus(BookingStatus::ANNULEE);

        self::assertFalse($booking->canBeCancelled());
    }

    public function testQrCodeFormatAndRenewal(): void
    {
        $booking = $this->bookingStartingIn('+3 days');
        $first = $booking->getQrCode();

        self::assertMatchesRegularExpression('/^FB-[0-9A-F]{12}$/', (string) $first);
        $booking->renew();
        self::assertMatchesRegularExpression('/^FB-[0-9A-F]{12}$/', (string) $booking->getQrCode());
        self::assertNotSame($first, $booking->getQrCode());
    }
}
