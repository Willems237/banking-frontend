
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Notification,
  NotificationType,
  UnreadCountResponse,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_ICONS
} from '../models/notification'; // Update the path if the file exists with a different name or location
import { PaginatedResponse } from '../models/account.model';


@Injectable({ providedIn: 'root' })
export class NotificationService {

  private apiUrl = `${environment.apiUrl}/notifications`;

  // ✅ Badge en temps réel dans la navbar
  private unreadCount$ = new BehaviorSubject<number>(0);
  unreadCount = this.unreadCount$.asObservable();

  constructor(private http: HttpClient) {
    this.refreshUnreadCount();
  }


  // ==========================================
  // GESTION D'ERREUR
  // ==========================================
  private handleError(error: HttpErrorResponse): Observable<never> {
    const message =
      error.error?.detail ||
      error.error?.message ||
      'Erreur lors du chargement des notifications.';
    console.error('[NotificationService]', error.status, message);
    return throwError(() => ({ status: error.status, message }));
  }


  // ==========================================
  // GET — liste paginée
  // ==========================================
  getNotifications(
    page: number = 1
  ): Observable<PaginatedResponse<Notification>> {
    return this.http
      .get<PaginatedResponse<Notification>>(
        `${this.apiUrl}/`,
        { params: { page: page.toString() } }
      )
      .pipe(catchError(err => this.handleError(err)));
  }

  /** Version simplifiée — retourne directement le tableau */
  getNotificationsList(): Observable<Notification[]> {
    return this.getNotifications().pipe(
      map(res => res.results)
    );
  }


  // ==========================================
  // GET — nombre de non lues (badge navbar)
  // ==========================================
  refreshUnreadCount(): void {
    this.http
      .get<UnreadCountResponse>(`${this.apiUrl}/unread-count/`)
      .pipe(catchError(() => throwError(() => null)))
      .subscribe(res => {
        if (res) this.unreadCount$.next(res.unread_count);
      });
  }


  // ==========================================
  // PATCH — marquer une notification comme lue
  // ==========================================
  markAsRead(id: number): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string }>(`${this.apiUrl}/${id}/mark-read/`, {})
      .pipe(
        tap(() => {
          // ✅ Décrémente le badge localement sans re-fetch
          const current = this.unreadCount$.value;
          if (current > 0) this.unreadCount$.next(current - 1);
        }),
        catchError(err => this.handleError(err))
      );
  }


  // ==========================================
  // PATCH — tout marquer comme lu
  // ==========================================
  markAllAsRead(): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string }>(`${this.apiUrl}/mark-all-read/`, {})
      .pipe(
        tap(() => this.unreadCount$.next(0)),   // ✅ remet le badge à 0
        catchError(err => this.handleError(err))
      );
  }


  // ==========================================
  // HELPERS POUR LES TEMPLATES
  // ==========================================

  getTypeLabel(type: NotificationType): string {
    return NOTIFICATION_TYPE_LABELS[type] ?? type;
  }

  getTypeIcon(type: NotificationType): string {
    return NOTIFICATION_TYPE_ICONS[type] ?? 'ti-bell';
  }

  /** Classe CSS selon le type de notification */
  getTypeClass(type: NotificationType): string {
    const classes: Partial<Record<NotificationType, string>> = {
      TRANSFER_SENT:     'notif--info',
      TRANSFER_RECEIVED: 'notif--success',
      DEPOSIT:           'notif--success',
      WITHDRAW:          'notif--warning',
      PAYMENT:           'notif--info',
      LOGIN:             'notif--neutral',
      ERROR:             'notif--danger',
    };
    return classes[type] ?? 'notif--neutral';
  }

  /** Date relative (ex: "il y a 5 min") */
  getRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);

    if (mins  <  1) return "À l'instant";
    if (mins  < 60) return `Il y a ${mins} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days  <  7) return `Il y a ${days}j`;

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: 'short'
    }).format(new Date(dateStr));
  }
}