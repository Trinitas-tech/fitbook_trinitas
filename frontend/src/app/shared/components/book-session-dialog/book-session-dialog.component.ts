import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Booking, Session, errorMessage } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { AlertComponent } from '../alert/alert.component';

/** Modale de confirmation de réservation d'une séance. */
@Component({
  selector: 'app-book-session-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, AlertComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal" role="dialog" aria-modal="true" aria-label="Confirmer la réservation" (click)="$event.stopPropagation()">
        <h3 class="modal-title">Confirmer la réservation</h3>
        <div class="summary">
          <p class="bold" style="margin: 0">{{ session().course?.title || 'Séance avec le coach' }}</p>
          <p class="muted" style="margin: 0; text-transform: capitalize">
            {{ session().startAt | date: 'EEEE d MMMM yyyy' }} · {{ session().startAt | date: 'HH:mm' }} – {{ session().endAt | date: 'HH:mm' }}
          </p>
          @if (session().location) {
            <p class="muted" style="margin: 0">📍 {{ session().location }}</p>
          }
          <p style="margin: 8px 0 0">
            <span class="price">{{ session().price | currency: 'EUR' : 'symbol' : '1.0-2' }}</span>
            <span class="muted small"> · {{ session().remainingSeats }} place(s) restante(s)</span>
          </p>
        </div>
        <app-alert type="error" [message]="error()" />
        <div class="form-actions">
          <button type="button" class="btn btn-outline" (click)="close()" [disabled]="busy()">Annuler</button>
          <button type="button" class="btn btn-primary" (click)="confirm()" [disabled]="busy()">
            {{ busy() ? 'Réservation…' : 'Confirmer la réservation' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .summary {
      background: var(--color-bg);
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 16px;
    }
  `,
})
export class BookSessionDialogComponent {
  private readonly bookings = inject(BookingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly session = input.required<Session>();
  readonly booked = output<Booking>();
  readonly cancelled = output<void>();

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  confirm(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/connexion'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.bookings.create({ sessionId: this.session().id, seats: 1 }).subscribe({
      next: (booking) => {
        this.busy.set(false);
        this.booked.emit(booking);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  close(): void {
    if (!this.busy()) {
      this.cancelled.emit();
    }
  }
}
