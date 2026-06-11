
// interceptors/auth.interceptor.ts
import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn
} from '@angular/common/http';
import { inject }    from '@angular/core';
import { Router }    from '@angular/router';
import { AuthService } from '../services/auth.service';
import {
  catchError, throwError,
  switchMap, filter, take,
  BehaviorSubject, Observable
} from 'rxjs';


// ==========================================
// STATE — encapsulé dans des closures
// (évite les variables globales de module)
// ==========================================
let isRefreshing  = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);


// ==========================================
// HELPER — ajoute le Bearer token
// ==========================================
function addToken(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}


// ==========================================
// HELPER — requêtes qui ne nécessitent pas d'auth
// ==========================================
function isPublicUrl(url: string): boolean {
  return (
    url.includes('/auth/login/')   ||
    url.includes('/auth/refresh/') ||
    url.includes('/static/')       ||
    url.includes('/media/')
  );
}


// ==========================================
// INTERCEPTEUR PRINCIPAL
// ==========================================
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // ✅ Routes publiques — on passe sans token
  if (isPublicUrl(req.url)) {
    return next(req);
  }

  const token = authService.getToken();

  // Ajoute le token si disponible
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // ── 401 Unauthorized → tente le refresh ──
      if (error.status === 401) {
        return handle401(req, next, authService, router);
      }

      // ── 403 Forbidden → rôle insuffisant ──
      if (error.status === 403) {
        router.navigate(['/unauthorized']);
        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};


// ==========================================
// GESTION DU 401 — refresh + retry
// ==========================================
function handle401(
  req:         HttpRequest<unknown>,
  next:        HttpHandlerFn,
  authService: AuthService,
  router:      Router
): Observable<any> {

  if (!authService.getRefreshToken()) {
    // Pas de refresh token → déconnexion directe
    authService.logout();
    return throwError(() => new Error('Session expirée.'));
  }

  if (!isRefreshing) {
    // ✅ Démarre le refresh — une seule fois même si plusieurs requêtes échouent
    isRefreshing = true;
    refreshDone$.next(null);

    return authService.refreshToken().pipe(
      switchMap(() => {
        isRefreshing = false;
        const newToken = authService.getToken()!;

        // ✅ Notifie les requêtes en attente
        refreshDone$.next(newToken);

        // ✅ Rejoue la requête originale avec le nouveau token
        return next(addToken(req, newToken));
      }),
      catchError(refreshError => {
        isRefreshing = false;
        refreshDone$.next(null);

        // Refresh expiré → déconnexion propre
        authService.logout();
        return throwError(() => refreshError);
      })
    );

  } else {
    // ✅ Refresh déjà en cours — attend le nouveau token puis rejoue
    return refreshDone$.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap(newToken => next(addToken(req, newToken)))
    );
  }
}