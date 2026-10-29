import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookingWithUser, GymStats, Session, errorMessage } from '../../../core/models';
import { ManagerService } from '../../../core/services/manager.service';
import { addDays, calendarRange, startOfWeek } from '../../../core/utils/date.utils';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { WeekCalendarComponent } from '../../../shared/components/week-calendar/week-calendar.component';
import { ManagerGymStore } from '../manager-gym.store';

@Component({
  selector: 'app-manager-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    WeekCalendarComponent,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Tableau de bord</h1>
      @if (store.gyms().length > 1) {
        <label class="flex">
          <span class="label">Salle :</span>
          <select
            class="input"
            style="width: auto"
            [value]="store.selectedGymId()"
            (change)="selectGym($event)"
          >
            @for (g of store.gyms(); track g.id) {
              <option [value]="g.id">{{ g.name }}</option>
            }
          </select>
        </label>
      }
    </div>

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (store.gyms().length === 0) {
      <app-empty-state
        icon="building"
        title="Aucune salle"
        message="Créez votre première salle pour commencer."
      >
        <a routerLink="/gestionnaire/salles/nouvelle" class="btn btn-primary btn-sm mt-16"
          >Créer une salle</a
        >
      </app-empty-state>
    } @else if (store.selectedGym(); as gym) {
      <p class="muted">
        <strong>{{ gym.name }}</strong> · {{ gym.city }} ·
        <a [routerLink]="['/gestionnaire/salles', gym.id]">Gérer la salle</a>
      </p>

      <app-alert type="error" [message]="statsError()" />
      <div class="grid-4 mb-16">
        <div class="kpi">
          <div class="kpi-label">Séances à venir</div>
          <div class="kpi-value">{{ stats()?.upcomingSessions ?? '–' }}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Réservations cette semaine</div>
          <div class="kpi-value">{{ stats()?.bookingsThisWeek ?? '–' }}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Taux de remplissage</div>
          <div class="kpi-value">{{ fillRate() }}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Note moyenne</div>
          <div class="kpi-value">
            @if (stats()?.averageRating != null) {
              {{ stats()!.averageRating | number: '1.1-1' }}
              <span style="font-size: 1rem; color: var(--color-star)">★</span>
            } @else {
              –
            }
          </div>
        </div>
      </div>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Séances de la semaine</h2>
          <a [routerLink]="['/gestionnaire/salles', gym.id, 'reservations']"
            >Gérer les réservations →</a
          >
        </div>
        <app-alert type="error" [message]="sessionsError()" />
        <app-week-calendar
          [sessions]="sessions()"
          [cursor]="weekStart()"
          [loading]="sessionsLoading()"
          (cursorChange)="changeWeek($event)"
          (sessionClick)="openSession($event)"
        />
      </section>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Dernières réservations</h2>
        </div>
        <app-alert type="error" [message]="bookingsError()" />
        @if (latestBookings().length === 0) {
          <p class="muted">Aucune réservation récente.</p>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Sportif</th>
                  <th>Séance</th>
                  <th>Date</th>
                  <th>Places</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (b of latestBookings(); track b.id) {
                  <tr>
                    <td>{{ b.user.firstName }} {{ b.user.lastName }}</td>
                    <td>{{ b.session.course?.title || 'Séance' }}</td>
                    <td>{{ b.session.startAt | date: 'd MMM HH:mm' }}</td>
                    <td>{{ b.seats }}</td>
                    <td><app-status-badge kind="booking" [status]="b.status" /></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    }
  `,
})
export class ManagerDashboardComponent implements OnInit {
  readonly store = inject(ManagerGymStore);
  private readonly manager = inject(ManagerService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<GymStats | null>(null);
  readonly statsError = signal<string | null>(null);
  readonly weekStart = signal(startOfWeek(new Date()));
  readonly sessions = signal<Session[]>([]);
  readonly sessionsLoading = signal(false);
  readonly sessionsError = signal<string | null>(null);
  readonly bookings = signal<BookingWithUser[]>([]);
  readonly bookingsError = signal<string | null>(null);

  readonly fillRate = computed(() => {
    const s = this.stats();
    if (!s) {
      return '–';
    }
    const rate = s.fillRate <= 1 ? s.fillRate * 100 : s.fillRate;
    return `${Math.round(rate)} %`;
  });

  readonly latestBookings = computed(() =>
    [...this.bookings()]
      .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
      .slice(0, 8),
  );

  ngOnInit(): void {
    this.store.load().subscribe({
      next: () => {
        this.loading.set(false);
        this.loadGymData();
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  selectGym(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.store.selectedGymId.set(id);
    this.loadGymData();
  }

  changeWeek(date: Date): void {
    this.weekStart.set(startOfWeek(date));
    this.loadSessions();
  }

  openSession(session: Session): void {
    const gymId = this.store.selectedGymId();
    if (gymId) {
      this.router.navigate(['/gestionnaire/salles', gymId, 'reservations'], {
        queryParams: { courseId: session.course?.id ?? null },
      });
    }
  }

  private loadGymData(): void {
    const gymId = this.store.selectedGymId();
    if (!gymId) {
      return;
    }
    this.stats.set(null);
    this.statsError.set(null);
    this.manager.gymStats(gymId).subscribe({
      next: (s) => this.stats.set(s),
      error: (err: unknown) => this.statsError.set(errorMessage(err)),
    });
    this.loadSessions();
    const today = new Date();
    this.bookingsError.set(null);
    this.manager
      .gymBookings(gymId, { from: addDays(today, -14), to: addDays(today, 30) })
      .subscribe({
        next: (list) => this.bookings.set(list),
        error: (err: unknown) => this.bookingsError.set(errorMessage(err)),
      });
  }

  private loadSessions(): void {
    const gymId = this.store.selectedGymId();
    if (!gymId) {
      return;
    }
    const { from, to } = calendarRange(this.weekStart(), 'week');
    this.sessionsLoading.set(true);
    this.sessionsError.set(null);
    this.manager.gymSessions(gymId, from, to).subscribe({
      next: (list) => {
        this.sessions.set(list);
        this.sessionsLoading.set(false);
      },
      error: (err: unknown) => {
        this.sessionsError.set(errorMessage(err));
        this.sessionsLoading.set(false);
      },
    });
  }
}
