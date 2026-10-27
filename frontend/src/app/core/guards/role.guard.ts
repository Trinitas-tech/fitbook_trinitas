import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/** Fabrique un guard exigeant l'un des rôles donnés. */
export function roleGuard(...roles: Role[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/connexion'], { queryParams: { redirect: state.url } });
    }
    if (roles.some((r) => auth.hasRole(r))) {
      return true;
    }
    toast.error("Vous n'avez pas accès à cet espace.");
    return router.createUrlTree([auth.homeFor(auth.currentUser())]);
  };
}
