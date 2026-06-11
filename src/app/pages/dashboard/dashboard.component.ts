import {
  Component, OnInit, AfterViewInit,
  ViewChild, ElementRef, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { AuthService }        from '../../services/auth.service';
import { AccountService }     from '../../services/account.service';
import { TransactionService } from '../../services/transaction.service';
import { Account }     from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';
import { AuthUser }    from '../../models/auth.model';

import { NavbarComponent }  from '../../layouts/navbar/navbar.component';
import { SidebarComponent } from '../../layouts/sidebar/sidebar.component';
import { AccountCardComponent } from '../../components/account-card/account-card.component';

Chart.register(...registerables);

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    AccountCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls:   ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('financialChart')
  chartRef!: ElementRef<HTMLCanvasElement>;

  // ── Données ──
  currentUser: AuthUser | null = null;
  accounts:     Account[]     = [];
  transactions: Transaction[] = [];

  // ── État ──
  loading = true;
  error   = '';
  private chartReady    = false;
  private dataReady     = false;
  private chart: Chart | null = null;

  // ── Stats calculées ──
  totalBalance  = 0;
  totalIncome   = 0;
  totalExpense  = 0;

  constructor(
    private authService:        AuthService,
    private accountService:     AccountService,
    private transactionService: TransactionService,
    private router:             Router
  ) {}


  // ==========================================
  // CYCLE DE VIE
  // ==========================================
  ngOnInit(): void {
    // ✅ Rôle via AuthService — pas de localStorage direct
    this.currentUser = this.authService.getUser();

    // ✅ forkJoin — un seul point de complétion pour les deux requêtes
    forkJoin({
      accounts:     this.accountService.getAccountsList(),
      transactions: this.transactionService.getTransactionsList(),
    }).subscribe({
      next: ({ accounts, transactions }) => {
        this.accounts     = accounts;
        this.transactions = transactions;

        this.computeBalance();
        this.computeStats();

        this.loading   = false;
        this.dataReady = true;
        this.tryInitChart();
      },
      error: err => {
        this.error   = err.message ?? 'Erreur de chargement du tableau de bord.';
        this.loading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    // ✅ Canvas disponible — on tente l'init si les données sont déjà là
    this.chartReady = true;
    this.tryInitChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }


  // ==========================================
  // STATISTIQUES
  // ==========================================
  private computeBalance(): void {
    this.totalBalance = this.accounts.reduce(
      (sum, a) => sum + parseFloat(a.balance || '0'), 0
    );
  }

  private computeStats(): void {
    this.totalIncome  = 0;
    this.totalExpense = 0;

    this.transactions.forEach(tx => {
      const amount = parseFloat(tx.amount || '0');
      if (tx.type === 'DEPOSIT') {
        this.totalIncome += amount;
      } else if (['WITHDRAW', 'TRANSFER', 'PAYMENT', 'PURCHASE'].includes(tx.type)) {
        this.totalExpense += amount;
      }
    });
  }


  // ==========================================
  // GRAPHIQUE
  // ==========================================

  /** ✅ N'initialise que quand canvas ET données sont prêts */
  private tryInitChart(): void {
    if (!this.chartReady || !this.dataReady) return;
    if (this.transactions.length === 0) return;   // état vide géré dans le template
    this.initChart();
  }

  private initChart(): void {
    if (!this.chartRef) return;
    this.chart?.destroy();

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // ✅ Gradient palette Axioma (vert menthe)
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(0, 200, 150, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 200, 150, 0.00)');

    const recent = [...this.transactions].reverse().slice(0, 12);

    const labels = recent.map(tx =>
      new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit', month: 'short'
      }).format(new Date(tx.date))
    );

    const data = recent.map(tx => parseFloat(tx.amount || '0'));

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label:                'Flux de trésorerie',
          data,
          borderColor:          '#00C896',
          backgroundColor:      gradient,
          fill:                 true,
          tension:              0.4,
          borderWidth:          2,
          pointRadius:          3,
          pointHoverRadius:     6,
          pointBackgroundColor: '#00C896',
          pointBorderColor:     '#ffffff',
          pointBorderWidth:     2,
        }]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx =>
                new Intl.NumberFormat('fr-FR', {
                  style: 'currency', currency: 'XAF',
                  maximumFractionDigits: 0
                }).format(ctx.parsed.y)
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'var(--color-text-secondary)', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,.05)' },
            ticks: {
              color: 'var(--color-text-secondary)',
              font: { size: 11 },
              callback: v =>
                new Intl.NumberFormat('fr-FR', {
                  notation: 'compact'
                }).format(v as number)
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }


  // ==========================================
  // HELPERS TEMPLATE
  // ==========================================
  get recentTransactions(): Transaction[] {
    return this.transactions.slice(0, 5);
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  formatAmount(amount: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XAF',
      maximumFractionDigits: 0
    }).format(parseFloat(amount || '0'));
  }

  formatBalance(balance: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XAF',
      maximumFractionDigits: 0
    }).format(balance);
  }

  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      DEPOSIT:  'ti-arrow-down-left',
      WITHDRAW: 'ti-arrow-up-right',
      TRANSFER: 'ti-arrows-exchange',
      PAYMENT:  'ti-receipt',
      PURCHASE: 'ti-shopping-cart',
    };
    return icons[type] ?? 'ti-circle';
  }

  getTransactionClass(type: string): string {
    return ['DEPOSIT'].includes(type) ? 'tx--credit' : 'tx--debit';
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}