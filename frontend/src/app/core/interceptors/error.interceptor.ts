import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models';
import { AuthService } from '../services/auth.service';

const DEFAULT_MESSAGES: Record<number, string> = {
  0: "Impossible de joindre le serveur. Vérifiez que l'API est démarrée.",
  400: 'Les données envoyées sont invalides.',
  401: 'Vous devez être connecté pour effectuer cette action.',
  403: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  404: 'La ressource demandée est introuvable.',
  409: 'Cette action est impossible (conflit).',
  500: 'Erreur interne du serveur. Réessayez plus tard.',
};

/** Normalise les erreurs HTTP en `ApiError` lisible ; 401 → déconnexion + /connexion. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      const apiError = toApiError(err);
      const isAuthRoute = req.url.includes('/auth/login') || req.url.includes('/auth/me');

      if (apiError.status === 401 && !isAuthRoute) {
        auth.clearSession();
        router.navigate(['/connexion'], { queryParams: { redirect: router.url } });
      }
      return throwError(() => apiError);
    }),
  );
};

function toApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: unknown; errors?: unknown } | null;
    const message =
      body && typeof body.message === 'string' && body.message.trim()
        ? body.message
        : DEFAULT_MESSAGES[err.status] ?? `Erreur ${err.status}`;
    const errors =
      body && typeof body.errors === 'object' && body.errors !== null
        ? (body.errors as Record<string, string>)
        : undefined;
    return { status: err.status, message, errors };
  }
  return { status: 0, message: DEFAULT_MESSAGES[0] };
}
