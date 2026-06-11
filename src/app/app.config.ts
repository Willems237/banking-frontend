// app.config.ts
import {
  ApplicationConfig,
  ErrorHandler,
  inject
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { Router } from '@angular/router';
import { routes }          from './app.routes';
import { authInterceptor } from './interceptors/auth-interceptor';


// ==========================================
// GESTIONNAIRE D'ERREURS GLOBAL
// ==========================================
class GlobalErrorHandler implements ErrorHandler {

  handleError(error: unknown): void {
    const err = error as any;

    // Erreur de chunk manquant → rechargement propre
    // (arrive après un déploiement si l'utilisateur a un ancien bundle)
    if (err?.message?.includes('ChunkLoadError')) {
      console.warn('[GlobalErrorHandler] Chunk manquant — rechargement...');
      window.location.reload();
      return;
    }

    // Log toutes les autres erreurs
    console.error('[GlobalErrorHandler]', error);
  }
}


// ==========================================
// CONFIG
// ==========================================
export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ Gestionnaire d'erreurs personnalisé
    {
      provide:  ErrorHandler,
      useClass: GlobalErrorHandler       // ← votre classe, pas ErrorHandler lui-même
    },

    // ✅ Routing
    provideRouter(
      routes,
      withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),

    // ✅ HTTP + intercepteur JWT
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
  ]
};

