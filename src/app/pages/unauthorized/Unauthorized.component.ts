import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ Ajouté pour corriger le warning *ngIf
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector:    'app-unauthorized',
  standalone:  true,
  // ✅ CommonModule ajouté aux côtés de RouterModule
  imports:     [CommonModule, RouterModule],              
  templateUrl: './Unauthorized.component.html',
  styleUrls:   ['./Unauthorized.component.css']
})
export class UnauthorizedComponent implements OnInit {

  userRole: string | null = null;

  constructor(
    private router:      Router,
    private authService: AuthService        // ✅ via service — pas de localStorage direct
  ) {}

  ngOnInit(): void {
    // ✅ Rôle lu depuis AuthService
    this.userRole = this.authService.getRole();
  }

  /** Redirige vers le bon dashboard selon le rôle */
  returnToDashboard(): void {
    switch (this.userRole) {
      case 'ADMIN':    this.router.navigate(['/admin']);     break;
      case 'MANAGER':  this.router.navigate(['/manager']);   break;
      case 'CUSTOMER':
      default:         this.router.navigate(['/dashboard']); break;
    }
  }

  /** Déconnexion propre via AuthService */
  logout(): void {
    this.authService.logout();   // ✅ gère localStorage + navigation + stream
  }
}
