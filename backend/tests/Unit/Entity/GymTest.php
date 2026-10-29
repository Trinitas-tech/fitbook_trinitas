<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Gym;
use PHPUnit\Framework\TestCase;

/** US-21 : distance à vol d'oiseau (Haversine). */
final class GymTest extends TestCase
{
    public function testDistanceBetweenLyonAndParis(): void
    {
        $gym = (new Gym())->setLatitude('45.760')->setLongitude('4.857'); // Lyon Part-Dieu

        $km = $gym->distanceTo(48.856, 2.370); // Paris Bastille

        self::assertNotNull($km);
        self::assertEqualsWithDelta(392.0, $km, 5.0);
    }

    public function testDistanceIsZeroAtSamePoint(): void
    {
        $gym = (new Gym())->setLatitude('45.760')->setLongitude('4.857');

        self::assertSame(0.0, $gym->distanceTo(45.760, 4.857));
    }

    public function testDistanceIsNullWithoutCoordinates(): void
    {
        self::assertNull((new Gym())->distanceTo(45.0, 4.0));
    }
}
