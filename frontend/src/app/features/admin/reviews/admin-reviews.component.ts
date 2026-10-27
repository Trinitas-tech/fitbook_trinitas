import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Review, errorMessage } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-reviews',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    PaginationComponent,
    RatingStarsComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Modération des avis</h1>
    </div>
    <div class="tabs">
      <button type="button" class="tab" [class.active]="status() === ''" (click)="setStatus('')">Tous</button>
      <button type="button" class="tab" [class.active]="status() === 'en_attente'" (click)="setStatus('en_attente')">En attente</button>
      <button type="button" class="tab" [class.active]="status() === 'approuve'" (click)="setStatus('approuve')">Approuvés</button>
      <button type="button" class="tab" [class.active]="status() === 'masque'" (click)="setStatus('masque')">Masqués</button>
    </div>

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (reviews().length === 0) {
      <app-empty-state icon="⭐" title="Aucun avis" message="Aucun avis ne correspond à ce filtre." />
    } @else {
      <div class="list">
        @for (r of reviews(); track r.id) {
          <article class="card card-sm review-row">
            <div class="main">
              <div class="flex flex-wrap">
                <strong>{{ r.author.firstName }} {{ r.author.lastName }}</strong>
                <span class="muted small">{{ r.createdAt | date: 'd MMM yyyy HH:mm' }}</span>
                <app-status-badge kind="review" [status]="r.status" />
              </div>
              <div class="muted small">
                Sur :
                @if (r.gym) {
                  <a [routerLink]="['/salles', r.gym.id]">🏢 {{ r.gym.name }}</a>
                } @else if (r.coach) {
                  <a [routerLink]="['/coachs', r.coach.id]">👤 {{ r.coach.firstName }} {{ r.coach.lastName }}</a>
                }
              </div>
              <app-rating-stars [rating]="r.rating" [showValue]="false" size="sm" />
              @if (r.comment) {
                <p style="margin: 6px 0 0; white-space: pre-line">{{ r.comment }}</p>
              }
            </div>
            <div class="actions">
              @if (r.status !== 'approuve') {
                <button type="button" class="btn btn-primary btn-sm" [disabled]="busyId() === r.id" (click)="moderate(r, 'approuve')">Approuver</button>
              }
              @if (r.status !== 'masque') {
                <button type="button" class="btn btn-outline btn-sm" [disabled]="busyId() === r.id" (click)="moderate(r, 'masque')">Masquer</button>
              }
              <button type="button" class="btn btn-ghost btn-sm" [disabled]="busyId() === r.id" (click)="toDelete.set(r)">Supprimer</button>
            </div>
          </article>
        }
      </div>
      <app-pagination [page]="page()" [total]="total()" [limit]="limit()" (pageChange)="goTo($event)" />
    }

    @if (toDelete(); as r) {
      <app-confirm-dialog
        title="Supprimer l’avis ?"
        message="L’avis sera définitivement supprimé."
        confirmLabel="Supprimer"
        [danger]="true"
        [busy]="busyId() === r.id"
        (confirm)="remove(r)"
        (cancel)="toDelete.set(null)"
      />
    }
  `,
  styles: `
    .review-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }
    .main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    @media (max-width: 768px) {
      .review-row {
        flex-direction: column;
      }
      .actions {
        flex-direction: row;
        flex-wrap: wrap;
      }
    }
  `,
})
export class AdminReviewsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly status = signal('');
  readonly reviews = signal<Review[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);
  readonly toDelete = signal<Review | null>(null);

  ngOnInit(): void {
    this.load();
  }

  setStatus(status: string): void {
    this.status.set(status);
    this.page.set(1);
    this.load();
  }

  goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  moderate(review: Review, status: 'approuve' | 'masque'): void {
    this.busyId.set(review.id);
    this.admin.moderateReview(review.id, status).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.reviews.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
        this.toast.success(status === 'approuve' ? 'Avis approuvé.' : 'Avis masqué.');
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }

  remove(review: Review): void {
    this.busyId.set(review.id);
    this.admin.deleteReview(review.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toDelete.set(null);
        this.reviews.update((list) => list.filter((r) => r.id !== review.id));
        this.toast.success('Avis supprimé.');
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toDelete.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.admin.reviews({ status: this.status(), page: this.page() }).subscribe({
      next: (res) => {
        this.reviews.set(res.items);
        this.total.set(res.total);
        this.limit.set(res.limit || 20);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
