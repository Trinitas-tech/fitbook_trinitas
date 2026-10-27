<?php

namespace App\Security\Voter;

use App\Entity\Gym;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/** Un gestionnaire ne modifie que ses propres salles (US-06, US-40). */
class GymVoter extends Voter
{
    public const MANAGE = 'GYM_MANAGE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::MANAGE && $subject instanceof Gym;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }
        /** @var Gym $subject */
        return $user->hasRole('ROLE_ADMIN') || $subject->getManager() === $user;
    }
}
