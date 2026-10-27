<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/** Refuse la connexion d'un compte non vérifié (US-02) ou désactivé (US-50). */
class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if (!$user instanceof User) {
            return;
        }
        if (!$user->isActive()) {
            throw new CustomUserMessageAccountStatusException('Ce compte a été désactivé.');
        }
        if (!$user->isVerified()) {
            throw new CustomUserMessageAccountStatusException('Veuillez confirmer votre adresse e-mail avant de vous connecter.');
        }
    }

    public function checkPostAuth(UserInterface $user, ?TokenInterface $token = null): void
    {
    }
}
