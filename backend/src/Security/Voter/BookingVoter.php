<?php

namespace App\Security\Voter;

use App\Entity\Booking;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/** Un sportif n'accède qu'à ses propres réservations (US-06, US-17). */
class BookingVoter extends Voter
{
    public const OWN = 'BOOKING_OWN';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::OWN && $subject instanceof Booking;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }
        /** @var Booking $subject */
        return $user->hasRole('ROLE_ADMIN') || $subject->getUser() === $user;
    }
}
