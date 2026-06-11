// services/manager.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Account, PaginatedResponse } from '../models/account.model';

export interface ManagerStats {
  totalAccounts:  number;
  activeAccounts: number;
  frozenAccounts: number;
  totalFunds:     number;
}

@Injectable({ providedIn: 'root' })
export class ManagerService {

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg =
      error.error?.detail ||
      error.error?.error  ||
      error.message       ||
      'Une erreur est survenue.';
    return throwError(() => ({ status: error.status, message: msg }));
  }

  /** Tous les comptes — paginés + filtre optionnel */
  getAllAccounts(
    search: string = '',
    page:   number = 1
  ): Observable<PaginatedResponse<Account>> {
    let params = new HttpParams().set('page', page.toString());
    if (search.trim()) params = params.set('search', search.trim());

    return this.http
      .get<PaginatedResponse<Account>>(`${this.apiUrl}/accounts/`, { params })
      .pipe(catchError(err => this.handleError(err)));
  }

  /** Calcule les stats depuis la liste reçue */
  computeStats(accounts: Account[]): ManagerStats {
    const active  = accounts.filter(a =>  a.is_active);
    const frozen  = accounts.filter(a => !a.is_active);
    const total   = accounts.reduce(
      (sum, a) => sum + parseFloat(a.balance || '0'), 0
    );
    return {
      totalAccounts:  accounts.length,
      activeAccounts: active.length,
      frozenAccounts: frozen.length,
      totalFunds:     total,
    };
  }

  /** Active ou gèle un compte */
  toggleAccountStatus(
    accountId: number,
    isActive:  boolean
  ): Observable<Account> {
    return this.http
      .patch<Account>(
        `${this.apiUrl}/accounts/${accountId}/`,
        { is_active: isActive }
      )
      .pipe(catchError(err => this.handleError(err)));
  }
}