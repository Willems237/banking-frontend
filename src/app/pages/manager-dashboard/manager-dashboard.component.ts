import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ManagerService, ManagerStats } from '../../services/manager.service';
import { Account } from '../../models/account.model';

@Component({
  selector:    'app-manager-dashboard',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrls:   ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit {

  // ── Données ──
  accounts:   Account[]     = [];
  stats:      ManagerStats  = {
    totalAccounts: 0, activeAccounts: 0,
    frozenAccounts: 0, totalFunds: 0
  };

  // ── État ──
  loading    = false;
  submitting = false;
  error      = '';
  success    = '';

  // ── Pagination ──
  currentPage  = 1;
  totalCount   = 0;
  pageSize     = 10;

  // ── Recherche ──
  searchCtrl = new FormControl('');

  constructor(private managerService: ManagerService) {}


  ngOnInit(): void {
    this.loadData();

    // ✅ Recherche avec debounce — évite un appel API par frappe
    this.searchCtrl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });
  }


  // ==========================================
  // CHARGEMENT
  // ==========================================
  loadData(): void {
    this.loading = true;
    this.error   = '';

    this.managerService.getAllAccounts(
      this.searchCtrl.value ?? '',
      this.currentPage
    ).subscribe({
      next: res => {
        this.accounts   = res.results;
        this.totalCount = res.count;
        this.stats      = this.managerService.computeStats(res.results);
        this.loading    = false;
      },
      error: err => {
        this.error   = err.message;
        this.loading = false;
      }
    });
  }


  // ==========================================
  // PAGINATION
  // ==========================================
  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadData();
  }


  // ==========================================
  // TOGGLE STATUT COMPTE
  // ==========================================
  toggleAccountStatus(account: Account): void {
    const newStatus = !account.is_active;
    this.error   = '';

    this.managerService.toggleAccountStatus(account.id, newStatus).subscribe({
      next: () => {
        account.is_active = newStatus;
        // ✅ Recalcule les stats localement sans re-fetch
        this.stats = this.managerService.computeStats(this.accounts);
        this.success = `Compte ${account.account_number} ${
          newStatus ? 'activé' : 'gelé'
        } avec succès.`;
        setTimeout(() => this.success = '', 3000);
      },
      error: err => {
        this.error = err.message ?? 'Erreur lors de la modification du compte.';
      }
    });
  }


  // ==========================================
  // HELPERS
  // ==========================================
  formatAmount(value: number | string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XAF',
      maximumFractionDigits: 0
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  }

  trackById(_: number, item: Account): number {
    return item.id;
  }
}