<?php

namespace App\Security\Voter;

use App\Entity\Review;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/** Un avis n'est modifiable que par son auteur (US-19). */
class ReviewVoter extends Voter
{
    public const EDIT = 'REVIEW_EDIT';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::EDIT && $subject instanceof Review;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }
        /** @var Review $subject */
        return $user->hasRole('ROLE_ADMIN') || $subject->getAuthor() === $user;
    }
}
