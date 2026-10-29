import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DAY_LABELS, GymDetail, OpeningHour, Session, errorMessage } from '../../core/models';
import { CatalogService } from '../../core/services/catalog.service';
import { calendarRange, startOfWeek } from '../../core/utils/date.utils';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { CourseCardComponent } from '../../shared/components/course-card/course-card.component';
import { FavoriteButtonComponent } from '../../shared/components/favorite-button/favorite-button.component';
import { GymMapComponent } from '../../shared/components/gym-map/gym-map.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../shared/components/rating-stars/rating-stars.component';
import { ReviewFormComponent } from '../../shared/components/review-form/review-form.component';
import { ReviewListComponent } from '../../shared/components/review-list/review-list.component';
import { WeekCalendarComponent } from '../../shared/components/week-calendar/week-calendar.component';

@Component({
  selector: 'app-gym-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AlertComponent,
    LoaderComponent,
    RatingStarsComponent,
    FavoriteButtonComponent,
    CourseCardComponent,
    ReviewListComponent,
    ReviewFormComponent,
    WeekCalendarComponent,
    GymMapComponent,
  ],
  template: `
    <div class="container page">
      @if (loading()) {
        <app-loader />
      } @else if (error()) {
        <app-alert type="error" [message]="error()" />
        <a routerLink="/recherche" class="btn btn-outline">← Retour à la recherche</a>
      } @else if (gym(); as g) {
        <div class="hero card">
          @if (g.imageUrl) {
            <img class="hero-img" [src]="g.imageUrl" [alt]="g.name" />
          } @else {
            <div class="hero-img placeholder" aria-hidden="true">🏋️</div>
          }
          <div class="hero-body">
            <div class="flex between flex-wrap">
              <div>
                <h1 style="margin-bottom: 4px">{{ g.name }}</h1>
                <p class="muted" style="margin: 0">
                  📍 {{ g.address }}, {{ g.postalCode }} {{ g.city }}
                </p>
              </div>
              <app-favorite-button
                type="gym"
                [id]="g.id"
                [isFavorite]="g.isFavorite"
                [showLabel]="true"
              />
            </div>
            <div class="flex flex-wrap mt-16" style="gap: 16px">
              <app-rating-stars [rating]="g.averageRating" [count]="g.reviewCount" />
              @if (g.phone) {
                <span class="muted">📞 {{ g.phone }}</span>
              }
              <span class="muted">👥 Capacité : {{ g.totalCapacity }} personnes</span>
            </div>
            @if (g.activities.length) {
              <div class="flex flex-wrap mt-16">
                @for (a of g.activities; track a) {
                  <span class="badge badge-primary">{{ a }}</span>
                }
              </div>
            }
          </div>
        </div>

        <div class="two-col mt-24">
          <div>
            @if (g.description) {
              <section class="section card">
                <h2>À propos</h2>
                <p style="white-space: pre-line; margin: 0">{{ g.description }}</p>
              </section>
            }

            <section class="section">
              <h2>Cours proposés</h2>
              @if (g.courses.length) {
                <div class="grid">
                  @for (c of g.courses; track c.id) {
                    <app-course-card [course]="c" />
                  }
                </div>
              } @else {
                <p class="muted">Aucun cours proposé pour le moment.</p>
              }
            </section>

            <section class="section">
              <h2>Séances de la semaine</h2>
              <app-week-calendar
                [sessions]="sessions()"
                [cursor]="weekStart()"
                [loading]="sessionsLoading()"
                (cursorChange)="changeWeek($event)"
                (sessionClick)="openSession($event)"
              />
              <app-alert type="error" [message]="sessionsError()" />
            </section>

            <section class="section card">
              <h2>Avis ({{ g.reviews.length }})</h2>
              <app-review-list [reviews]="g.reviews" />
            </section>

            <app-review-form
              [gymId]="g.id"
              heading="Donner votre avis sur cette salle"
              (published)="onReviewPublished()"
            />
          </div>

          <aside>
            @if (mapGyms().length) {
              <div class="card map-card mb-16">
                <h3>Localisation</h3>
                <p class="muted small">{{ g.address }}, {{ g.postalCode }} {{ g.city }}</p>
                <app-gym-map [gyms]="mapGyms()" height="260px" />
              </div>
            }
            <div class="card">
              <h3>Horaires d'ouverture</h3>
              <ul class="hours">
                @for (day of hours(); track day.label) {
                  <li [class.closed]="!day.hour" [class.today]="day.isToday">
                    <span>{{ day.label }}</span>
                    <span>
                      @if (day.hour) {
                        {{ day.hour.opensAt }} – {{ day.hour.closesAt }}
                      } @else {
                        Fermé
                      }
                    </span>
                  </li>
                }
              </ul>
            </div>
            @if (g.manager) {
              <div class="card mt-16">
                <h3>Gestionnaire</h3>
                <p class="muted" style="margin: 0">
                  {{ g.manager.firstName }} {{ g.manager.lastName }}
                </p>
              </div>
            }
          </aside>
        </div>
      }
    </div>
  `,
  styles: `
    .hero {
      padding: 0;
      overflow: hidden;
    }
    .hero-img {
      width: 100%;
      height: 280px;
      object-fit: cover;
    }
    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      background: linear-gradient(135deg, #ffedd5, #fdba74);
    }
    .hero-body {
      padding: 24px;
    }
    .hours li {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .hours li:last-child {
      border-bottom: none;
    }
    .hours .closed span:last-child {
      color: var(--color-danger);
      font-weight: 600;
    }
    .hours .today {
      font-weight: 700;
      color: var(--color-primary);
    }
    @media (max-width: 768px) {
      .hero-img {
        height: 180px;
      }
      .hero-body {
        padding: 16px;
      }
    }
  `,
})
export class GymDetailComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);

  /** Lié automatiquement au paramètre de route :id (withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly gym = signal<GymDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly weekStart = signal(startOfWeek(new Date()));
  readonly sessions = signal<Session[]>([]);
  readonly sessionsLoading = signal(false);
  readonly sessionsError = signal<string | null>(null);

  /** US-21 : la salle seule sur la carte si elle a des coordonnées (tableau stable pour l'input). */
  readonly mapGyms = computed<GymDetail[]>(() => {
    const g = this.gym();
    return g && typeof g.latitude === 'number' && typeof g.longitude === 'number' ? [g] : [];
  });

  readonly hours = computed(() => {
    const todayIndex = (new Date().getDay() + 6) % 7;
    const list = this.gym()?.openingHours ?? [];
    return DAY_LABELS.map((label, i) => ({
      label,
      isToday: i === todayIndex,
      hour: list.find((h: OpeningHour) => h.dayOfWeek === i + 1) ?? null,
    }));
  });

  ngOnInit(): void {
    const id = Number(this.id());
    this.catalog.gym(id).subscribe({
      next: (g) => {
        this.gym.set(g);
        this.loading.set(false);
        this.loadSessions();
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Salle introuvable.'));
        this.loading.set(false);
      },
    });
  }

  changeWeek(date: Date): void {
    this.weekStart.set(startOfWeek(date));
    this.loadSessions();
  }

  openSession(session: Session): void {
    if (session.course) {
      this.router.navigate(['/cours', session.course.id], { queryParams: { seance: session.id } });
    }
  }

  onReviewPublished(): void {
    this.catalog
      .gym(Number(this.id()))
      .subscribe({ next: (g) => this.gym.set(g), error: () => undefined });
  }

  private loadSessions(): void {
    const { from, to } = calendarRange(this.weekStart(), 'week');
    this.sessionsLoading.set(true);
    this.sessionsError.set(null);
    this.catalog.gymSessions(Number(this.id()), from, to).subscribe({
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
