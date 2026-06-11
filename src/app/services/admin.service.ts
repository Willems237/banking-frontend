// services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../models/account.model';
import { UserSummary, CreateStaffPayload } from '../models/admin'; // Ensure '../models/admin.model' exists or update the path
import { AuthUser } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AdminService {

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg =
      error.error?.detail ||
      error.error?.username?.[0] ||
      error.error?.email?.[0] ||
      error.message ||
      'Une erreur est survenue.';
    return throwError(() => ({ status: error.status, message: msg }));
  }

  // Charge utilisateurs + stats en parallèle
  loadDashboard(): Observable<{
    users: UserSummary[];
    total: number;
  }> {
    return this.http
      .get<PaginatedResponse<UserSummary>>(`${this.apiUrl}/users/`)
      .pipe(
        map(res => ({ users: res.results, total: res.count })),
        catchError(err => this.handleError(err))
      );
  }

  getAllUsers(): Observable<UserSummary[]> {
    return this.http
      .get<PaginatedResponse<UserSummary>>(`${this.apiUrl}/users/`)
      .pipe(
        map(res => res.results),
        catchError(err => this.handleError(err))
      );
  }

  toggleUserStatus(
    userId: number,
    isActive: boolean
  ): Observable<AuthUser> {
    return this.http
      .patch<AuthUser>(`${this.apiUrl}/users/${userId}/`, {
        is_active: isActive
      })
      .pipe(catchError(err => this.handleError(err)));
  }

  createStaff(
    payload: CreateStaffPayload
  ): Observable<AuthUser> {
    return this.http
      .post<AuthUser>(`${this.apiUrl}/users/`, payload)
      .pipe(catchError(err => this.handleError(err)));
  }
}