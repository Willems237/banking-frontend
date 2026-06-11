import {
  Component, OnInit, OnDestroy,
  HostListener, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService }         from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { AuthUser }            from '../../models/auth.model';
import {
  Notification as BankNotification,
  NotificationType
} from '../../models/notification';


@Component({
  selector:    'app-navbar',
  standalone:  true,
  imports:     [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls:   ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {

  currentUser:  AuthUser | null    = null;
  notifications: BankNotification[] = [];
  unreadCount   = 0;
  showDropdown  = false;
  loadingNotifs = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService:         AuthService,
    private notificationService: NotificationService,
    private elRef:               ElementRef   // ✅ pour détecter clic extérieur
  ) {}


  ngOnInit(): void {
    // ✅ Utilisateur depuis AuthService
    this.authService.getUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => this.currentUser = user);

    // ✅ Badge réactif depuis NotificationService
    this.notificationService.unreadCount
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.unreadCount = count);

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
    this.loadingNotifs = true;

    this.notificationService.getNotificationsList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: notifs => {
          this.notifications = notifs.slice(0, 8); // ✅ Max 8 dans le dropdown
          this.loadingNotifs = false;
        },
        error: () => { this.loadingNotifs = false; }
      });
  }


  // ==========================================
  // DROPDOWN
  // ==========================================
  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    // Recharge au premier affichage
    if (this.showDropdown) {
      this.loadNotifications();
    }
  }

  // ✅ Ferme le dropdown si clic en dehors
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }


  // ==========================================
  // ACTIONS NOTIFICATIONS
  // ==========================================
  markAsRead(notif: BankNotification, event: Event): void {
    event.stopPropagation();
    if (notif.is_read) return;

    // ✅ Persiste côté Django
    this.notificationService.markAsRead(notif.id).subscribe({
      next: () => { notif.is_read = true; }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.is_read = true);
      }
    });
  }


  // ==========================================
  // HELPERS
  // ==========================================
  get userInitials(): string {
    const u = this.currentUser;
    if (!u) return '?';
    if (u.first_name && u.last_name) {
      return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
    }
    return u.username[0].toUpperCase();
  }

  get displayName(): string {
    const u = this.currentUser;
    if (!u) return '';
    return u.first_name
      ? `${u.first_name} ${u.last_name ?? ''}`.trim()
      : u.username;
  }

  getTypeIcon(type: NotificationType): string {
    return this.notificationService.getTypeIcon(type);
  }

  getTypeClass(type: NotificationType): string {
    return this.notificationService.getTypeClass(type);
  }

  getRelativeTime(date: string): string {
    return this.notificationService.getRelativeTime(date);
  }

  trackById(_: number, item: BankNotification): number {
    return item.id;
  }
}

