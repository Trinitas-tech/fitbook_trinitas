<?php

namespace App\Tests\Functional;

use App\Entity\Gym;
use PHPUnit\Framework\Attributes\DataProvider;

/** US-06 : chaque espace est limité à son rôle (401 anonyme, 403 mauvais rôle, Voters par propriétaire). */
final class PermissionsTest extends ApiTestCase
{
    /** @return iterable<string, array{string, string}> */
    public static function protectedRoutes(): iterable
    {
        yield 'admin' => ['GET', '/api/admin/users'];
        yield 'manager' => ['GET', '/api/manager/gyms'];
        yield 'coach' => ['GET', '/api/coach/profile'];
        yield 'favoris' => ['GET', '/api/favorites/me'];
    }

    #[DataProvider('protectedRoutes')]
    public function testAnonymousIsRejected(string $method, string $uri): void
    {
        self::assertSame(401, $this->request($method, $uri)->getStatusCode());
    }

    public function testSportifCannotAccessOtherSpaces(): void
    {
        $token = $this->login('user1@fitbook.fr');

        self::assertSame(403, $this->request('GET', '/api/admin/users', null, $token)->getStatusCode());
        self::assertSame(403, $this->request('GET', '/api/manager/gyms', null, $token)->getStatusCode());
        self::assertSame(403, $this->request('GET', '/api/coach/profile', null, $token)->getStatusCode());
        self::assertSame(200, $this->request('GET', '/api/favorites/me', null, $token)->getStatusCode());
    }

    public function testCoachAndManagerCannotAdminister(): void
    {
        self::assertSame(403, $this->request('GET', '/api/admin/stats', null, $this->login('coach1@fitbook.fr'))->getStatusCode());
        self::assertSame(403, $this->request('GET', '/api/admin/stats', null, $this->login('manager@fitbook.fr'))->getStatusCode());
        self::assertSame(200, $this->request('GET', '/api/admin/stats', null, $this->login('admin@fitbook.fr'))->getStatusCode());
    }

    public function testManagerOnlySeesAndEditsOwnGyms(): void
    {
        $manager1 = $this->login('manager@fitbook.fr');
        $manager2 = $this->login('manager2@fitbook.fr');
        $mine = $this->json($this->request('GET', '/api/manager/gyms', null, $manager1));
        self::assertCount(2, $mine);
        $gymId = $mine[0]['id'];

        self::assertSame(200, $this->request('GET', '/api/manager/gyms/'.$gymId.'/bookings', null, $manager1)->getStatusCode());
        self::assertSame(403, $this->request('GET', '/api/manager/gyms/'.$gymId.'/bookings', null, $manager2)->getStatusCode());
        self::assertSame(403, $this->request('PATCH', '/api/manager/gyms/'.$gymId, ['name' => 'Piraté'], $manager2)->getStatusCode());

        $gym = $this->em()->getRepository(Gym::class)->find($gymId);
        self::assertNotSame('Piraté', $gym->getName());
    }

    public function testCoachOnlyEditsOwnSessions(): void
    {
        $coach1 = $this->login('coach1@fitbook.fr');
        $coach2 = $this->login('coach2@fitbook.fr');
        $sessions = $this->json($this->request('GET', '/api/coach/sessions', null, $coach1));
        self::assertNotEmpty($sessions);
        $id = $sessions[0]['id'];

        self::assertSame(403, $this->request('PATCH', '/api/coach/sessions/'.$id, ['capacity' => 3], $coach2)->getStatusCode());
        self::assertSame(403, $this->request('DELETE', '/api/coach/sessions/'.$id, null, $coach2)->getStatusCode());
    }

    public function testDeactivatedUserCannotLogin(): void
    {
        $admin = $this->login('admin@fitbook.fr');
        $users = $this->json($this->request('GET', '/api/admin/users?q=user3', null, $admin));
        $user = null;
        foreach ($users['items'] as $u) {
            if ($u['email'] === 'user3@fitbook.fr') {
                $user = $u;
            }
        }
        self::assertNotNull($user);

        $response = $this->request('PATCH', '/api/admin/users/'.$user['id'], ['isActive' => false], $admin);
        self::assertSame(200, $response->getStatusCode(), (string) $response->getContent());
        self::assertSame(403, $this->request('POST', '/api/auth/login', ['email' => 'user3@fitbook.fr', 'password' => 'Password123!'])->getStatusCode());

        $this->request('PATCH', '/api/admin/users/'.$user['id'], ['isActive' => true], $admin);
        self::assertSame(200, $this->request('POST', '/api/auth/login', ['email' => 'user3@fitbook.fr', 'password' => 'Password123!'])->getStatusCode());
    }
}
