import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GymReviews, errorMessage } from '../../../core/models';
import { ManagerService } from '../../../core/services/manager.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { ReviewListComponent } from '../../../shared/components/review-list/review-list.component';
import { ManagerGymNavComponent } from '../gym-nav/manager-gym-nav.component';
import { ManagerGymStore } from '../manager-gym.store';

@Component({
  selector: 'app-manager-gym-reviews',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AlertComponent, LoaderComponent, RatingStarsComponent, ReviewListComponent, ManagerGymNavComponent],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/gestionnaire/salles" class="small">← Mes salles</a>
        <h1 class="page-title">Avis · {{ store.byId(gymId())?.name || '' }}</h1>
      </div>
    </div>
    <app-manager-gym-nav [gymId]="gymId()" />

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (data(); as d) {
      <div class="grid-4 mb-16">
        <div class="kpi">
          <div class="kpi-label">Note moyenne</div>
          <div class="kpi-value"><app-rating-stars [rating]="d.averageRating" [count]="d.reviews.length" /></div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Nombre d'avis</div>
          <div class="kpi-value">{{ d.reviews.length }}</div>
        </div>
      </div>
      <div class="card">
        <app-review-list [reviews]="sorted()" emptyMessage="Aucun avis reçu pour cette salle." />
      </div>
    }
  `,
})
export class ManagerGymReviewsComponent implements OnInit {
  private readonly manager = inject(ManagerService);
  readonly store = inject(ManagerGymStore);

  readonly id = input.required<string>();
  readonly gymId = computed(() => Number(this.id()));

  readonly data = signal<GymReviews | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly sorted = computed(() =>
    [...(this.data()?.reviews ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );

  ngOnInit(): void {
    if (!this.store.loaded()) {
      this.store.load().subscribe({ error: () => undefined });
    }
    this.manager.gymReviews(this.gymId()).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
