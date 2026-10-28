import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CoachProfile, CoachStats, Session, errorMessage } from '../../../core/models';
import { CoachService } from '../../../core/services/coach.service';
import { addDays } from '../../../core/utils/date.utils';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { SessionListComponent } from '../../../shared/components/session-list/session-list.component';

@Component({
  selector: 'app-coach-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AlertComponent,
    LoaderComponent,
    RatingStarsComponent,
    SessionListComponent,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Tableau de bord</h1>
      <a routerLink="/coach/seances/nouvelle" class="btn btn-primary">+ Nouvelle séance</a>
    </div>

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (profile(); as p) {
      @if (!p.isComplete) {
        <app-alert
          type="warning"
          title="Profil incomplet"
          message="Complétez votre profil professionnel (spécialité, bio, tarif, ville) pour apparaître dans la recherche."
        >
          <div class="mt-16">
            <a routerLink="/coach/profil" class="btn btn-primary btn-sm">Compléter mon profil</a>
          </div>
        </app-alert>
      } @else if (!p.isValidated) {
        <app-alert
          type="info"
          title="En attente de validation"
          message="Votre profil est complet. Un administrateur doit le valider avant qu'il soit visible publiquement."
        />
      } @else {
        <app-alert
          type="success"
          title="Profil validé"
          message="Votre profil est visible par les sportifs."
        />
      }

      <!-- US-36 : statistiques du coach -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Mes statistiques</h2>
          @if (statsLoading()) {
            <span class="muted small"
              ><span
                class="spinner"
                style="width: 14px; height: 14px; border-width: 2px; display: inline-block; vertical-align: middle"
              ></span>
              Chargement…</span
            >
          }
        </div>
        <app-alert type="error" [message]="statsError()" />
        <div class="kpi-grid">
          <div class="kpi">
            <div class="kpi-label">Séances données</div>
            <div class="kpi-value">{{ stats()?.sessionsGiven ?? '–' }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Séances à venir</div>
            <div class="kpi-value">{{ stats()?.upcomingSessions ?? upcoming().length }}</div>
            <div class="muted small">{{ upcoming().length }} dans les 14 prochains jours</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Participants accueillis</div>
            <div class="kpi-value">{{ stats()?.totalParticipants ?? '–' }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Taux de remplissage</div>
            <div class="kpi-value">{{ fillRateLabel() }}</div>
            <div
              class="bar"
              role="progressbar"
              aria-label="Taux de remplissage"
              [attr.aria-valuenow]="fillRate()"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div class="bar-fill" [style.width.%]="fillRate()"></div>
            </div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Note moyenne</div>
            <div class="kpi-value rating">
              <app-rating-stars
                [rating]="stats()?.averageRating ?? p.averageRating"
                [showValue]="false"
              />
              <span>{{ ratingLabel() }}</span>
            </div>
            <div class="muted small">{{ reviewCount() }} avis</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Statut</div>
            <div class="kpi-value" style="font-size: 1.1rem">
              @if (!p.isComplete) {
                <span class="badge badge-warning">Incomplet</span>
              } @else if (!p.isValidated) {
                <span class="badge badge-info">En attente</span>
              } @else {
                <span class="badge badge-success">Validé</span>
              }
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Prochaines séances</h2>
          <a routerLink="/coach/seances">Voir le calendrier →</a>
        </div>
        <app-alert type="error" [message]="sessionsError()" />
        <app-session-list
          [sessions]="upcoming()"
          [showBook]="false"
          (select)="open($event)"
          emptyMessage="Aucune séance planifiée dans les 14 prochains jours."
        />
      </section>
    }
  `,
  styles: `
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .kpi-value.rating {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.5rem;
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
      transition: width 0.4s ease;
    }
    @media (max-width: 1024px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 480px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class CoachDashboardComponent implements OnInit {
  private readonly coach = inject(CoachService);
  private readonly router = inject(Router);

  readonly profile = signal<CoachProfile | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly sessions = signal<Session[]>([]);
  readonly sessionsError = signal<string | null>(null);
  readonly stats = signal<CoachStats | null>(null);
  readonly statsLoading = signal(true);
  readonly statsError = signal<string | null>(null);

  readonly upcoming = computed(() =>
    this.sessions()
      .filter((s) => s.status !== 'annulee' && new Date(s.endAt).getTime() >= Date.now())
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
  );

  /** Taux de remplissage borné 0-100 (tolère une API qui renverrait un ratio 0-1). */
  readonly fillRate = computed(() => {
    const raw = this.stats()?.fillRate;
    if (raw === null || raw === undefined) {
      return 0;
    }
    const pct = raw <= 1 && raw > 0 ? raw * 100 : raw;
    return Math.max(0, Math.min(100, Math.round(pct)));
  });
  readonly fillRateLabel = computed(() => (this.stats() ? `${this.fillRate()} %` : '–'));
  readonly ratingLabel = computed(() => {
    const rating = this.stats()?.averageRating ?? this.profile()?.averageRating ?? null;
    return rating === null
      ? '–'
      : rating.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  });
  readonly reviewCount = computed(
    () => this.stats()?.reviewCount ?? this.profile()?.reviewCount ?? 0,
  );

  ngOnInit(): void {
    this.coach.profile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
    this.coach.stats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.statsLoading.set(false);
      },
      error: (err: unknown) => {
        this.statsError.set(errorMessage(err, 'Statistiques indisponibles pour le moment.'));
        this.statsLoading.set(false);
      },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.coach.sessions(today, addDays(today, 14)).subscribe({
      next: (list) => this.sessions.set(list),
      error: (err: unknown) => this.sessionsError.set(errorMessage(err)),
    });
  }

  open(session: Session): void {
    this.router.navigate(['/coach/seances', session.id]);
  }
}
