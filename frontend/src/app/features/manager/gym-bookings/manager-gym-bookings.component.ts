import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BOOKING_STATUS_LABELS,
  BookingWithUser,
  GymDetail,
  Session,
  errorMessage,
} from '../../../core/models';
import { ManagerService } from '../../../core/services/manager.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  CalendarView,
  calendarRange,
  startOfWeek,
  toIsoDate,
} from '../../../core/utils/date.utils';
import {
  filenameFromContentDisposition,
  saveBlob,
  slugify,
} from '../../../core/utils/download.utils';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { SessionListComponent } from '../../../shared/components/session-list/session-list.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { WeekCalendarComponent } from '../../../shared/components/week-calendar/week-calendar.component';
import { ManagerGymNavComponent } from '../gym-nav/manager-gym-nav.component';
import { ManagerGymStore } from '../manager-gym.store';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-manager-gym-bookings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    DatePipe,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    SessionListComponent,
    StatusBadgeComponent,
    WeekCalendarComponent,
    ConfirmDialogComponent,
    ManagerGymNavComponent,
  ],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/gestionnaire/salles" class="small">← Mes salles</a>
        <h1 class="page-title">Réservations · {{ gym()?.name || '' }}</h1>
      </div>
      <div class="flex flex-wrap toolbar">
        <label class="flex">
          <span class="label">Cours :</span>
          <select
            class="input"
            style="width: auto"
            [value]="courseFilter() ?? ''"
            (change)="setCourse($event)"
          >
            <option value="">Tous les cours</option>
            @for (c of gym()?.courses ?? []; track c.id) {
              <option [value]="c.id">{{ c.title }}</option>
            }
          </select>
        </label>
        <label class="flex">
          <span class="label">Statut :</span>
          <select
            class="input"
            style="width: auto"
            [value]="statusFilter()"
            (change)="setStatus($event)"
          >
            <option value="">Tous</option>
            @for (s of statusOptions; track s.value) {
              <option [value]="s.value">{{ s.label }}</option>
            }
          </select>
        </label>
        <!-- US-44 : export CSV avec les mêmes filtres que la liste -->
        <button
          type="button"
          class="btn btn-outline"
          (click)="exportCsv()"
          [disabled]="exporting() || !gym()"
        >
          @if (exporting()) {
            <span class="spinner" style="width: 16px; height: 16px; border-width: 2px"></span>
            Export en cours…
          } @else {
            <app-icon name="download" size="16" /> Exporter en CSV
          }
        </button>
      </div>
    </div>
    <app-manager-gym-nav [gymId]="gymId()" />

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else {
      <app-alert type="error" [message]="sessionsError()" />
      <app-week-calendar
        [sessions]="sessions()"
        [cursor]="cursor()"
        [view]="view()"
        [showViewToggle]="true"
        [selectedId]="selected()?.id ?? null"
        [loading]="sessionsLoading()"
        (cursorChange)="setCursor($event)"
        (viewChange)="setView($event)"
        (sessionClick)="select($event)"
      />

      <div class="two-col mt-24">
        <section>
          <h2>Séances ({{ sortedSessions().length }})</h2>
          <app-session-list
            [sessions]="sortedSessions()"
            [showBook]="false"
            [selectedId]="selected()?.id ?? null"
            (select)="select($event)"
            emptyMessage="Aucune séance sur cette période."
          />
        </section>

        <section class="card">
          @if (selected(); as s) {
            <div class="flex between flex-wrap">
              <h3 style="margin: 0">{{ s.course?.title || 'Séance' }}</h3>
              @if (s.status === 'planifiee' || s.status === 'complete') {
                <button type="button" class="btn btn-danger btn-sm" (click)="toCancel.set(s)">
                  Annuler la séance
                </button>
              }
            </div>
            <p class="muted" style="text-transform: capitalize">
              {{ s.startAt | date: 'EEEE d MMMM · HH:mm' }} – {{ s.endAt | date: 'HH:mm' }}
            </p>
            <h4>Réservations ({{ bookingsFor(s).length }})</h4>
            @if (bookingsFor(s).length === 0) {
              <p class="muted small">Aucune réservation pour cette séance.</p>
            } @else {
              <ul>
                @for (b of bookingsFor(s); track b.id) {
                  <li class="booking-row">
                    <div>
                      <strong>{{ b.user.firstName }} {{ b.user.lastName }}</strong>
                      <div class="muted small">
                        {{ b.user.email }} · {{ b.seats }} place{{ b.seats > 1 ? 's' : '' }}
                      </div>
                    </div>
                    <app-status-badge kind="booking" [status]="b.status" />
                  </li>
                }
              </ul>
            }
          } @else {
            <h3>Réservations de la période ({{ bookings().length }})</h3>
            <app-alert type="error" [message]="bookingsError()" />
            <p class="muted small">
              Sélectionnez une séance pour voir ses participants et l'annuler si besoin.
            </p>
            @if (bookings().length === 0) {
              <p class="muted">Aucune réservation sur cette période.</p>
            } @else {
              <ul>
                @for (b of bookings(); track b.id) {
                  <li class="booking-row">
                    <div>
                      <strong>{{ b.user.firstName }} {{ b.user.lastName }}</strong>
                      <div class="muted small">
                        {{ b.session.course?.title || 'Séance' }} ·
                        {{ b.session.startAt | date: 'd MMM HH:mm' }}
                      </div>
                    </div>
                    <app-status-badge kind="booking" [status]="b.status" />
                  </li>
                }
              </ul>
            }
          }
        </section>
      </div>
    }

    @if (toCancel(); as s) {
      <app-confirm-dialog
        title="Annuler la séance ?"
        message="Toutes les réservations seront annulées et les sportifs recevront un e-mail."
        confirmLabel="Annuler la séance"
        [danger]="true"
        [busy]="busy()"
        (confirm)="cancelSession(s)"
        (cancel)="toCancel.set(null)"
      />
    }
  `,
  styles: `
    .booking-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .booking-row:last-child {
      border-bottom: none;
    }
    .toolbar {
      gap: 12px;
    }
    @media (max-width: 768px) {
      .toolbar {
        width: 100%;
      }
      .toolbar .btn {
        width: 100%;
      }
    }
  `,
})
export class ManagerGymBookingsComponent implements OnInit {
  private readonly manager = inject(ManagerService);
  private readonly store = inject(ManagerGymStore);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();
  /** Query param ?courseId= */
  readonly courseId = input<string | undefined>(undefined);
  readonly gymId = computed(() => Number(this.id()));

  readonly gym = signal<GymDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly cursor = signal(startOfWeek(new Date()));
  readonly view = signal<CalendarView>('week');
  readonly courseFilter = signal<number | null>(null);
  readonly sessions = signal<Session[]>([]);
  readonly sessionsLoading = signal(false);
  readonly sessionsError = signal<string | null>(null);
  readonly bookings = signal<BookingWithUser[]>([]);
  readonly bookingsError = signal<string | null>(null);
  readonly selected = signal<Session | null>(null);
  readonly toCancel = signal<Session | null>(null);
  readonly busy = signal(false);
  /** Filtre statut partagé entre la liste et l'export CSV ('' = tous). */
  readonly statusFilter = signal('');
  readonly exporting = signal(false);
  readonly statusOptions = Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  readonly sortedSessions = computed(() =>
    [...this.sessions()].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    ),
  );

  ngOnInit(): void {
    if (this.courseId()) {
      this.courseFilter.set(Number(this.courseId()));
    }
    const init = () => {
      const gym = this.store.byId(this.gymId());
      if (!gym) {
        this.error.set('Salle introuvable ou non gérée par votre compte.');
      } else {
        this.gym.set(gym);
        this.load();
      }
      this.loading.set(false);
    };
    if (this.store.loaded()) {
      init();
    } else {
      this.store.load().subscribe({
        next: init,
        error: (err: unknown) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
    }
  }

  setCourse(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.courseFilter.set(value ? Number(value) : null);
    this.selected.set(null);
    this.load();
  }

  setStatus(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.loadBookings();
  }

  setCursor(date: Date): void {
    this.cursor.set(date);
    this.selected.set(null);
    this.load();
  }

  /** US-44 : télécharge le CSV des réservations (période, cours et statut courants). */
  exportCsv(): void {
    const gym = this.gym();
    if (!gym || this.exporting()) {
      return;
    }
    const { from, to } = calendarRange(this.cursor(), this.view());
    this.exporting.set(true);
    this.manager
      .exportGymBookingsCsv(gym.id, {
        from,
        to,
        courseId: this.courseFilter(),
        status: this.statusFilter() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.exporting.set(false);
          const fallback = `reservations-${slugify(gym.name)}-${toIsoDate(new Date())}.csv`;
          const filename =
            filenameFromContentDisposition(response.headers.get('Content-Disposition')) ?? fallback;
          const blob = response.body ?? new Blob([], { type: 'text/csv;charset=utf-8' });
          saveBlob(blob, filename);
          this.toast.success(`Export téléchargé : ${filename}`);
        },
        error: (err: unknown) => {
          this.exporting.set(false);
          this.toast.error(errorMessage(err, "L'export CSV a échoué."));
        },
      });
  }

  setView(view: CalendarView): void {
    this.view.set(view);
    this.cursor.set(view === 'week' ? startOfWeek(this.cursor()) : this.cursor());
    this.load();
  }

  select(session: Session): void {
    this.selected.set(this.selected()?.id === session.id ? null : session);
  }

  bookingsFor(session: Session): BookingWithUser[] {
    return this.bookings().filter((b) => b.session.id === session.id);
  }

  cancelSession(session: Session): void {
    this.busy.set(true);
    this.manager.cancelSession(session.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.toCancel.set(null);
        this.sessions.update((list) => list.map((s) => (s.id === updated.id ? updated : s)));
        this.selected.set(updated);
        this.toast.success('Séance annulée, les sportifs ont été prévenus.');
        this.loadBookings();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.toCancel.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }

  private load(): void {
    const { from, to } = calendarRange(this.cursor(), this.view());
    this.sessionsLoading.set(true);
    this.sessionsError.set(null);
    this.manager.gymSessions(this.gymId(), from, to, this.courseFilter()).subscribe({
      next: (list) => {
        this.sessions.set(list);
        this.sessionsLoading.set(false);
      },
      error: (err: unknown) => {
        this.sessionsError.set(errorMessage(err));
        this.sessionsLoading.set(false);
      },
    });
    this.loadBookings();
  }

  private loadBookings(): void {
    const { from, to } = calendarRange(this.cursor(), this.view());
    this.bookingsError.set(null);
    this.manager
      .gymBookings(this.gymId(), {
        from,
        to,
        courseId: this.courseFilter(),
        status: this.statusFilter() || undefined,
      })
      .subscribe({
        next: (list) => this.bookings.set(list),
        error: (err: unknown) => this.bookingsError.set(errorMessage(err)),
      });
  }
}
