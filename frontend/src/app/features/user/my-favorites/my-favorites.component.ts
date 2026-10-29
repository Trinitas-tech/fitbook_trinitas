import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoachCard, GymCard, errorMessage } from '../../../core/models';
import { FavoriteService } from '../../../core/services/favorite.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-my-favorites',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    RatingStarsComponent,
  ],
  template: `
    <div class="container page">
      <div class="page-header">
        <h1 class="page-title">Mes favoris</h1>
      </div>

      @if (loading()) {
        <app-loader />
      } @else if (error()) {
        <app-alert type="error" [message]="error()" />
      } @else {
        <div class="grid-2">
          <section>
            <h2>Salles ({{ gyms().length }})</h2>
            @if (gyms().length === 0) {
              <app-empty-state
                icon="building"
                title="Aucune salle en favori"
                message="Cliquez sur le cœur d'une salle pour l'ajouter ici."
              />
            } @else {
              <ul class="list">
                @for (g of gyms(); track g.id) {
                  <li class="list-item">
                    <div>
                      <a [routerLink]="['/salles', g.id]" class="bold">{{ g.name }}</a>
                      <div class="muted small">
                        <app-icon name="map-pin" size="14" /> {{ g.city }}
                      </div>
                      <app-rating-stars
                        [rating]="g.averageRating"
                        [count]="g.reviewCount"
                        size="sm"
                      />
                    </div>
                    <button
                      type="button"
                      class="btn btn-outline btn-sm"
                      [disabled]="busyId() === 'gym-' + g.id"
                      (click)="removeGym(g)"
                    >
                      Retirer
                    </button>
                  </li>
                }
              </ul>
            }
          </section>
          <section>
            <h2>Coachs ({{ coaches().length }})</h2>
            @if (coaches().length === 0) {
              <app-empty-state
                icon="user"
                title="Aucun coach en favori"
                message="Cliquez sur le cœur d'un coach pour l'ajouter ici."
              />
            } @else {
              <ul class="list">
                @for (c of coaches(); track c.id) {
                  <li class="list-item">
                    <div>
                      <a [routerLink]="['/coachs', c.id]" class="bold"
                        >{{ c.firstName }} {{ c.lastName }}</a
                      >
                      <div class="muted small">
                        {{ c.specialty || 'Coach' }} · <app-icon name="map-pin" size="14" />
                        {{ c.city || '–' }}
                      </div>
                      <app-rating-stars
                        [rating]="c.averageRating"
                        [count]="c.reviewCount"
                        size="sm"
                      />
                    </div>
                    <button
                      type="button"
                      class="btn btn-outline btn-sm"
                      [disabled]="busyId() === 'coach-' + c.id"
                      (click)="removeCoach(c)"
                    >
                      Retirer
                    </button>
                  </li>
                }
              </ul>
            }
          </section>
        </div>
      }
    </div>
  `,
})
export class MyFavoritesComponent implements OnInit {
  private readonly favorites = inject(FavoriteService);
  private readonly toast = inject(ToastService);

  readonly gyms = signal<GymCard[]>([]);
  readonly coaches = signal<CoachCard[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);

  ngOnInit(): void {
    this.favorites.mine().subscribe({
      next: (res) => {
        this.gyms.set(res.gyms);
        this.coaches.set(res.coaches);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  removeGym(gym: GymCard): void {
    this.busyId.set(`gym-${gym.id}`);
    this.favorites.remove('gym', gym.id).subscribe({
      next: () => {
        this.gyms.update((list) => list.filter((g) => g.id !== gym.id));
        this.busyId.set(null);
        this.toast.success(`${gym.name} retirée de vos favoris.`);
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }

  removeCoach(coach: CoachCard): void {
    this.busyId.set(`coach-${coach.id}`);
    this.favorites.remove('coach', coach.id).subscribe({
      next: () => {
        this.coaches.update((list) => list.filter((c) => c.id !== coach.id));
        this.busyId.set(null);
        this.toast.success(`${coach.firstName} ${coach.lastName} retiré de vos favoris.`);
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }
}
