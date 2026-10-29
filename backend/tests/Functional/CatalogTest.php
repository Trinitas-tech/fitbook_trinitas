<?php

namespace App\Tests\Functional;

/** US-10 à US-14 : recherche, filtres et fiches publiques. */
final class CatalogTest extends ApiTestCase
{
    public function testActivitiesArePublic(): void
    {
        $response = $this->request('GET', '/api/activities');

        self::assertSame(200, $response->getStatusCode());
        self::assertCount(10, $this->json($response));
    }

    public function testSearchByKeywordIsCaseInsensitive(): void
    {
        $data = $this->json($this->request('GET', '/api/search?q=YOGA'));

        self::assertGreaterThan(0, $data['total']);
        self::assertNotEmpty($data['courses']);
        foreach ($data['courses'] as $course) {
            $haystack = strtolower(json_encode($course, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));
            self::assertStringContainsString('yoga', $haystack, 'Résultat hors sujet : '.$course['title']);
        }
    }

    public function testSearchFilteredByCityAndType(): void
    {
        $data = $this->json($this->request('GET', '/api/search?city=Paris&type=gym'));

        self::assertCount(2, $data['gyms']);
        self::assertSame([], $data['coaches']);
        self::assertSame([], $data['courses']);
        foreach ($data['gyms'] as $gym) {
            self::assertSame('Paris', $gym['city']);
        }
    }

    public function testGymsSortedByDistanceWhenPositionGiven(): void
    {
        // Position : Lyon → les deux salles lyonnaises doivent arriver avant celles de Paris (US-21).
        $data = $this->json($this->request('GET', '/api/gyms?lat=45.76&lng=4.85'));
        $items = $data['items'];

        self::assertSame('Lyon', $items[0]['city']);
        self::assertSame('Lyon', $items[1]['city']);
        self::assertLessThan($items[2]['distanceKm'], $items[0]['distanceKm']);
    }

    public function testGymDetailContainsOpeningHoursCoursesAndApprovedReviews(): void
    {
        $gyms = $this->json($this->request('GET', '/api/search?type=gym&q=FitZone'))['gyms'];
        self::assertCount(1, $gyms);

        $gym = $this->json($this->request('GET', '/api/gyms/'.$gyms[0]['id']));
        self::assertSame('FitZone Lyon Part-Dieu', $gym['name']);
        self::assertCount(6, $gym['openingHours']);
        self::assertCount(4, $gym['courses']);
        self::assertCount(2, $gym['reviews'], 'L\'avis en attente de modération ne doit pas être visible (US-53).');
        self::assertSame(2, $gym['reviewCount']);
    }

    public function testUnknownGymIs404(): void
    {
        self::assertSame(404, $this->request('GET', '/api/gyms/999999')->getStatusCode());
    }

    public function testOnlyValidatedCoachesAreListed(): void
    {
        $data = $this->json($this->request('GET', '/api/coaches'));
        $names = array_map(static fn (array $c) => $c['lastName'], $data['items']);

        self::assertContains('Dubois', $names);
        self::assertNotContains('Petit', $names, 'Le coach non validé (US-51) ne doit pas être visible.');
    }
}
