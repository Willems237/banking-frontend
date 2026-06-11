import {
  Component, OnInit, OnDestroy, signal
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { AuthUser }    from '../../models/auth.model';

interface MenuItem {
  title:        string;
  icon:         string;     // Tabler Icon class
  route:        string;
  allowedRoles: string[];
}

@Component({
  selector:    'app-sidebar',
  standalone:  true,
  imports:     [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls:   ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  currentUser: AuthUser | null = null;
  collapsed   = false;

  // ── Désabonnement propre ──
  private destroy$ = new Subject<void>();

  // ==========================================
  // MENU — aligné sur app.routes.ts
  // ==========================================
  private allMenuItems: MenuItem[] = [
    {
      title:        'Tableau de bord',
      icon:         'ti-layout-dashboard',
      route:        '/dashboard',
      allowedRoles: ['CUSTOMER', 'MANAGER', 'ADMIN']
    },
    {
      title:        'Mes comptes',
      icon:         'ti-credit-card',
      route:        '/accounts',
      allowedRoles: ['CUSTOMER']
    },
    {
      title:        'Virements',
      icon:         'ti-send',
      route:        '/transfers',              // ✅ sans 't' final
      allowedRoles: ['CUSTOMER']
    },
    {
      title:        'Transactions',
      icon:         'ti-list',
      route:        '/transactions',
      allowedRoles: ['CUSTOMER']
    },
    {
      title:        'Notifications',
      icon:         'ti-bell',
      route:        '/notifications',
      allowedRoles: ['CUSTOMER', 'MANAGER', 'ADMIN']
    },
    {
      title:        'Espace Gestionnaire',
      icon:         'ti-chart-bar',
      route:        '/manager',               // ✅ route correcte
      allowedRoles: ['MANAGER', 'ADMIN']
    },
    {
      title:        'Administration',
      icon:         'ti-settings',
      route:        '/admin',                 // ✅ route correcte
      allowedRoles: ['ADMIN']
    },
    {
      title:        'Mon profil',
      icon:         'ti-user',
      route:        '/profile',
      allowedRoles: ['CUSTOMER', 'MANAGER', 'ADMIN']
    },
  ];

  filteredMenuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private router:      Router
  ) {}


  ngOnInit(): void {
    // ✅ takeUntil évite la fuite mémoire
    this.authService.getUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.filterMenu();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // ==========================================
  // FILTRAGE RBAC
  // ==========================================
  private filterMenu(): void {
    const role = this.currentUser?.profile?.role;
    if (!role) {
      this.filteredMenuItems = [];
      return;
    }
    this.filteredMenuItems = this.allMenuItems.filter(
      item => item.allowedRoles.includes(role)
    );
  }


  // ==========================================
  // ACTIONS
  // ==========================================
  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }

  logout(): void {
    // ✅ Pas de confirm() — l'utilisateur peut toujours annuler
    this.authService.logout();
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

  get roleLabel(): string {
    const labels: Record<string, string> = {
      ADMIN:    'Administrateur',
      MANAGER:  'Gestionnaire',
      CUSTOMER: 'Client',
    };
    return labels[this.currentUser?.profile?.role ?? ''] ?? '';
  }
}