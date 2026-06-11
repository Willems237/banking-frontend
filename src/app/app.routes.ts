// app.routes.ts
import { Routes } from '@angular/router';
import {
  authGuard,
  roleGuard,
  guestGuard
} from './guards/auth-guard';               // ✅ point, pas tiret


export const routes: Routes = [

  // ==========================================
  // REDIRECTIONS DE BASE
  // ==========================================
  {
    path:        '',
    redirectTo:  'dashboard',
    pathMatch:   'full'
  },


  // ==========================================
  // PAGES PUBLIQUES
  // (redirige vers /dashboard si déjà connecté)
  // ==========================================
  {
    path:         'login',
    canActivate:  [guestGuard],             // ✅ redirige si déjà connecté
    loadComponent: () =>
      import('./pages/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path:         'unauthorized',
    loadComponent: () =>
      import('./pages/unauthorized/Unauthorized.component')  // ✅ minuscules
        .then(m => m.UnauthorizedComponent)
  },


  // ==========================================
  // ESPACE CLIENT
  // ==========================================
  {
    path:        'dashboard',
    canActivate: [authGuard, roleGuard],
    data:        { roles: ['CUSTOMER', 'MANAGER', 'ADMIN'] }, // ✅ CUSTOMER
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },
  {
    path:        'accounts',
    canActivate: [authGuard, roleGuard],
    data:        { roles: ['CUSTOMER'] },   // ✅ CUSTOMER
    loadComponent: () =>
      import('./pages/accounts/accounts.component')
        .then(m => m.AccountsComponent)
  },
  {
    path:        'transfers',               // ✅ sans 't' final, sans 's'
    canActivate: [authGuard, roleGuard],
    data:        { roles: ['CUSTOMER'] },
    loadComponent: () =>
      import('./pages/transferts/transferts.component')
        .then(m => m.TransfersComponent)
  },
  {
    path:        'transactions',
    canActivate: [authGuard, roleGuard],
    data:        { roles: ['CUSTOMER'] },
    loadComponent: () =>
      import('./pages/transaction/transactions.component')
        .then(m => m.TransactionsComponent)
  },
  {
    path:        'notifications',
    canActivate: [authGuard, roleGuard],
    data:        { roles: ['CUSTOMER', 'MANAGER', 'ADMIN'] },
    loadComponent: () =>
      import('./pages/notification/notification.component')
        .then(m => m.NotificationsComponent)
  },
  {
    path:        'profile',
    canActivate: [authGuard, roleGuard],
    data:        { roles: ['CUSTOMER', 'MANAGER', 'ADMIN'] },
    loadComponent: () =>
      import('./pages/profile/profile.component')
        .then(m => m.ProfileComponent)
  },


  // ==========================================
  // ESPACE GESTIONNAIRE
  // ==========================================
  {
    path:        'manager',                 // ✅ route correcte
    canActivate: [authGuard, roleGuard],
    data:        { roles: ['MANAGER', 'ADMIN'] },
    loadComponent: () =>
      import('./pages/manager-dashboard/manager-dashboard.component')
        .then(m => m.ManagerDashboardComponent)
  },


  // ==========================================
  // ESPACE ADMINISTRATEUR
  // ==========================================
  {
    path:        'admin',                   // ✅ route correcte
    canActivate: [authGuard, roleGuard],
    data:        { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component')
        .then(m => m.AdminDashboardComponent)
  },


  // ==========================================
  // FALLBACK
  // ==========================================
  {
    path:       '**',
    redirectTo: 'dashboard'
  }
];