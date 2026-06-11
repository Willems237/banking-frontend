import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { UserSummary, CreateStaffPayload } from '../../models/admin';

@Component({
  selector:    'app-admin-dashboard',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls:   ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

  // ── État ──
  users:      UserSummary[] = [];
  loading     = false;
  submitting  = false;
  error       = '';
  success     = '';

  // ── Stats ──
  totalUsers       = 0;
  totalAdmins      = 0;
  totalManagers    = 0;
  totalCustomers   = 0;

  // ── Modale création ──
  showCreateModal = false;
  staffForm: FormGroup;

  readonly roleOptions = [
    { value: 'MANAGER', label: 'Gestionnaire' },
    { value: 'ADMIN',   label: 'Administrateur' },
  ];

  constructor(
    private adminService: AdminService,
    private fb:           FormBuilder
  ) {
    this.staffForm = this.fb.group({
      username:     ['', [Validators.required, Validators.minLength(3)]],
      email:        ['', [Validators.required, Validators.email]],
      password:     ['', [Validators.required, Validators.minLength(8)]],
      phone_number: [''],
      role:         ['MANAGER', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }


  // ==========================================
  // CHARGEMENT
  // ==========================================
  loadData(): void {
    this.loading = true;
    this.error   = '';

    this.adminService.loadDashboard().subscribe({
      next: ({ users, total }) => {
        this.users      = users;
        this.totalUsers = total;
        this.computeStats(users);
        this.loading    = false;
      },
      error: err => {
        this.error   = err.message;
        this.loading = false;
      }
    });
  }

  private computeStats(users: UserSummary[]): void {
    this.totalAdmins    = users.filter(
      u => u.profile?.role === 'ADMIN'
    ).length;
    this.totalManagers  = users.filter(
      u => u.profile?.role === 'MANAGER'
    ).length;
    this.totalCustomers = users.filter(
      u => u.profile?.role === 'CUSTOMER'
    ).length;
  }


  // ==========================================
  // TOGGLE STATUT UTILISATEUR
  // ==========================================
  toggleUserStatus(user: UserSummary): void {
    const newStatus = !user.is_active;

    this.adminService.toggleUserStatus(user.id, newStatus).subscribe({
      next: () => {
        user.is_active = newStatus;
        this.success   = `Statut de "${user.username}" mis à jour.`;
        setTimeout(() => this.success = '', 3000);
      },
      error: err => {
        this.error = err.message;
      }
    });
  }


  // ==========================================
  // CRÉATION PERSONNEL
  // ==========================================
  openCreateModal(): void {
    this.staffForm.reset({ role: 'MANAGER' });
    this.showCreateModal = true;
    this.error   = '';
    this.success = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onCreateStaff(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error      = '';

    const payload: CreateStaffPayload = this.staffForm.value;

    this.adminService.createStaff(payload).subscribe({
      next: created => {
        this.users.unshift(created as UserSummary);
        this.totalUsers++;
        this.computeStats(this.users);
        this.submitting      = false;
        this.showCreateModal = false;
        this.success         = `Compte ${payload.role} "${created.username}" créé.`;
        setTimeout(() => this.success = '', 4000);
      },
      error: err => {
        this.error      = err.message;
        this.submitting = false;
      }
    });
  }


  // ==========================================
  // HELPERS
  // ==========================================
  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      ADMIN:    'Administrateur',
      MANAGER:  'Gestionnaire',
      CUSTOMER: 'Client',
    };
    return labels[role] ?? role;
  }

  getRoleBadgeClass(role: string): string {
    const classes: Record<string, string> = {
      ADMIN:    'badge--danger',
      MANAGER:  'badge--warning',
      CUSTOMER: 'badge--info',
    };
    return classes[role] ?? 'badge--neutral';
  }

  trackById(_: number, user: UserSummary): number {
    return user.id;
  }

  get usernameCtrl()    { return this.staffForm.get('username');     }
  get emailCtrl()       { return this.staffForm.get('email');        }
  get passwordCtrl()    { return this.staffForm.get('password');     }
  get roleCtrl()        { return this.staffForm.get('role');         }
}