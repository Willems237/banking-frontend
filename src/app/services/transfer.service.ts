import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Transfer,
  CreateTransferPayload,
  TransferResponse,
  TransferFilters
} from '../models/Transfer.model';
import { PaginatedResponse } from '../models/account.model';


@Injectable({ providedIn: 'root' })
export class TransferService {

  private apiUrl = `${environment.apiUrl}/transfers`;

  constructor(private http: HttpClient) {}


  // ==========================================
  // GESTION D'ERREUR
  // ==========================================
  private handleError(error: HttpErrorResponse): Observable<never> {
    // ✅ Extrait le message DRF le plus précis possible
    let message = 'Une erreur est survenue.';

    if (error.error && typeof error.error === 'object') {
      // Erreurs de validation DRF : { amount: ["Solde insuffisant"] }
      const firstKey = Object.keys(error.error)[0];
      const val      = error.error[firstKey];
      message = Array.isArray(val) ? val[0] : String(val);
    } else if (error.error?.error) {
      // Erreur générique : { error: "..." }
      message = error.error.error;
    }

    console.error('[TransferService]', error.status, message);
    return throwError(() => ({ status: error.status, message }));
  }


  // ==========================================
  // GET — liste paginée (envoyés + reçus)
  // ==========================================
  getTransfers(
    filters: TransferFilters = {}
  ): Observable<PaginatedResponse<Transfer>> {

    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());

    return this.http
      .get<PaginatedResponse<Transfer>>(`${this.apiUrl}/`, { params })
      .pipe(catchError(err => this.handleError(err)));
  }

  /** Version simplifiée — retourne directement le tableau */
  getTransfersList(): Observable<Transfer[]> {
    return this.getTransfers().pipe(
      map(res => res.results)
    );
  }


  // ==========================================
  // GET — un virement par ID
  // ==========================================
  getTransferById(id: number): Observable<Transfer> {
    return this.http
      .get<Transfer>(`${this.apiUrl}/${id}/`)
      .pipe(catchError(err => this.handleError(err)));
  }


  // ==========================================
  // POST — créer un virement
  // ==========================================
  createTransfer(
    payload: CreateTransferPayload
  ): Observable<TransferResponse> {
    return this.http
      .post<TransferResponse>(`${this.apiUrl}/`, payload)
      .pipe(catchError(err => this.handleError(err)));
  }


  // ==========================================
  // ❌ PAS DE update() ni delete() —
  //    Un virement est immuable côté Django
  //    (405 METHOD NOT ALLOWED intentionnel)
  // ==========================================


  // ==========================================
  // HELPERS UTILES POUR LES TEMPLATES
  // ==========================================

  /** Indique si l'utilisateur est l'émetteur */
  isSender(transfer: Transfer, accountNumber: string): boolean {
    return transfer.sender === accountNumber;
  }

  /** Signe du montant selon le sens du virement */
  getAmountSign(transfer: Transfer, accountNumber: string): string {
    return this.isSender(transfer, accountNumber) ? '-' : '+';
  }

  /** Classe CSS selon le sens */
  getAmountClass(transfer: Transfer, accountNumber: string): string {
    return this.isSender(transfer, accountNumber)
      ? 'amount--debit'
      : 'amount--credit';
  }

  /** Contrepartie affichée (l'autre compte) */
  getCounterpart(transfer: Transfer, accountNumber: string): string {
    return this.isSender(transfer, accountNumber)
      ? transfer.receiver
      : transfer.sender;
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