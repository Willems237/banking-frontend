import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
 
export interface Account {
  id: number;
  user: string;
  label: string;
  account_type: 'CURRENT' | 'SAVINGS' | 'MOBILE';
  account_number: string;
  balance: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
 
@Component({
  selector: 'app-account-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './account-card.component.html',
  styleUrl: './account-card.component.css',
})
export class AccountCardComponent implements OnInit {
 
  @Input() account!: Account;
  @Input() showActions: boolean = true;
  @Input() compact: boolean = false;
 
  balanceVisible: boolean = false;
 
  get accountIcon(): string {
    const icons: Record<string, string> = {
      CURRENT: '🏦',
      SAVINGS: '💰',
      MOBILE:  '📱',
    };
    return icons[this.account?.account_type] ?? '🏦';
  }
 
  get accountTypeLabel(): string {
    const labels: Record<string, string> = {
      CURRENT: 'Compte Courant',
      SAVINGS: 'Compte Épargne',
      MOBILE:  'Mobile Money',
    };
    return labels[this.account?.account_type] ?? '—';
  }
 
  get maskedNumber(): string {
    if (!this.account?.account_number) return '—';
    const num = this.account.account_number;
    return `ACC-••••${num.slice(-4)}`;
  }
 
  get statusClass(): string {
    return this.account?.is_active ? 'badge--active' : 'badge--inactive';
  }
 
  get cardClass(): string {
    const type = this.account?.account_type?.toLowerCase() ?? 'current';
    return [
      'account-card',
      `account-card--${type}`,
      this.compact ? 'account-card--compact' : ''
    ].filter(Boolean).join(' ');
  }
 
  get formattedBalance(): string {
    if (!this.account?.balance) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    }).format(parseFloat(this.account.balance));
  }
 
  ngOnInit(): void {}
 
  toggleBalance(): void {
    this.balanceVisible = !this.balanceVisible;
  }
 
  copyAccountNumber(): void {
    if (!this.account?.account_number) return;
    navigator.clipboard.writeText(this.account.account_number);
  }
}
 