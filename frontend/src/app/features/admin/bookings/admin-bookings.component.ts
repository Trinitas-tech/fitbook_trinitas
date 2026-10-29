import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingWithUser, errorMessage } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-bookings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    PaginationComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Réservations</h1>
    </div>

    <form class="card card-sm filters" (ngSubmit)="search()">
      <select class="input" name="status" [(ngModel)]="status">
        <option value="">Tous les statuts</option>
        <option value="confirmee">Confirmée</option>
        <option value="annulee">Annulée</option>
        <option value="terminee">Terminée</option>
      </select>
      <input
        class="input"
        type="date"
        name="date"
        [(ngModel)]="date"
        aria-label="Date de la séance"
      />
      <input
        class="input"
        type="number"
        min="1"
        name="userId"
        [(ngModel)]="userId"
        placeholder="ID utilisateur"
      />
      <button type="submit" class="btn btn-primary">Filtrer</button>
      <button type="button" class="btn btn-ghost" (click)="reset()">Réinitialiser</button>
    </form>

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (bookings().length === 0) {
      <app-empty-state
        icon="calendar"
        title="Aucune réservation"
        message="Aucune réservation ne correspond à ces filtres."
      />
    } @else {
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sportif</th>
              <th>Séance</th>
              <th>Date</th>
              <th>Places</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (b of bookings(); track b.id) {
              <tr>
                <td class="muted">{{ b.id }}</td>
                <td>
                  <strong>{{ b.user.firstName }} {{ b.user.lastName }}</strong>
                  <div class="muted small">{{ b.user.email }}</div>
                </td>
                <td>
                  {{ b.session.course?.title || 'Séance coach' }}
                  <div class="muted small">
                    {{ b.session.course?.gym?.name || b.session.location || '' }}
                  </div>
                </td>
                <td>{{ b.session.startAt | date: 'd MMM yyyy HH:mm' }}</td>
                <td>{{ b.seats }}</td>
                <td><app-status-badge kind="booking" [status]="b.status" /></td>
                <td style="text-align: right">
                  @if (b.status === 'confirmee') {
                    <button type="button" class="btn btn-outline btn-sm" (click)="toCancel.set(b)">
                      Annuler
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [page]="page()"
        [total]="total()"
        [limit]="limit()"
        (pageChange)="goTo($event)"
      />
    }

    @if (toCancel(); as b) {
      <app-confirm-dialog
        title="Annuler cette réservation ?"
        [message]="
          'La réservation de ' +
          b.user.firstName +
          ' ' +
          b.user.lastName +
          ' sera annulée et la place libérée.'
        "
        confirmLabel="Annuler la réservation"
        [danger]="true"
        [busy]="busy()"
        (confirm)="cancel(b)"
        (cancel)="toCancel.set(null)"
      />
    }
  `,
  styles: `
    .filters {
      display: grid;
      grid-template-columns: 180px 180px 160px auto auto;
      gap: 10px;
      margin-bottom: 16px;
    }
    @media (max-width: 768px) {
      .filters {
        grid-template-columns: 1fr 1fr;
      }
    }
  `,
})
export class AdminBookingsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  status = '';
  date = '';
  userId = '';

  readonly bookings = signal<BookingWithUser[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly toCancel = signal<BookingWithUser | null>(null);
  readonly busy = signal(false);

  ngOnInit(): void {
    this.load();
  }

  search(): void {
    this.page.set(1);
    this.load();
  }

  reset(): void {
    this.status = '';
    this.date = '';
    this.userId = '';
    this.search();
  }

  goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  cancel(booking: BookingWithUser): void {
    this.busy.set(true);
    this.admin.cancelBooking(booking.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.toCancel.set(null);
        this.bookings.update((list) =>
          list.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)),
        );
        this.toast.success('Réservation annulée.');
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.toCancel.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.admin
      .bookings({
        status: this.status,
        date: this.date,
        userId: String(this.userId ?? '').trim(),
        page: this.page(),
      })
      .subscribe({
        next: (res) => {
          this.bookings.set(res.items);
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
