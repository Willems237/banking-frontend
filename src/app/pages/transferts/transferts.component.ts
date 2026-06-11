import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AccountService }  from '../../services/account.service';
import { TransferService } from '../../services/transfer.service';
import { Account }   from '../../models/account.model';
import { Transfer, CreateTransferPayload } from '../../models/Transfer.model';

import { NavbarComponent }  from '../../layouts/navbar/navbar.component';
import { SidebarComponent } from '../../layouts/sidebar/sidebar.component';

@Component({
  selector:    'app-transfers',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './transferts.component.html',
  styleUrls:   ['./transferts.component.css']
})
export class TransfersComponent implements OnInit {

  // ── Données ──
  accounts:  Account[]  = [];
  transfers: Transfer[] = [];

  // ── État ──
  loadingAccounts  = false;
  loadingHistory   = false;
  submitting       = false;
  error            = '';
  success          = '';

  // ── Compte sélectionné (pré-rempli depuis queryParams) ──
  selectedAccount: Account | null = null;

  // ── Formulaire ──
  transferForm: FormGroup;

  constructor(
    private fb:              FormBuilder,
    private accountService:  AccountService,
    private transferService: TransferService,
    private route:           ActivatedRoute
  ) {
    this.transferForm = this.fb.group({
      sender_id:               ['', Validators.required],
      receiver_account_number: ['', [
        Validators.required,
        Validators.pattern(/^ACC-\d{8}$/)   // ✅ Format ACC-XXXXXXXX
      ]],
      amount:      [null, [Validators.required, Validators.min(1)]],
      description: [''],
    });
  }


  ngOnInit(): void {
    this.loadAccounts();
    this.loadHistory();

    // ✅ Pré-sélection depuis queryParam ?from=3 (lien depuis dashboard)
    this.route.queryParamMap.subscribe(params => {
      const fromId = params.get('from');
      if (fromId) {
        this.transferForm.patchValue({ sender_id: Number(fromId) });
        this.onSenderChange();
      }
    });
  }


  // ==========================================
  // CHARGEMENT
  // ==========================================
  loadAccounts(): void {
    this.loadingAccounts = true;

    this.accountService.getAccountsList().subscribe({
      next: accounts => {
        // ✅ Uniquement les comptes actifs
        this.accounts        = accounts.filter(a => a.is_active);
        this.loadingAccounts = false;
      },
      error: err => {
        this.error           = err.message;
        this.loadingAccounts = false;
      }
    });
  }

  loadHistory(): void {
    this.loadingHistory = true;

    this.transferService.getTransfersList().subscribe({
      next: transfers => {
        this.transfers       = transfers;
        this.loadingHistory  = false;
      },
      error: () => {
        this.loadingHistory = false;
      }
    });
  }


  // ==========================================
  // SÉLECTION DU COMPTE ÉMETTEUR
  // ==========================================
  onSenderChange(): void {
    const id = Number(this.transferForm.value.sender_id);
    this.selectedAccount = this.accounts.find(a => a.id === id) ?? null;
  }

  /** Solde disponible après déduction du montant saisi */
  get balanceAfter(): number | null {
    if (!this.selectedAccount) return null;
    const amount = this.transferForm.value.amount ?? 0;
    return parseFloat(this.selectedAccount.balance) - amount;
  }

  get insufficientBalance(): boolean {
    return this.balanceAfter !== null && this.balanceAfter < 0;
  }


  // ==========================================
  // SOUMISSION
  // ==========================================
  onSubmit(): void {
    if (this.transferForm.invalid || this.insufficientBalance) {
      this.transferForm.markAllAsTouched();
      if (this.insufficientBalance) {
        this.error = 'Solde insuffisant pour effectuer cette opération.';
      }
      return;
    }

    this.submitting = true;
    this.error      = '';
    this.success    = '';

    const payload: CreateTransferPayload = {
      sender_id:               Number(this.transferForm.value.sender_id),
      receiver_account_number: this.transferForm.value.receiver_account_number.trim().toUpperCase(),
      amount:                  this.transferForm.value.amount,
      description:             this.transferForm.value.description || undefined,
    };

    this.transferService.createTransfer(payload).subscribe({
      next: res => {
        this.submitting = false;
        this.success    = res.message;

        // ✅ Mise à jour locale du solde sans re-fetch
        if (this.selectedAccount) {
          const newBalance = parseFloat(this.selectedAccount.balance) - payload.amount;
          this.selectedAccount.balance = newBalance.toFixed(2);

          const idx = this.accounts.findIndex(a => a.id === this.selectedAccount!.id);
          if (idx !== -1) this.accounts[idx].balance = this.selectedAccount.balance;
        }

        // Ajoute le virement en tête d'historique
        this.transfers = [res.data, ...this.transfers];

        // Réinitialise le formulaire
        this.transferForm.reset();
        this.selectedAccount = null;
        setTimeout(() => this.success = '', 5000);
      },
      error: err => {
        this.submitting = false;
        this.error      = err.message;
      }
    });
  }


  // ==========================================
  // HELPERS
  // ==========================================
  formatAmount(value: string | number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XAF',
      maximumFractionDigits: 0
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  }

  getAmountClass(transfer: Transfer): string {
    return this.transferService.getAmountClass(transfer, this.selectedAccount?.account_number ?? '');
  }

  formatDate(date: string): string {
    return this.transferService.formatDate(date);
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }

  get senderIdCtrl()    { return this.transferForm.get('sender_id'); }
  get receiverCtrl()    { return this.transferForm.get('receiver_account_number'); }
  get amountCtrl()      { return this.transferForm.get('amount'); }
}