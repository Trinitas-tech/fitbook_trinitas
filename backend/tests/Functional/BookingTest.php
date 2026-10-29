<?php

namespace App\Tests\Functional;

use App\Entity\Notification;
use App\Entity\Session;
use App\Entity\User;
use App\Enum\SessionStatus;

/** US-15, US-16, US-17, US-60, US-61 : réservation, capacité, annulation, e-mails. */
final class BookingTest extends ApiTestCase
{
    /** Séance à venir, réservable, avec la capacité voulue et sans réservation des utilisateurs donnés. */
    private function findBookableSession(int $capacity, string ...$excludedEmails): Session
    {
        $qb = $this->em()->createQueryBuilder()->select('s')->from(Session::class, 's')
            ->andWhere('s.capacity = :cap')->andWhere('s.startAt > :min')->andWhere('s.status = :status')
            ->setParameter('cap', $capacity)->setParameter('min', new \DateTimeImmutable('+3 hours'))
            ->setParameter('status', SessionStatus::PLANIFIEE)->orderBy('s.startAt', 'ASC');
        /** @var Session $session */
        foreach ($qb->getQuery()->getResult() as $session) {
            $taken = false;
            foreach ($session->getBookings() as $b) {
                if (\in_array($b->getUser()->getEmail(), $excludedEmails, true)) {
                    $taken = true;
                }
            }
            if (!$taken && $session->getRemainingSeats() > 0) {
                return $session;
            }
        }
        self::fail('Aucune séance de capacité '.$capacity.' disponible dans les fixtures.');
    }

    public function testBookingRequiresAuthentication(): void
    {
        self::assertSame(401, $this->request('POST', '/api/bookings', ['sessionId' => 1])->getStatusCode());
    }

    public function testBookThenCancel(): void
    {
        $token = $this->login('user5@fitbook.fr');
        $session = $this->findBookableSession(15, 'user5@fitbook.fr');
        $before = $session->getRemainingSeats();

        $response = $this->request('POST', '/api/bookings', ['sessionId' => $session->getId(), 'seats' => 2], $token);
        self::assertSame(201, $response->getStatusCode(), (string) $response->getContent());
        $booking = $this->json($response);
        self::assertSame('confirmee', $booking['status']);
        self::assertSame(2, $booking['seats']);
        self::assertMatchesRegularExpression('/^FB-[0-9A-F]{12}$/', $booking['qrCode']);
        self::assertStringStartsWith('data:image/svg+xml;base64,', $booking['qrCodeDataUri'], 'QR code (US-22)');
        self::assertSame($before - 2, $booking['session']['remainingSeats']);

        // Double réservation refusée
        $response = $this->request('POST', '/api/bookings', ['sessionId' => $session->getId()], $token);
        self::assertSame(409, $response->getStatusCode());

        // Historique
        $mine = $this->json($this->request('GET', '/api/bookings/me?scope=upcoming', null, $token));
        self::assertContains($booking['id'], array_column($mine, 'id'));

        // Annulation (plus de 2 h avant)
        $response = $this->request('PATCH', '/api/bookings/'.$booking['id'].'/cancel', null, $token);
        self::assertSame(200, $response->getStatusCode(), (string) $response->getContent());
        self::assertSame('annulee', $this->json($response)['status']);
        self::assertSame(409, $this->request('PATCH', '/api/bookings/'.$booking['id'].'/cancel', null, $token)->getStatusCode());

        // Deux e-mails tracés : confirmation + annulation (US-61)
        $user = $this->em()->getRepository(User::class)->findOneBy(['email' => 'user5@fitbook.fr']);
        $subjects = array_map(static fn (Notification $n) => $n->getSubject(), $this->em()->getRepository(Notification::class)->findBy(['user' => $user]));
        self::assertStringContainsString('Réservation confirmée', implode(' | ', $subjects));
        self::assertStringContainsString('Réservation annulée', implode(' | ', $subjects));
    }

    public function testCapacityCannotBeExceeded(): void
    {
        // Séance de coaching privé : 1 seule place.
        $session = $this->findBookableSession(1, 'user4@fitbook.fr', 'user5@fitbook.fr');
        $first = $this->login('user4@fitbook.fr');
        $second = $this->login('user5@fitbook.fr');

        self::assertSame(201, $this->request('POST', '/api/bookings', ['sessionId' => $session->getId()], $first)->getStatusCode());

        $response = $this->request('POST', '/api/bookings', ['sessionId' => $session->getId()], $second);
        self::assertSame(409, $response->getStatusCode());
        self::assertSame('Séance complète.', $this->json($response)['message']);

        $detail = $this->json($this->request('GET', '/api/sessions/'.$session->getId()));
        self::assertSame('complete', $detail['status']);
        self::assertSame(0, $detail['remainingSeats']);
    }

    public function testSeatsAreValidated(): void
    {
        $token = $this->login('user3@fitbook.fr');
        $session = $this->findBookableSession(15, 'user3@fitbook.fr');

        self::assertSame(400, $this->request('POST', '/api/bookings', ['sessionId' => $session->getId(), 'seats' => 9], $token)->getStatusCode());
        self::assertSame(400, $this->request('POST', '/api/bookings', ['seats' => 1], $token)->getStatusCode());
        self::assertSame(404, $this->request('POST', '/api/bookings', ['sessionId' => 999999], $token)->getStatusCode());
    }

    public function testUserCannotSeeOrCancelAnotherUsersBooking(): void
    {
        $owner = $this->login('user1@fitbook.fr');
        $other = $this->login('user2@fitbook.fr');
        $mine = $this->json($this->request('GET', '/api/bookings/me?scope=upcoming', null, $owner));
        self::assertNotEmpty($mine);
        $id = $mine[0]['id'];

        self::assertSame(200, $this->request('GET', '/api/bookings/'.$id, null, $owner)->getStatusCode());
        self::assertSame(403, $this->request('GET', '/api/bookings/'.$id, null, $other)->getStatusCode());
        self::assertSame(403, $this->request('PATCH', '/api/bookings/'.$id.'/cancel', null, $other)->getStatusCode());
    }
}
