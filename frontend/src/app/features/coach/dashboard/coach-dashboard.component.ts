import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CoachProfile, Session, errorMessage } from '../../../core/models';
import { CoachService } from '../../../core/services/coach.service';
import { addDays } from '../../../core/utils/date.utils';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { SessionListComponent } from '../../../shared/components/session-list/session-list.component';

@Component({
  selector: 'app-coach-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AlertComponent, LoaderComponent, RatingStarsComponent, SessionListComponent],
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
        <app-alert type="warning" title="Profil incomplet" message="Complétez votre profil professionnel (spécialité, bio, tarif, ville) pour apparaître dans la recherche.">
          <div class="mt-16"><a routerLink="/coach/profil" class="btn btn-primary btn-sm">Compléter mon profil</a></div>
        </app-alert>
      } @else if (!p.isValidated) {
        <app-alert type="info" title="En attente de validation" message="Votre profil est complet. Un administrateur doit le valider avant qu'il soit visible publiquement." />
      } @else {
        <app-alert type="success" title="Profil validé" message="Votre profil est visible par les sportifs." />
      }

      <div class="grid-4 mb-16">
        <div class="kpi">
          <div class="kpi-label">Séances à venir (14 j)</div>
          <div class="kpi-value">{{ upcoming().length }}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Réservations à venir</div>
          <div class="kpi-value">{{ bookingTotal() }}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Note moyenne</div>
          <div class="kpi-value"><app-rating-stars [rating]="p.averageRating" [count]="p.reviewCount" /></div>
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

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Prochaines séances</h2>
          <a routerLink="/coach/seances">Voir le calendrier →</a>
        </div>
        <app-alert type="error" [message]="sessionsError()" />
        <app-session-list [sessions]="upcoming()" [showBook]="false" (select)="open($event)" emptyMessage="Aucune séance planifiée dans les 14 prochains jours." />
      </section>
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

  readonly upcoming = computed(() =>
    this.sessions()
      .filter((s) => s.status !== 'annulee' && new Date(s.endAt).getTime() >= Date.now())
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
  );
  readonly bookingTotal = computed(() =>
    this.upcoming().reduce((sum, s) => sum + (s.bookingCount ?? s.capacity - s.remainingSeats), 0),
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
