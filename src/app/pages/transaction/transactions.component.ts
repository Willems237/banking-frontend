import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TransactionService } from '../../services/transaction.service';
import { AccountService }     from '../../services/account.service';
import { NavbarComponent }    from '../../layouts/navbar/navbar.component';
import { SidebarComponent }   from '../../layouts/sidebar/sidebar.component';
import { Transaction, TransactionType, TransactionStatus } from '../../models/transaction.model';
import { Account } from '../../models/account.model';
@Component({
  selector:    'app-transactions',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent, SidebarComponent],
  templateUrl: './transactions.component.html',
  styleUrls:   ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnDestroy {
 
  transactions: Transaction[] = [];
  accounts:     Account[]     = [];
  loading   = false;
  error     = '';
 
  // ── Pagination ──
  currentPage = 1;
  totalCount  = 0;
  pageSize    = 10;
 
  // ── Filtres ──
  filterForm: FormGroup;
 
  readonly typeOptions: { value: string; label: string }[] = [
    { value: '',         label: 'Tous les types'  },
    { value: 'DEPOSIT',  label: 'Dépôts'          },
    { value: 'WITHDRAW', label: 'Retraits'         },
    { value: 'TRANSFER', label: 'Virements'        },
    { value: 'PAYMENT',  label: 'Paiements'        },
    { value: 'PURCHASE', label: 'Achats'           },
  ];
 
  private destroy$ = new Subject<void>();
 
  constructor(
    private transactionService: TransactionService,
    private accountService:     AccountService,
    private fb:                 FormBuilder
  ) {
    this.filterForm = this.fb.group({
      type:    [''],
      account: [''],
    });
  }
 
 
  ngOnInit(): void {
    this.loadAccounts();
    this.loadTransactions();
 
    // ✅ Reload automatique quand les filtres changent
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadTransactions();
    });
  }
 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
 
 
  // ==========================================
  // CHARGEMENT
  // ==========================================
  loadAccounts(): void {
    this.accountService.getAccountsList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: accounts => { this.accounts = accounts; },
        error: () => {}
      });
  }
 
  loadTransactions(): void {
    this.loading = true;
    this.error   = '';
 
    const { type, account } = this.filterForm.value;
 
    this.transactionService.getTransactions({
      type:    type    || undefined,
      account: account || undefined,
      page:    this.currentPage,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.transactions = res.results;
          this.totalCount   = res.count;
          this.loading      = false;
        },
        error: err => {
          this.error   = err.message ?? 'Impossible de charger les transactions.';
          this.loading = false;
        }
      });
  }
 
  clearFilters(): void {
    this.filterForm.reset({ type: '', account: '' });
  }
 
 
  // ==========================================
  // PAGINATION
  // ==========================================
  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
 
  get pages(): number[] {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, this.currentPage - delta);
      i <= Math.min(this.totalPages, this.currentPage + delta);
      i++
    ) { range.push(i); }
    return range;
  }
 
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadTransactions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
 
 
  // ==========================================
  // STATS RAPIDES
  // ==========================================
  get totalDebit(): number {
    return this.transactions
      .filter(t => ['WITHDRAW', 'TRANSFER', 'PAYMENT', 'PURCHASE'].includes(t.type))
      .reduce((s, t) => s + parseFloat(t.amount || '0'), 0);
  }
 
  get totalCredit(): number {
    return this.transactions
      .filter(t => t.type === 'DEPOSIT')
      .reduce((s, t) => s + parseFloat(t.amount || '0'), 0);
  }
 
 
  // ==========================================
  // HELPERS
  // ==========================================
  formatAmount(amount: string): string {
    return this.transactionService.formatAmount(amount);
  }
 
  formatDate(date: string): string {
    return this.transactionService.formatDate(date);
  }
 
  getTypeLabel(type: TransactionType): string {
    return this.transactionService.getTypeLabel(type);
  }
 
  getStatusClass(status: TransactionStatus): string {
    return this.transactionService.getStatusClass(status);
  }
 
  getStatusLabel(status: TransactionStatus): string {
    return this.transactionService.getStatusLabel(status);
  }
 
  getAmountClass(type: TransactionType): string {
    return this.transactionService.getAmountClass(type);
  }
 
  getTypeIcon(type: TransactionType): string {
    const icons: Record<string, string> = {
      DEPOSIT:  'ti-arrow-down-left',
      WITHDRAW: 'ti-arrow-up-right',
      TRANSFER: 'ti-arrows-exchange',
      PAYMENT:  'ti-receipt',
      PURCHASE: 'ti-shopping-cart',
    };
    return icons[type] ?? 'ti-circle';
  }
 
  get hasActiveFilters(): boolean {
    const v = this.filterForm.value;
    return !!(v.type || v.account);
  }
 
  trackById(_: number, item: Transaction): number {
    return item.id;
  }
}