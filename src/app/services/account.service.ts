import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Account,
  CreateAccountPayload,
  UpdateAccountPayload,
  PaginatedResponse
} from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {

  private apiUrl = `${environment.apiUrl}/accounts`;

  constructor(private http: HttpClient) {}


  // ==========================================
  // GESTION D'ERREUR CENTRALISÉE
  // ==========================================
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur est survenue.';

    if (error.error && typeof error.error === 'object') {
      // ✅ Extrait le premier message d'erreur Django DRF
      const firstKey = Object.keys(error.error)[0];
      const val = error.error[firstKey];
      message = Array.isArray(val) ? val[0] : val;
    } else if (error.message) {
      message = error.message;
    }

    console.error('[AccountService]', error.status, message);
    return throwError(() => ({ status: error.status, message }));
  }


  // ==========================================
  // GET — liste paginée
  // ==========================================
  getAccounts(page: number = 1): Observable<PaginatedResponse<Account>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http
      .get<PaginatedResponse<Account>>(`${this.apiUrl}/`, { params })
      .pipe(catchError(err => this.handleError(err)));
  }

  /** Version simplifiée — retourne directement le tableau */
  getAccountsList(): Observable<Account[]> {
    return this.getAccounts().pipe(
      map(res => res.results)
    );
  }


  // ==========================================
  // GET — un compte par ID
  // ==========================================
  getAccountById(id: number): Observable<Account> {
    return this.http
      .get<Account>(`${this.apiUrl}/${id}/`)
      .pipe(catchError(err => this.handleError(err)));
  }


  // ==========================================
  // POST — créer un compte
  // ==========================================
  createAccount(data: CreateAccountPayload): Observable<Account> {
    return this.http
      .post<Account>(`${this.apiUrl}/`, data)
      .pipe(catchError(err => this.handleError(err)));
  }


  // ==========================================
  // PATCH — modifier label ou statut
  // ==========================================
  updateAccount(id: number, data: UpdateAccountPayload): Observable<Account> {
    return this.http
      .patch<Account>(`${this.apiUrl}/${id}/`, data)
      .pipe(catchError(err => this.handleError(err)));
  }


  // ==========================================
  // DELETE — désactivation douce (soft delete)
  // ==========================================
  deleteAccount(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/${id}/`)
      .pipe(catchError(err => this.handleError(err)));
  }


  // ==========================================
  // HELPERS UTILES
  // ==========================================

  /** Solde formaté en FCFA */
  formatBalance(balance: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style:                'currency',
      currency:             'XAF',
      maximumFractionDigits: 0,
    }).format(parseFloat(balance));
  }

  /** Numéro de compte masqué */
  maskAccountNumber(accountNumber: string): string {
    return `ACC-••••${accountNumber.slice(-4)}`;
  }
}