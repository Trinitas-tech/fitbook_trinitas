import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminStats, errorMessage } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AlertComponent, LoaderComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Statistiques globales</h1>
    </div>
    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (stats(); as s) {
      <div class="grid-4 mb-16">
        <a routerLink="/admin/utilisateurs" class="kpi kpi-link">
          <div class="kpi-label">Utilisateurs inscrits</div>
          <div class="kpi-value">{{ s.users }}</div>
        </a>
        <a routerLink="/admin/reservations" class="kpi kpi-link">
          <div class="kpi-label">Réservations</div>
          <div class="kpi-value">{{ s.bookings }}</div>
        </a>
        <div class="kpi">
          <div class="kpi-label">Séances</div>
          <div class="kpi-value">{{ s.sessions }}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Taux de remplissage</div>
          <div class="kpi-value">{{ fillRate() }}</div>
          <div class="bar"><div class="bar-fill" [style.width]="fillRate()"></div></div>
        </div>
      </div>
      <div class="card">
        <h3>Raccourcis</h3>
        <div class="flex flex-wrap">
          <a routerLink="/admin/coachs" class="btn btn-outline btn-sm">Valider les coachs</a>
          <a routerLink="/admin/avis" class="btn btn-outline btn-sm">Modérer les avis</a>
          <a routerLink="/admin/activites" class="btn btn-outline btn-sm">Gérer les activités</a>
          <a routerLink="/admin/salles" class="btn btn-outline btn-sm">Gérer les salles</a>
        </div>
      </div>
    }
  `,
  styles: `
    .kpi-link {
      color: inherit;
      display: block;
    }
    .kpi-link:hover {
      text-decoration: none;
      box-shadow: var(--shadow-hover);
    }
    .bar {
      height: 8px;
      background: var(--color-border);
      border-radius: 999px;
      margin-top: 10px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--color-primary);
      border-radius: 999px;
    }
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly stats = signal<AdminStats | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly fillRate = computed(() => {
    const s = this.stats();
    if (!s) {
      return '0%';
    }
    const rate = s.fillRate <= 1 ? s.fillRate * 100 : s.fillRate;
    return `${Math.round(rate)}%`;
  });

  ngOnInit(): void {
    this.admin.stats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
