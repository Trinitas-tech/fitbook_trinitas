<?php

namespace App\Tests\Functional;

use App\Entity\Notification;
use App\Entity\User;

/** US-01, US-02, US-03, US-05 : inscription, confirmation e-mail, connexion, profil. */
final class AuthTest extends ApiTestCase
{
    public function testRegisterValidationErrors(): void
    {
        $response = $this->request('POST', '/api/auth/register', ['email' => 'pas-un-email', 'password' => '123', 'firstName' => '', 'lastName' => 'X', 'role' => 'pirate']);

        self::assertSame(400, $response->getStatusCode());
        $errors = $this->json($response)['errors'];
        self::assertArrayHasKey('email', $errors);
        self::assertArrayHasKey('password', $errors);
        self::assertArrayHasKey('firstName', $errors);
        self::assertArrayHasKey('role', $errors);
    }

    public function testRegisterThenVerifyEmailThenLogin(): void
    {
        $email = 'nouveau.sportif@fitbook.test';
        $response = $this->request('POST', '/api/auth/register', ['email' => $email, 'password' => 'Password123!', 'firstName' => 'Nina', 'lastName' => 'Test', 'role' => 'user']);
        self::assertSame(201, $response->getStatusCode(), (string) $response->getContent());

        // Doublon refusé
        $response = $this->request('POST', '/api/auth/register', ['email' => strtoupper($email), 'password' => 'Password123!', 'firstName' => 'Nina', 'lastName' => 'Test', 'role' => 'user']);
        self::assertSame(409, $response->getStatusCode());

        /** @var User $user */
        $user = $this->em()->getRepository(User::class)->findOneBy(['email' => $email]);
        self::assertFalse($user->isVerified());
        self::assertNotNull($user->getVerificationToken());
        self::assertStringStartsWith('$', (string) $user->getPassword(), 'Le mot de passe doit être hashé.');

        // L'e-mail de confirmation est tracé en table notification
        $notifications = $this->em()->getRepository(Notification::class)->findBy(['user' => $user]);
        self::assertCount(1, $notifications);
        self::assertStringContainsString('Confirmez votre adresse e-mail', $notifications[0]->getSubject());

        // Connexion refusée tant que l'e-mail n'est pas confirmé
        $response = $this->request('POST', '/api/auth/login', ['email' => $email, 'password' => 'Password123!']);
        self::assertSame(403, $response->getStatusCode());

        // Lien invalide puis lien valide
        self::assertSame(400, $this->request('GET', '/api/auth/verify-email?token=inconnu')->getStatusCode());
        $response = $this->request('GET', '/api/auth/verify-email?token='.$user->getVerificationToken());
        self::assertSame(200, $response->getStatusCode(), (string) $response->getContent());

        $token = $this->login($email, 'Password123!');
        $me = $this->json($this->request('GET', '/api/auth/me', null, $token));
        self::assertSame($email, $me['email']);
        self::assertSame(['ROLE_USER'], $me['roles']);
        self::assertTrue($me['isVerified']);
    }

    public function testLoginWithWrongPasswordIsGeneric401(): void
    {
        $response = $this->request('POST', '/api/auth/login', ['email' => 'user1@fitbook.fr', 'password' => 'mauvais-mot-de-passe']);

        self::assertSame(401, $response->getStatusCode());
        self::assertStringNotContainsString('mot de passe', strtolower((string) $this->json($response)['message']), 'Le message ne doit pas révéler quel champ est faux.');
    }

    public function testMeRequiresAuthentication(): void
    {
        self::assertSame(401, $this->request('GET', '/api/auth/me')->getStatusCode());
    }

    public function testUpdateProfile(): void
    {
        $token = $this->login('user2@fitbook.fr');
        $response = $this->request('PUT', '/api/auth/me', ['firstName' => 'Lucas', 'lastName' => 'Roux-Durand', 'phone' => '0601020304', 'avatarUrl' => null], $token);

        self::assertSame(200, $response->getStatusCode(), (string) $response->getContent());
        self::assertSame('Roux-Durand', $this->json($response)['lastName']);
    }
}
