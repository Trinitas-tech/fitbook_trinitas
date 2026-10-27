<?php

namespace App\EventListener;

use App\Exception\ApiException;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/** Convertit toute exception levée sous /api en réponse JSON { message, errors }. */
#[AsEventListener(event: 'kernel.exception', priority: 10)]
class ApiExceptionListener
{
    public function __construct(private readonly Security $security, #[Autowire('%kernel.debug%')] private readonly bool $debug = false)
    {
    }

    public function __invoke(ExceptionEvent $event): void
    {
        $request = $event->getRequest();
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }
        $e = $event->getThrowable();

        if ($e instanceof ApiException) {
            $payload = ['message' => $e->getMessage()];
            if ($e->getErrors() !== []) {
                $payload['errors'] = $e->getErrors();
            }
            $event->setResponse(new JsonResponse($payload, $e->getStatusCode()));

            return;
        }
        if ($e instanceof AccessDeniedException) {
            // Non connecté -> 401, connecté mais sans droit -> 403
            if ($this->security->getUser() === null) {
                $event->setResponse(new JsonResponse(['message' => 'Authentification requise.'], 401));
            } else {
                $event->setResponse(new JsonResponse(['message' => 'Accès refusé.'], 403));
            }

            return;
        }
        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
            $message = match ($status) {
                401 => 'Authentification requise.',
                403 => 'Accès refusé.',
                404 => 'Ressource introuvable.',
                405 => 'Méthode non autorisée.',
                default => $e->getMessage() ?: 'Erreur.',
            };
            $event->setResponse(new JsonResponse(['message' => $message], $status, $e->getHeaders()));

            return;
        }

        $payload = ['message' => 'Erreur interne du serveur.'];
        if ($this->debug) {
            $payload['debug'] = $e->getMessage();
            $payload['file'] = $e->getFile().':'.$e->getLine();
        }
        $event->setResponse(new JsonResponse($payload, 500));
    }
}
