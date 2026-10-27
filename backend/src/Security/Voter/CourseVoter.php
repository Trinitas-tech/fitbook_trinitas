<?php

namespace App\Security\Voter;

use App\Entity\Course;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/** Un cours est géré par le gestionnaire de sa salle (US-42). */
class CourseVoter extends Voter
{
    public const MANAGE = 'COURSE_MANAGE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::MANAGE && $subject instanceof Course;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }
        /** @var Course $subject */
        return $user->hasRole('ROLE_ADMIN') || $subject->getGym()->getManager() === $user;
    }
}
