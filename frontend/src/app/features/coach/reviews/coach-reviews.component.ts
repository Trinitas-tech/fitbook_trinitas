import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CoachReviews, errorMessage } from '../../../core/models';
import { CoachService } from '../../../core/services/coach.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { ReviewListComponent } from '../../../shared/components/review-list/review-list.component';

@Component({
  selector: 'app-coach-reviews',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AlertComponent, LoaderComponent, RatingStarsComponent, ReviewListComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Avis reçus</h1>
    </div>
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
        <app-review-list [reviews]="sorted()" emptyMessage="Vous n'avez pas encore reçu d'avis." />
      </div>
    }
  `,
})
export class CoachReviewsComponent implements OnInit {
  private readonly coach = inject(CoachService);

  readonly data = signal<CoachReviews | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly sorted = computed(() =>
    [...(this.data()?.reviews ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );

  ngOnInit(): void {
    this.coach.reviews().subscribe({
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
