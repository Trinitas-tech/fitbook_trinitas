import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoachDetail, errorMessage } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';

type Filter = 'pending' | 'validated' | 'all';

interface AdminCoach extends CoachDetail {
  isValidated?: boolean;
  isComplete?: boolean;
}

@Component({
  selector: 'app-admin-coaches',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    RatingStarsComponent,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Coachs</h1>
    </div>
    <div class="tabs">
      <button
        type="button"
        class="tab"
        [class.active]="filter() === 'pending'"
        (click)="setFilter('pending')"
      >
        À valider
      </button>
      <button
        type="button"
        class="tab"
        [class.active]="filter() === 'validated'"
        (click)="setFilter('validated')"
      >
        Validés
      </button>
      <button
        type="button"
        class="tab"
        [class.active]="filter() === 'all'"
        (click)="setFilter('all')"
      >
        Tous
      </button>
    </div>

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (coaches().length === 0) {
      <app-empty-state
        icon="target"
        title="Aucun coach"
        [message]="filter() === 'pending' ? 'Aucun profil en attente de validation.' : null"
      />
    } @else {
      <div class="grid">
        @for (c of coaches(); track c.id) {
          <article class="card coach">
            <div class="flex" style="align-items: flex-start">
              @if (c.avatarUrl) {
                <img class="avatar" [src]="c.avatarUrl" [alt]="c.firstName" />
              } @else {
                <span class="avatar">{{ c.firstName[0] }}{{ c.lastName[0] }}</span>
              }
              <div style="flex: 1; min-width: 0">
                <strong>{{ c.firstName }} {{ c.lastName }}</strong>
                <div class="muted small">
                  {{ c.specialty || 'Spécialité non renseignée' }} · {{ c.city || 'Ville ?' }}
                </div>
                <div class="muted small">
                  @if (c.hourlyRate !== null) {
                    {{ c.hourlyRate | currency: 'EUR' : 'symbol' : '1.0-2' }}/h
                  }
                </div>
              </div>
              @if (c.isValidated) {
                <span class="badge badge-success">Validé</span>
              } @else {
                <span class="badge badge-warning">En attente</span>
              }
            </div>
            @if (c.bio) {
              <p class="small bio">{{ c.bio }}</p>
            }
            <app-rating-stars [rating]="c.averageRating" [count]="c.reviewCount" size="sm" />
            <div class="actions">
              @if (c.isValidated) {
                <a [routerLink]="['/coachs', c.id]" class="btn btn-ghost btn-sm">Voir la fiche</a>
                <button
                  type="button"
                  class="btn btn-outline btn-sm"
                  [disabled]="busyId() === c.id"
                  (click)="validate(c, false)"
                >
                  Retirer la validation
                </button>
              } @else {
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  [disabled]="busyId() === c.id"
                  (click)="validate(c, true)"
                >
                  Valider le profil
                </button>
              }
            </div>
          </article>
        }
      </div>
    }
  `,
  styles: `
    .coach {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .bio {
      margin: 0;
      color: var(--color-text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: auto;
    }
  `,
})
export class AdminCoachesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly filter = signal<Filter>('pending');
  readonly coaches = signal<AdminCoach[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  setFilter(filter: Filter): void {
    this.filter.set(filter);
    this.load();
  }

  validate(coach: AdminCoach, isValidated: boolean): void {
    this.busyId.set(coach.id);
    this.admin.validateCoach(coach.id, isValidated).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success(
          isValidated ? 'Profil validé : le coach est désormais visible.' : 'Validation retirée.',
        );
        this.load();
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    const f = this.filter();
    const validated = f === 'all' ? undefined : f === 'validated';
    this.admin.coaches(validated).subscribe({
      next: (list) => {
        this.coaches.set(
          (list as AdminCoach[]).map((c) => ({
            ...c,
            isValidated: c.isValidated ?? f === 'validated',
          })),
        );
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
