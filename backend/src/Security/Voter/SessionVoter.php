<?php

namespace App\Security\Voter;

use App\Entity\Session;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Séance privée : gérée par son coach. Séance de cours : gérée par le gestionnaire de la salle.
 * Le coach qui anime un cours peut consulter les participants (VIEW) mais pas modifier la séance.
 */
class SessionVoter extends Voter
{
    public const MANAGE = 'SESSION_MANAGE';
    public const VIEW = 'SESSION_VIEW';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return \in_array($attribute, [self::MANAGE, self::VIEW], true) && $subject instanceof Session;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }
        if ($user->hasRole('ROLE_ADMIN')) {
            return true;
        }
        /** @var Session $subject */
        $coach = $user->getCoach();
        if ($subject->getCoach() !== null) {
            return $coach !== null && $subject->getCoach() === $coach;
        }
        $course = $subject->getCourse();
        if ($course === null) {
            return false;
        }
        if ($course->getGym()->getManager() === $user) {
            return true;
        }

        return $attribute === self::VIEW && $coach !== null && $course->getCoach() === $coach;
    }
}
