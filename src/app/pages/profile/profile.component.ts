import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService }    from '../../services/auth.service';
import { ProfileService, ChangePasswordPayload, UpdateProfilePayload } from '../../services/profile.service';
import { AuthUser }       from '../../models/auth.model';

@Component({
  selector:    'app-profile',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls:   ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  currentUser: AuthUser | null = null;

  // ── Formulaires ──
  profileForm:  FormGroup;
  passwordForm: FormGroup;

  // ── État ──
  loadingProfile  = false;
  savingProfile   = false;
  savingPassword  = false;
  showCurrentPwd  = false;
  showNewPwd      = false;
  showConfirmPwd  = false;

  profileError    = '';
  profileSuccess  = '';
  passwordError   = '';
  passwordSuccess = '';

  // ── Onglet actif ──
  activeTab: 'info' | 'password' = 'info';

  constructor(
    private fb:             FormBuilder,
    private authService:    AuthService,
    private profileService: ProfileService,
    private router:         Router
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', Validators.maxLength(50)],
      last_name:  ['', Validators.maxLength(50)],
      email:      ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group(
      {
        old_password:     ['', [Validators.required, Validators.minLength(6)]],
        new_password:     ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }


  ngOnInit(): void {
    // ✅ Charge depuis AuthService en mémoire d'abord — rapide
    this.currentUser = this.authService.getUser();
    this.patchProfileForm(this.currentUser);

    // Puis rafraîchit depuis l'API
    this.loadProfile();
  }


  // ==========================================
  // CHARGEMENT
  // ==========================================
  private loadProfile(): void {
    this.loadingProfile = true;

    this.profileService.getProfile().subscribe({
      next: user => {
        this.currentUser = user;
        this.patchProfileForm(user);
        this.loadingProfile = false;
      },
      error: err => {
        this.profileError   = err.message;
        this.loadingProfile = false;
      }
    });
  }

  private patchProfileForm(user: AuthUser | null): void {
    if (!user) return;
    this.profileForm.patchValue({
      first_name: user.first_name ?? '',
      last_name:  user.last_name  ?? '',
      email:      user.email      ?? '',
    });
  }


  // ==========================================
  // MISE À JOUR PROFIL
  // ==========================================
  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile  = true;
    this.profileError   = '';
    this.profileSuccess = '';

    const payload: UpdateProfilePayload = this.profileForm.value;

    this.profileService.updateProfile(payload).subscribe({
      next: updated => {
        this.currentUser    = updated;
        this.savingProfile  = false;
        this.profileSuccess = 'Profil mis à jour avec succès.';
        setTimeout(() => this.profileSuccess = '', 4000);
      },
      error: err => {
        this.profileError  = err.message;
        this.savingProfile = false;
      }
    });
  }


  // ==========================================
  // CHANGEMENT MOT DE PASSE
  // ==========================================
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword  = true;
    this.passwordError   = '';
    this.passwordSuccess = '';

    const payload: ChangePasswordPayload = {
      old_password: this.passwordForm.value.old_password,
      new_password: this.passwordForm.value.new_password,
    };

    this.profileService.changePassword(payload).subscribe({
      next: res => {
        this.savingPassword  = false;
        this.passwordSuccess = res.detail;
        this.passwordForm.reset();
        // ✅ Déconnexion après changement de mot de passe — sécurité
        setTimeout(() => this.authService.logout(), 2000);
      },
      error: err => {
        this.passwordError  = err.message;
        this.savingPassword = false;
      }
    });
  }


  // ==========================================
  // VALIDATOR PERSONNALISÉ
  // ==========================================
  private passwordMatchValidator(group: AbstractControl) {
    const newPwd     = group.get('new_password')?.value;
    const confirmPwd = group.get('confirm_password')?.value;
    return newPwd === confirmPwd ? null : { passwordMismatch: true };
  }


  // ==========================================
  // HELPERS
  // ==========================================
  get roleLabel(): string {
    const labels: Record<string, string> = {
      ADMIN:    'Administrateur',
      MANAGER:  'Gestionnaire',
      CUSTOMER: 'Client',
    };
    return labels[this.currentUser?.profile?.role ?? ''] ?? '—';
  }

  get userInitials(): string {
    const u = this.currentUser;
    if (!u) return '?';
    if (u.first_name && u.last_name) {
      return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
    }
    return u.username[0].toUpperCase();
  }

  get firstNameCtrl()    { return this.profileForm.get('first_name'); }
  get lastNameCtrl()     { return this.profileForm.get('last_name');  }
  get emailCtrl()        { return this.profileForm.get('email');      }
  get oldPwdCtrl()       { return this.passwordForm.get('old_password'); }
  get newPwdCtrl()       { return this.passwordForm.get('new_password'); }
  get confirmPwdCtrl()   { return this.passwordForm.get('confirm_password'); }
  get passwordMismatch() {
    return this.passwordForm.hasError('passwordMismatch') &&
           this.confirmPwdCtrl?.touched;
  }
}