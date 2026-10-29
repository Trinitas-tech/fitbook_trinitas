import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { Booking, CourseDetail, LEVEL_LABELS, Session, errorMessage } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { calendarRange, startOfWeek } from '../../core/utils/date.utils';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { BookSessionDialogComponent } from '../../shared/components/book-session-dialog/book-session-dialog.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ReviewFormComponent } from '../../shared/components/review-form/review-form.component';
import { SessionListComponent } from '../../shared/components/session-list/session-list.component';
import { WeekCalendarComponent } from '../../shared/components/week-calendar/week-calendar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-course-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    CurrencyPipe,
    DatePipe,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    SessionListComponent,
    WeekCalendarComponent,
    BookSessionDialogComponent,
    ReviewFormComponent,
  ],
  template: `
    <div class="container page" [class.has-fixed-bar]="firstBookable()">
      @if (loading()) {
        <app-loader />
      } @else if (error()) {
        <app-alert type="error" [message]="error()" />
        <a routerLink="/recherche" class="btn btn-outline">← Retour à la recherche</a>
      } @else if (course(); as c) {
        <div class="card header">
          @if (c.imageUrl) {
            <img class="header-img" [src]="c.imageUrl" [alt]="c.title" />
          } @else {
            <div class="header-img placeholder" aria-hidden="true">
              @if (c.activity.icon) {
                {{ c.activity.icon }}
              } @else {
                <app-icon name="activity" size="56" />
              }
            </div>
          }
          <div class="header-body">
            <div class="flex flex-wrap">
              <span class="badge badge-primary">{{ c.activity.name }}</span>
              <span class="badge">{{ levelLabel(c.level) }}</span>
              <span class="badge"
                ><app-icon name="timer" size="14" /> {{ c.durationMinutes }} min</span
              >
              <span class="badge"><app-icon name="users" size="14" /> {{ c.capacity }} places</span>
            </div>
            <h1 style="margin: 10px 0 4px">{{ c.title }}</h1>
            <p class="muted" style="margin: 0">
              <app-icon name="building" size="14" />
              <a [routerLink]="['/salles', c.gym.id]">{{ c.gym.name }}</a> · {{ c.gym.city }}
              @if (c.coach) {
                · <app-icon name="user" size="14" />
                <a [routerLink]="['/coachs', c.coach.id]"
                  >{{ c.coach.firstName }} {{ c.coach.lastName }}</a
                >
              }
            </p>
            <p class="mt-16" style="margin-bottom: 0">
              <span class="price" style="font-size: 1.4rem">{{
                c.price | currency: 'EUR' : 'symbol' : '1.0-2'
              }}</span>
              <span class="muted"> / séance</span>
            </p>
          </div>
        </div>

        <app-alert type="success" [message]="successMessage()" />

        <div class="two-col mt-24">
          <div>
            @if (c.description) {
              <section class="section card">
                <h2>Description</h2>
                <p style="white-space: pre-line; margin: 0">{{ c.description }}</p>
              </section>
            }

            <section class="section" id="seances">
              <h2>Prochaines séances</h2>
              <app-week-calendar
                [sessions]="weekSessions()"
                [cursor]="weekStart()"
                [selectedId]="selectedId()"
                (cursorChange)="weekStart.set($event)"
                (sessionClick)="onSessionClick($event)"
              />
              <div class="mt-16">
                <app-session-list
                  [sessions]="weekSessions()"
                  [showTitle]="false"
                  [selectedId]="selectedId()"
                  (book)="selected.set($event)"
                  (select)="highlighted.set($event)"
                  emptyMessage="Aucune séance cette semaine. Naviguez vers une autre semaine."
                />
              </div>
            </section>
          </div>

          <aside>
            <app-review-form [gymId]="c.gym.id" heading="Votre avis sur la salle" />
            @if (c.coach) {
              <div class="mt-16">
                <app-review-form [coachId]="c.coach.id" heading="Votre avis sur le coach" />
              </div>
            }
          </aside>
        </div>

        @if (firstBookable(); as s) {
          <div class="fixed-bar hide-desktop">
            <div>
              <strong>{{ s.startAt | date: 'EEE d MMM, HH:mm' }}</strong>
              <span class="muted small"
                >{{ s.remainingSeats }} place(s) ·
                {{ s.price | currency: 'EUR' : 'symbol' : '1.0-2' }}</span
              >
            </div>
            <button type="button" class="btn btn-primary" (click)="selected.set(s)">
              Réserver
            </button>
          </div>
        }
      }

      @if (selected(); as s) {
        <app-book-session-dialog
          [session]="s"
          (booked)="onBooked($event)"
          (cancelled)="selected.set(null)"
        />
      }
    </div>
  `,
  styles: `
    .header {
      padding: 0;
      overflow: hidden;
      display: grid;
      grid-template-columns: 320px 1fr;
    }
    .header-img {
      width: 100%;
      height: 100%;
      min-height: 220px;
      object-fit: cover;
    }
    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      background: var(--grad-fire);
      color: #0f172a;
    }
    .header-body {
      padding: 24px;
    }
    .fixed-bar {
      display: none;
    }
    @media (max-width: 768px) {
      .header {
        grid-template-columns: 1fr;
      }
      .header-img {
        height: 180px;
        min-height: 0;
      }
      .header-body {
        padding: 16px;
      }
      .has-fixed-bar {
        padding-bottom: 90px;
      }
      .fixed-bar {
        display: flex;
        position: fixed;
        left: 0;
        right: 0;
        bottom: var(--bottom-tabs-height);
        background: var(--glass-bg-strong);
        -webkit-backdrop-filter: blur(var(--glass-blur));
        backdrop-filter: blur(var(--glass-blur));
        border-top: 1px solid var(--glass-border);
        padding: 12px 16px;
        justify-content: space-between;
        align-items: center;
        z-index: 55;
        box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.08);
      }
      .fixed-bar > div {
        display: flex;
        flex-direction: column;
      }
    }
  `,
})
export class CourseDetailComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  readonly auth = inject(AuthService);

  readonly id = input.required<string>();
  /** Query param ?seance= pour pré-sélectionner une séance (depuis la fiche salle). */
  readonly seance = input<string | undefined>(undefined);

  readonly course = signal<CourseDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly weekStart = signal(startOfWeek(new Date()));
  readonly selected = signal<Session | null>(null);
  readonly highlighted = signal<Session | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly selectedId = computed(() => this.highlighted()?.id ?? null);

  readonly sortedSessions = computed(() =>
    [...(this.course()?.sessions ?? [])].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    ),
  );

  readonly weekSessions = computed(() => {
    const { from, to } = calendarRange(this.weekStart(), 'week');
    return this.sortedSessions().filter((s) => {
      const d = new Date(s.startAt);
      return d >= from && d < to;
    });
  });

  readonly firstBookable = computed(
    () =>
      this.sortedSessions().find(
        (s) => s.isBookable && !s.myBookingId && new Date(s.startAt) > new Date(),
      ) ?? null,
  );

  ngOnInit(): void {
    this.reload(true);
  }

  levelLabel(level: string): string {
    return LEVEL_LABELS[level] ?? level;
  }

  onSessionClick(session: Session): void {
    this.highlighted.set(session);
    if (session.isBookable && !session.myBookingId) {
      this.selected.set(session);
    }
  }

  onBooked(booking: Booking): void {
    this.selected.set(null);
    this.successMessage.set(
      `Réservation confirmée pour la séance du ${new Date(booking.session.startAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}. Un e-mail de confirmation vous a été envoyé.`,
    );
    this.reload(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private reload(first: boolean): void {
    this.catalog.course(Number(this.id())).subscribe({
      next: (c) => {
        this.course.set(c);
        this.loading.set(false);
        if (first) {
          this.initialWeek(c);
        }
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Cours introuvable.'));
        this.loading.set(false);
      },
    });
  }

  /** Se positionne sur la semaine de la séance demandée ou de la prochaine séance. */
  private initialWeek(c: CourseDetail): void {
    const wanted = this.seance()
      ? c.sessions.find((s) => s.id === Number(this.seance()))
      : undefined;
    const target = wanted ?? this.firstBookable() ?? this.sortedSessions()[0];
    if (target) {
      this.weekStart.set(startOfWeek(new Date(target.startAt)));
      if (wanted) {
        this.highlighted.set(wanted);
      }
    }
  }
}
