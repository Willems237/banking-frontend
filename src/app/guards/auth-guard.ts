// guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

// ==========================================
// GUARD 1 — Vérifie uniquement l'authentification
// ==========================================
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // ✅ Redirige vers login avec l'URL d'origine
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: router.url }
  });
};


// ==========================================
// GUARD 2 — Vérifie le rôle (après authGuard)
// ==========================================
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const expectedRoles = route.data?.['roles'] as string[] | undefined;

  // Pas de restriction de rôle → accès libre
  if (!expectedRoles?.length) {
    return true;
  }

  const userRole = authService.getRole();

  // ✅ Rôle valide
  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  // ✅ Rôle insuffisant → page dédiée (pas juste /login)
  return router.createUrlTree(['/unauthorized']);
};


// ==========================================
// GUARD 3 — Redirige si déjà connecté (page login)
// ==========================================
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Déjà connecté → dashboard
  return router.createUrlTree(['/dashboard']);
};