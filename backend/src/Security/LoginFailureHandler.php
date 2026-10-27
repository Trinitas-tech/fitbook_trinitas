<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AccountStatusException;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

/**
 * Échec de connexion : 403 avec message explicite si le compte est non vérifié / désactivé,
 * sinon 401 avec un message générique (US-03).
 */
class LoginFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        if ($exception instanceof AccountStatusException) {
            return new JsonResponse(['message' => $exception->getMessageKey()], Response::HTTP_FORBIDDEN);
        }

        return new JsonResponse(['message' => 'Identifiants invalides.'], Response::HTTP_UNAUTHORIZED);
    }
}
