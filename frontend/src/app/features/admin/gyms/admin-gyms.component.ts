import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GymDetail, errorMessage } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';

@Component({
  selector: 'app-admin-gyms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    RatingStarsComponent,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Salles</h1>
    </div>

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (gyms().length === 0) {
      <app-empty-state
        icon="building"
        title="Aucune salle"
        message="Les gestionnaires n'ont pas encore créé de salle."
      />
    } @else {
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Salle</th>
              <th>Ville</th>
              <th>Gestionnaire</th>
              <th>Cours</th>
              <th>Capacité</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (g of gyms(); track g.id) {
              <tr>
                <td>
                  <a [routerLink]="['/salles', g.id]"
                    ><strong>{{ g.name }}</strong></a
                  >
                </td>
                <td>{{ g.postalCode }} {{ g.city }}</td>
                <td>{{ g.manager ? g.manager.firstName + ' ' + g.manager.lastName : '–' }}</td>
                <td>{{ g.courses.length }}</td>
                <td>{{ g.totalCapacity }}</td>
                <td>
                  <app-rating-stars [rating]="g.averageRating" [count]="g.reviewCount" size="sm" />
                </td>
                <td style="text-align: right">
                  <button type="button" class="btn btn-ghost btn-sm" (click)="toDelete.set(g)">
                    Supprimer
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (toDelete(); as g) {
      <app-confirm-dialog
        title="Supprimer la salle ?"
        [message]="
          'La salle « ' + g.name + ' », ses cours et ses séances seront supprimés définitivement.'
        "
        confirmLabel="Supprimer"
        [danger]="true"
        [busy]="busy()"
        (confirm)="remove(g)"
        (cancel)="toDelete.set(null)"
      />
    }
  `,
})
export class AdminGymsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly gyms = signal<GymDetail[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly toDelete = signal<GymDetail | null>(null);
  readonly busy = signal(false);

  ngOnInit(): void {
    this.admin.gyms().subscribe({
      next: (list) => {
        this.gyms.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  remove(gym: GymDetail): void {
    this.busy.set(true);
    this.admin.deleteGym(gym.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.toDelete.set(null);
        this.gyms.update((list) => list.filter((g) => g.id !== gym.id));
        this.toast.success('Salle supprimée.');
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.toDelete.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }
}
