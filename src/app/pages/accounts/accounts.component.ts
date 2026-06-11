import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { Account, AccountType, CreateAccountPayload } from '../../models/account.model';
// ✅ Import du composant de la carte de compte bancaire
import { AccountCardComponent } from '../../components/account-card/account-card.component'; 

@Component({
  selector: 'app-accounts',
  standalone: true,
  // ✅ Ajout de AccountCardComponent ici pour que le template HTML puisse l'utiliser
  imports: [CommonModule, ReactiveFormsModule, AccountCardComponent], 
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {

  accounts:  Account[] = [];
  loading    = false;
  error      = '';
  success    = '';

  // Modal état
  showCreateModal  = false;
  showDeleteModal  = false;
  accountToDelete: Account | null = null;
  submitting       = false;

  // Formulaire réactif
  createForm: FormGroup;

  readonly accountTypes: { value: AccountType; label: string }[] = [
    { value: 'CURRENT', label: 'Compte Courant' },
    { value: 'SAVINGS', label: 'Compte Épargne' },
    { value: 'MOBILE',  label: 'Mobile Money'   },
  ];

  constructor(
    private accountService: AccountService,
    private fb:             FormBuilder
  ) {
    this.createForm = this.fb.group({
      label:        ['', [Validators.required, Validators.minLength(3)]],
      account_type: ['CURRENT', Validators.required],
      // ✅ Pas de balance — Django la fixe à 0.00
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
  }


  // ==========================================
  // CHARGEMENT
  // ==========================================
  loadAccounts(): void {
    this.loading = true;
    this.error   = '';

    // ✅ getAccountsList() retourne directement Account[]
    this.accountService.getAccountsList().subscribe({
      next: accounts => {
        this.accounts = accounts;
        this.loading  = false;
      },
      error: err => {
        this.error   = err.message ?? 'Impossible de charger les comptes.';
        this.loading = false;
      }
    });
  }


  // ==========================================
  // CRÉATION
  // ==========================================
  openCreateModal(): void {
    this.createForm.reset({ label: '', account_type: 'CURRENT' });
    this.showCreateModal = true;
    this.error   = '';
    this.success = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onCreateAccount(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error      = '';

    const payload: CreateAccountPayload = this.createForm.value;

    this.accountService.createAccount(payload).subscribe({
      next: created => {
        // ✅ Ajout local sans re-fetch
        this.accounts    = [created, ...this.accounts];
        this.submitting  = false;
        this.showCreateModal = false;
        this.success     = `Compte "${created.label}" créé avec succès.`;
        setTimeout(() => this.success = '', 4000);
      },
      error: err => {
        this.error      = err.message ?? 'Erreur lors de la création.';
        this.submitting = false;
      }
    });
  }


  // ==========================================
  // SUPPRESSION (soft delete)
  // ==========================================
  confirmDelete(account: Account): void {
    // ✅ Modale custom au lieu de confirm()
    this.accountToDelete = account;
    this.showDeleteModal = true;
    this.error = '';
  }

  cancelDelete(): void {
    this.accountToDelete = null;
    this.showDeleteModal = false;
  }

  onDeleteAccount(): void {
    if (!this.accountToDelete) return;

    this.submitting = true;

    this.accountService.deleteAccount(this.accountToDelete.id).subscribe({
      next: res => {
        // ✅ Suppression locale sans re-fetch
        this.accounts        = this.accounts.filter(
          a => a.id !== this.accountToDelete!.id
        );
        this.submitting      = false;
        this.showDeleteModal = false;
        this.accountToDelete = null;
        this.success         = res.message ?? 'Compte désactivé avec succès.';
        setTimeout(() => this.success = '', 4000);
      },
      error: err => {
        this.error      = err.message ?? 'Impossible de supprimer ce compte.';
        this.submitting = false;
      }
    });
  }


  // ==========================================
  // HELPERS TEMPLATE
  // ==========================================
  formatBalance(balance: string): string {
    return this.accountService.formatBalance(balance);
  }

  trackById(_: number, account: Account): number {
    return account.id;
  }

  // Accesseurs formulaire pour le template
  get labelCtrl()       { return this.createForm.get('label'); }
  get accountTypeCtrl() { return this.createForm.get('account_type'); }
}
