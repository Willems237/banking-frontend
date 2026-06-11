// services/profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthUser } from '../models/auth.model';

export interface UpdateProfilePayload {
  first_name?:  string;
  last_name?:   string;
  email?:       string;
}

export interface UpdateProfilePicturePayload {
  phone_number?: string;
  avatar?:       string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {

  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg =
      error.error?.detail ||
      error.error?.old_password?.[0] ||
      error.error?.new_password?.[0] ||
      error.message ||
      'Une erreur est survenue.';
    return throwError(() => ({ status: error.status, message: msg }));
  }

  /** GET /users/me/ */
  getProfile(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.apiUrl}/me/`)
      .pipe(catchError(err => this.handleError(err)));
  }

  /** PATCH /users/me/ — mise à jour profil */
  updateProfile(
    data: UpdateProfilePayload
  ): Observable<AuthUser> {
    return this.http
      .patch<AuthUser>(`${this.apiUrl}/me/`, data)
      .pipe(catchError(err => this.handleError(err)));
  }

  /** POST /users/change-password/ */
  changePassword(
    payload: ChangePasswordPayload
  ): Observable<{ detail: string }> {
    return this.http
      .post<{ detail: string }>(
        `${this.apiUrl}/change-password/`, payload
      )
      .pipe(catchError(err => this.handleError(err)));
  }
}