
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Transaction,
  TransactionFilters,
  TransactionType,
  TransactionStatus,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_STATUS_LABELS
} from '../models/transaction.model';
import { PaginatedResponse } from '../models/account.model';


@Injectable({ providedIn: 'root' })
export class TransactionService {

  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}


  // ==========================================
  // GESTION D'ERREUR
  // ==========================================
  private handleError(error: HttpErrorResponse): Observable<never> {
    const message =
      error.error?.detail ||
      error.error?.message ||
      'Erreur lors de la récupération des transactions.';

    console.error('[TransactionService]', error.status, message);
    return throwError(() => ({ status: error.status, message }));
  }


  // ==========================================
  // GET — liste paginée avec filtres optionnels
  // ==========================================
  getTransactions(
    filters: TransactionFilters = {}
  ): Observable<PaginatedResponse<Transaction>> {

    let params = new HttpParams();

    if (filters.type)    params = params.set('type',    filters.type);
    if (filters.account) params = params.set('account', filters.account.toString());
    if (filters.page)    params = params.set('page',    filters.page.toString());

    return this.http
      .get<PaginatedResponse<Transaction>>(`${this.apiUrl}/`, { params })
      .pipe(catchError(err => this.handleError(err)));
  }

  /** Version simplifiée — retourne directement le tableau */
  getTransactionsList(
    filters: TransactionFilters = {}
  ): Observable<Transaction[]> {
    return this.getTransactions(filters).pipe(
      map(res => res.results)
    );
  }


  // ==========================================
  // GET — transactions d'un compte précis
  // ==========================================
  getTransactionsByAccount(accountId: number): Observable<Transaction[]> {
    return this.getTransactionsList({ account: accountId });
  }


  // ==========================================
  // GET — transactions par type
  // ==========================================
  getTransactionsByType(type: TransactionType): Observable<Transaction[]> {
    return this.getTransactionsList({ type });
  }


  // ==========================================
  // GET — une transaction par ID
  // ==========================================
  getTransactionById(id: number): Observable<Transaction> {
    return this.http
      .get<Transaction>(`${this.apiUrl}/${id}/`)
      .pipe(catchError(err => this.handleError(err)));
  }

  // ==========================================
  // HELPERS UTILES POUR LES TEMPLATES
  // ==========================================

  /** Libellé lisible du type */
  getTypeLabel(type: TransactionType): string {
    return TRANSACTION_TYPE_LABELS[type] ?? type;
  }

  /** Libellé lisible du statut */
  getStatusLabel(status: TransactionStatus): string {
    return TRANSACTION_STATUS_LABELS[status] ?? status;
  }

  /** Classe CSS selon le statut */
  getStatusClass(status: TransactionStatus): string {
    const classes: Record<TransactionStatus, string> = {
      SUCCESS: 'badge--success',
      FAILED:  'badge--danger',
      PENDING: 'badge--warning',
    };
    return classes[status] ?? '';
  }

  /** Classe CSS pour le montant (vert crédit / rouge débit) */
  getAmountClass(type: TransactionType): string {
    const credits: TransactionType[] = ['DEPOSIT'];
    return credits.includes(type) ? 'amount--credit' : 'amount--debit';
  }

  /** Montant formaté en FCFA */
  formatAmount(amount: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style:                'currency',
      currency:             'XAF',
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  }

  /** Date formatée en français */
  formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day:    '2-digit',
      month:  'short',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  }
}