import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { NavbarComponent }     from '../../layouts/navbar/navbar.component';
import { SidebarComponent }    from '../../layouts/sidebar/sidebar.component';
import {Notification as BankNotification,NotificationType} from '../../models/notification';

@Component({
  selector:    'app-notifications',
  standalone:  true,
  imports:     [CommonModule, RouterModule, NavbarComponent, SidebarComponent],
  templateUrl: './notification.component.html',
  styleUrls:   ['./notification.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
 
  notifications: BankNotification[] = [];
  loading    = false;
  error      = '';
  success    = '';
 
  // ── Pagination ──
  currentPage = 1;
  totalCount  = 0;
  pageSize    = 10;
 
  // ── Filtre ──
  activeFilter: 'ALL' | 'UNREAD' | 'READ' = 'ALL';
 
  private destroy$ = new Subject<void>();
 
  constructor(private notifService: NotificationService) {}
 
 
  ngOnInit(): void {
    this.loadNotifications();
  }
 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
 
 
  // ==========================================
  // CHARGEMENT
  // ==========================================
  loadNotifications(): void {
    this.loading = true;
    this.error   = '';
 
    this.notifService.getNotifications(this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.notifications = res.results;
          this.totalCount    = res.count;
          this.loading       = false;
        },
        error: err => {
          this.error   = err.message ?? 'Impossible de charger les notifications.';
          this.loading = false;
        }
      });
  }
 
 
  // ==========================================
  // FILTRAGE LOCAL
  // ==========================================
  get filteredNotifications(): BankNotification[] {
    switch (this.activeFilter) {
      case 'UNREAD': return this.notifications.filter(n => !n.is_read);
      case 'READ':   return this.notifications.filter(n =>  n.is_read);
      default:       return this.notifications;
    }
  }
 
  get unreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }
 
  setFilter(filter: 'ALL' | 'UNREAD' | 'READ'): void {
    this.activeFilter = filter;
  }
 
 
  // ==========================================
  // ACTIONS
  // ==========================================
  markAsRead(notif: BankNotification): void {
    if (notif.is_read) return;
 
    this.notifService.markAsRead(notif.id).subscribe({
      next: () => { notif.is_read = true; }
    });
  }
 
  markAllAsRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.is_read = true);
        this.success = 'Toutes les notifications marquées comme lues.';
        setTimeout(() => this.success = '', 3000);
      },
      error: err => { this.error = err.message; }
    });
  }
 
 
  // ==========================================
  // PAGINATION
  // ==========================================
  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
 
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadNotifications();
  }
 
 
  // ==========================================
  // HELPERS
  // ==========================================
  getTypeIcon(type: NotificationType): string {
    return this.notifService.getTypeIcon(type);
  }
 
  getTypeClass(type: NotificationType): string {
    return this.notifService.getTypeClass(type);
  }
 
  getTypeLabel(type: NotificationType): string {
    return this.notifService.getTypeLabel(type);
  }
 
  getRelativeTime(date: string): string {
    return this.notifService.getRelativeTime(date);
  }
 
  trackById(_: number, item: BankNotification): number {
    return item.id;
  }
}
 