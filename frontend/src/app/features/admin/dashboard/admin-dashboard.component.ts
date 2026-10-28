import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminStats, errorMessage } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { formatMonthShort } from '../../../core/utils/date.utils';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import {
  BarChartComponent,
  BarSeries,
} from '../../../shared/components/bar-chart/bar-chart.component';
import {
  DonutChartComponent,
  DonutSlice,
} from '../../../shared/components/donut-chart/donut-chart.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AlertComponent, LoaderComponent, BarChartComponent, DonutChartComponent],
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

      <!-- US-54 : graphiques SVG -->
      <div class="charts">
        <section class="card chart-card">
          <h3>Inscriptions par mois</h3>
          <p class="muted small">Nouveaux comptes sur les 6 derniers mois</p>
          <app-bar-chart
            [labels]="registrationLabels()"
            [series]="registrationSeries()"
            ariaLabel="Inscriptions par mois"
            emptyMessage="Aucune inscription sur la période."
          />
        </section>

        <section class="card chart-card">
          <h3>Réservations par mois</h3>
          <p class="muted small">Confirmées et annulées sur les 6 derniers mois</p>
          <app-bar-chart
            [labels]="bookingLabels()"
            [series]="bookingSeries()"
            mode="grouped"
            ariaLabel="Réservations par mois, confirmées et annulées"
            emptyMessage="Aucune réservation sur la période."
          />
        </section>

        <section class="card chart-card">
          <h3>Répartition par statut</h3>
          <p class="muted small">Ensemble des réservations</p>
          <app-donut-chart
            [slices]="statusSlices()"
            centerLabel="réservations"
            ariaLabel="Répartition des réservations par statut"
          />
        </section>

        <section class="card chart-card">
          <h3>Top activités</h3>
          <p class="muted small">Activités les plus réservées</p>
          <app-bar-chart
            [labels]="topActivityLabels()"
            [series]="topActivitySeries()"
            [horizontal]="true"
            ariaLabel="Activités les plus réservées"
            emptyMessage="Pas encore de réservation par activité."
          />
        </section>

        <section class="card chart-card">
          <h3>Top salles</h3>
          <p class="muted small">Salles les plus réservées</p>
          <app-bar-chart
            [labels]="topGymLabels()"
            [series]="topGymSeries()"
            [horizontal]="true"
            ariaLabel="Salles les plus réservées"
            emptyMessage="Pas encore de réservation par salle."
          />
        </section>

        <section class="card chart-card">
          <h3>Raccourcis</h3>
          <div class="flex flex-wrap">
            <a routerLink="/admin/coachs" class="btn btn-outline btn-sm">Valider les coachs</a>
            <a routerLink="/admin/avis" class="btn btn-outline btn-sm">Modérer les avis</a>
            <a routerLink="/admin/activites" class="btn btn-outline btn-sm">Gérer les activités</a>
            <a routerLink="/admin/salles" class="btn btn-outline btn-sm">Gérer les salles</a>
          </div>
        </section>
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
    .charts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }
    .chart-card h3 {
      margin-bottom: 2px;
    }
    .chart-card > p {
      margin-bottom: 14px;
    }
    @media (max-width: 900px) {
      .charts {
        grid-template-columns: 1fr;
      }
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

  // Inscriptions par mois
  readonly registrationLabels = computed(() =>
    (this.stats()?.registrationsByMonth ?? []).map((m) => formatMonthShort(m.month)),
  );
  readonly registrationSeries = computed<BarSeries[]>(() => [
    {
      name: 'Inscriptions',
      values: (this.stats()?.registrationsByMonth ?? []).map((m) => m.count),
    },
  ]);

  // Réservations par mois (2 séries)
  readonly bookingLabels = computed(() =>
    (this.stats()?.bookingsByMonth ?? []).map((m) => formatMonthShort(m.month)),
  );
  readonly bookingSeries = computed<BarSeries[]>(() => {
    const rows = this.stats()?.bookingsByMonth ?? [];
    return [
      { name: 'Confirmées', values: rows.map((m) => m.confirmed), color: 'var(--color-primary)' },
      { name: 'Annulées', values: rows.map((m) => m.cancelled), color: 'var(--color-dark)' },
    ];
  });

  // Répartition par statut
  readonly statusSlices = computed<DonutSlice[]>(() => {
    const by = this.stats()?.bookingsByStatus;
    if (!by) {
      return [];
    }
    return [
      { label: 'Confirmées', value: by.confirmee ?? 0, color: 'var(--color-success)' },
      { label: 'Terminées', value: by.terminee ?? 0, color: 'var(--color-dark)' },
      { label: 'Annulées', value: by.annulee ?? 0, color: 'var(--color-danger)' },
    ];
  });

  // Classements
  readonly topActivityLabels = computed(() =>
    (this.stats()?.topActivities ?? []).map((t) => t.name),
  );
  readonly topActivitySeries = computed<BarSeries[]>(() => [
    { name: 'Réservations', values: (this.stats()?.topActivities ?? []).map((t) => t.bookings) },
  ]);
  readonly topGymLabels = computed(() => (this.stats()?.topGyms ?? []).map((t) => t.name));
  readonly topGymSeries = computed<BarSeries[]>(() => [
    {
      name: 'Réservations',
      values: (this.stats()?.topGyms ?? []).map((t) => t.bookings),
      color: 'var(--color-info)',
    },
  ]);

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
