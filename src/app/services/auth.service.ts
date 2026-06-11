import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  AuthUser
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  // Clés localStorage — centralisées
  private readonly KEYS = {
    access:  'access_token',
    refresh: 'refresh_token',
    user:    'auth_user',
  } as const;

  // Streams réactifs
  private currentUser$ = new BehaviorSubject<AuthUser | null>(
    this.loadUser()
  );

  constructor(
    private http:   HttpClient,
    private router: Router
  ) {}


  // ==========================================
  // LOGIN
  // ==========================================
  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login/`, data)
      .pipe(
        tap(res => {
          localStorage.setItem(this.KEYS.access,  res.access);
          localStorage.setItem(this.KEYS.refresh, res.refresh);
          localStorage.setItem(this.KEYS.user,    JSON.stringify(res.user));
          this.currentUser$.next(res.user);
        })
      );
  }


  // ==========================================
  // REFRESH TOKEN
  // ==========================================
  refreshToken(): Observable<RefreshResponse> {
    const refresh = this.getRefreshToken();

    return this.http
      .post<RefreshResponse>(`${this.apiUrl}/refresh/`, { refresh })
      .pipe(
        tap(res => {
          localStorage.setItem(this.KEYS.access, res.access);
          // ✅ Ne touche au refresh que si Django en renvoie un nouveau
          if (res.refresh) {
            localStorage.setItem(this.KEYS.refresh, res.refresh);
          }
        })
      );
  }


  // ==========================================
  // LOGOUT
  // ==========================================
  logout(): void {
    // ✅ Supprime uniquement les clés connues
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
    this.currentUser$.next(null);
    // ✅ Navigation propre via Router — pas de reload brutal
    this.router.navigate(['/login']);
  }


  // ==========================================
  // TOKEN MANAGEMENT
  // ==========================================
  getToken(): string | null {
    return localStorage.getItem(this.KEYS.access);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.KEYS.refresh);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // ✅ Marge de 30s pour éviter les race conditions réseau
      return Date.now() >= (payload.exp * 1000) - 30_000;
    } catch {
      return true;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }


  // ==========================================
  // USER & ROLE
  // ==========================================

  /** Stream réactif — pour les templates avec async pipe */
  getUser$(): Observable<AuthUser | null> {
    return this.currentUser$.asObservable();
  }

  /** Valeur synchrone — pour les guards */
  getUser(): AuthUser | null {
    return this.currentUser$.value;
  }

  /** Rôle synchrone — pour authGuard / roleGuard */
  getRole(): string | null {
    return this.getUser()?.profile?.role ?? null;
  }

  /** Vérifie si l'utilisateur a l'un des rôles donnés */
  hasRole(...roles: string[]): boolean {
    const role = this.getRole();
    return !!role && roles.includes(role);
  }

  /** Helpers pratiques pour les templates */
  get isAdmin():    boolean { return this.hasRole('ADMIN'); }
  get isManager():  boolean { return this.hasRole('ADMIN', 'MANAGER'); }
  get isCustomer(): boolean { return this.hasRole('CUSTOMER'); }


  // ==========================================
  // HELPERS PRIVÉS
  // ==========================================

  /** Recharge l'utilisateur depuis localStorage au démarrage */
  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.KEYS.user);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}