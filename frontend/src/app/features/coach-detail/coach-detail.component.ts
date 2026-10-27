import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Booking, CoachDetail, DAY_LABELS, Session, errorMessage } from '../../core/models';
import { CatalogService } from '../../core/services/catalog.service';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { BookSessionDialogComponent } from '../../shared/components/book-session-dialog/book-session-dialog.component';
import { FavoriteButtonComponent } from '../../shared/components/favorite-button/favorite-button.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../shared/components/rating-stars/rating-stars.component';
import { ReviewFormComponent } from '../../shared/components/review-form/review-form.component';
import { ReviewListComponent } from '../../shared/components/review-list/review-list.component';
import { SessionListComponent } from '../../shared/components/session-list/session-list.component';

@Component({
  selector: 'app-coach-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    RatingStarsComponent,
    FavoriteButtonComponent,
    ReviewListComponent,
    ReviewFormComponent,
    SessionListComponent,
    BookSessionDialogComponent,
  ],
  template: `
    <div class="container page" [class.has-fixed-bar]="firstBookable()">
      @if (loading()) {
        <app-loader />
      } @else if (error()) {
        <app-alert type="error" [message]="error()" />
        <a routerLink="/recherche" class="btn btn-outline">← Retour à la recherche</a>
      } @else if (coach(); as c) {
        <div class="card profile">
          @if (c.avatarUrl) {
            <img class="avatar avatar-lg" [src]="c.avatarUrl" [alt]="c.firstName + ' ' + c.lastName" />
          } @else {
            <span class="avatar avatar-lg">{{ c.firstName[0] }}{{ c.lastName[0] }}</span>
          }
          <div class="profile-body">
            <div class="flex between flex-wrap">
              <div>
                <h1 style="margin-bottom: 4px">{{ c.firstName }} {{ c.lastName }}</h1>
                <div class="flex flex-wrap">
                  @if (c.specialty) {
                    <span class="badge badge-primary">{{ c.specialty }}</span>
                  }
                  @if (c.city) {
                    <span class="muted">📍 {{ c.city }}</span>
                  }
                </div>
              </div>
              <app-favorite-button type="coach" [id]="c.id" [isFavorite]="c.isFavorite" [showLabel]="true" />
            </div>
            <div class="flex flex-wrap mt-16" style="gap: 16px">
              <app-rating-stars [rating]="c.averageRating" [count]="c.reviewCount" />
              @if (c.hourlyRate !== null) {
                <span><span class="price">{{ c.hourlyRate | currency: 'EUR' : 'symbol' : '1.0-2' }}</span> <span class="muted">/ heure</span></span>
              }
            </div>
          </div>
        </div>

        <app-alert type="success" [message]="successMessage()" />

        <div class="two-col mt-24">
          <div>
            @if (c.bio) {
              <section class="section card">
                <h2>Présentation</h2>
                <p style="white-space: pre-line; margin: 0">{{ c.bio }}</p>
              </section>
            }

            <section class="section" id="seances">
              <h2>Séances à venir</h2>
              <app-session-list [sessions]="upcoming()" [showTitle]="true" (book)="selected.set($event)" emptyMessage="Aucune séance à venir pour ce coach." />
            </section>

            <section class="section card">
              <h2>Avis ({{ c.reviews.length }})</h2>
              <app-review-list [reviews]="c.reviews" />
            </section>

            <app-review-form [coachId]="c.id" heading="Donner votre avis sur ce coach" (published)="reload()" />
          </div>

          <aside>
            <div class="card">
              <h3>Disponibilités hebdomadaires</h3>
              <ul class="hours">
                @for (day of availabilityByDay(); track day.label) {
                  <li [class.closed]="day.slots.length === 0">
                    <span>{{ day.label }}</span>
                    <span class="slots">
                      @for (s of day.slots; track s.startsAt) {
                        <span>{{ s.startsAt }} – {{ s.endsAt }}</span>
                      } @empty {
                        Indisponible
                      }
                    </span>
                  </li>
                }
              </ul>
            </div>
          </aside>
        </div>

        @if (firstBookable(); as s) {
          <div class="fixed-bar hide-desktop">
            <div>
              <strong>Prochaine séance</strong>
              <span class="muted small">{{ s.price | currency: 'EUR' : 'symbol' : '1.0-2' }} · {{ s.remainingSeats }} place(s)</span>
            </div>
            <button type="button" class="btn btn-primary" (click)="selected.set(s)">Réserver</button>
          </div>
        }
      }

      @if (selected(); as s) {
        <app-book-session-dialog [session]="s" (booked)="onBooked($event)" (cancelled)="selected.set(null)" />
      }
    </div>
  `,
  styles: `
    .profile {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }
    .profile-body {
      flex: 1;
      min-width: 0;
    }
    .hours li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .hours li:last-child {
      border-bottom: none;
    }
    .slots {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-weight: 600;
    }
    .closed .slots {
      color: var(--color-text-muted);
      font-weight: 400;
    }
    .fixed-bar {
      display: none;
    }
    @media (max-width: 768px) {
      .profile {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .profile .flex.between {
        flex-direction: column;
        align-items: center;
        gap: 12px;
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
        background: #fff;
        border-top: 1px solid var(--color-border);
        padding: 12px 16px;
        justify-content: space-between;
        align-items: center;
        z-index: 55;
      }
      .fixed-bar > div {
        display: flex;
        flex-direction: column;
      }
    }
  `,
})
export class CoachDetailComponent implements OnInit {
  private readonly catalog = inject(CatalogService);

  readonly id = input.required<string>();

  readonly coach = signal<CoachDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly selected = signal<Session | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly upcoming = computed(() =>
    [...(this.coach()?.sessions ?? [])]
      .filter((s) => new Date(s.endAt).getTime() >= Date.now())
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
  );
  readonly firstBookable = computed(() => this.upcoming().find((s) => s.isBookable && !s.myBookingId) ?? null);

  readonly availabilityByDay = computed(() => {
    const list = this.coach()?.availabilities ?? [];
    return DAY_LABELS.map((label, i) => ({
      label,
      slots: list.filter((a) => a.dayOfWeek === i + 1).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    }));
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.catalog.coach(Number(this.id())).subscribe({
      next: (c) => {
        this.coach.set(c);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Coach introuvable.'));
        this.loading.set(false);
      },
    });
  }

  onBooked(booking: Booking): void {
    this.selected.set(null);
    this.successMessage.set(
      `Réservation confirmée pour la séance du ${new Date(booking.session.startAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}. Un e-mail de confirmation vous a été envoyé.`,
    );
    this.reload();
  }
}
