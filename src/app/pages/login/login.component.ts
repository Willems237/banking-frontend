import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector:    'app-login',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls:   ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm:    FormGroup;
  error         = '';
  submitting    = false;
  showPassword  = false;
  private returnUrl = '/dashboard';

  constructor(
    private fb:          FormBuilder,
    private authService: AuthService,
    private router:      Router,
    private route:       ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // ✅ Récupère l'URL de retour si redirigé par authGuard
    this.returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';

    // ✅ Déjà connecté → redirige directement
    if (this.authService.isAuthenticated()) {
      this.redirectByRole();
    }
  }


  // ==========================================
  // SOUMISSION
  // ==========================================
  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.error      = '';
    this.submitting = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.submitting = false;
        // ✅ Rôle lu synchronement — pas de subscribe imbriqué
        this.redirectByRole();
      },
      error: err => {
        this.submitting = false;
        this.error = this.getErrorMessage(err.status);
      }
    });
  }


  // ==========================================
  // REDIRECTION SELON RÔLE
  // ==========================================
  private redirectByRole(): void {
    const role = this.authService.getRole();

    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'MANAGER':
        this.router.navigate(['/manager']);
        break;
      default:
        // ✅ Respecte le returnUrl du guard
        this.router.navigateByUrl(this.returnUrl);
    }
  }


  // ==========================================
  // MESSAGES D'ERREUR
  // ==========================================
  private getErrorMessage(status: number): string {
    switch (status) {
      case 400:
      case 401: return 'Identifiant ou mot de passe incorrect.';
      case 403: return 'Accès refusé. Votre compte est peut-être désactivé.';
      case 0:   return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      default:  return 'Une erreur technique est survenue. Veuillez réessayer.';
    }
  }


  // ==========================================
  // HELPERS TEMPLATE
  // ==========================================
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  get usernameCtrl() { return this.loginForm.get('username'); }
  get passwordCtrl() { return this.loginForm.get('password'); }
}