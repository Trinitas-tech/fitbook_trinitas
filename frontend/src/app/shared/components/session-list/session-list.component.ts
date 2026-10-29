import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Session } from '../../../core/models';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-session-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, CurrencyPipe, DatePipe, StatusBadgeComponent],
  template: `
    <ul class="list">
      @for (s of sessions(); track s.id) {
        <li
          class="list-item session"
          [class.selected]="s.id === selectedId()"
          (click)="select.emit(s)"
        >
          <div class="when">
            <span class="day">{{ s.startAt | date: 'EEE d MMM' }}</span>
            <span class="time"
              >{{ s.startAt | date: 'HH:mm' }} – {{ s.endAt | date: 'HH:mm' }}</span
            >
          </div>
          <div class="info">
            @if (showTitle()) {
              <span class="bold">{{ s.course?.title || 'Séance avec le coach' }}</span>
            }
            @if (s.location) {
              <span class="muted small"
                ><app-icon name="map-pin" size="14" /> {{ s.location }}</span
              >
            }
            @if (s.course?.gym && showTitle()) {
              <span class="muted small"
                ><app-icon name="building" size="14" /> {{ s.course!.gym.name }}</span
              >
            }
            <span
              class="small"
              [class.muted]="s.remainingSeats > 0"
              [class.full]="s.remainingSeats <= 0"
            >
              {{ seatsLabel(s) }}
            </span>
          </div>
          <div class="right">
            <span class="price">{{ s.price | currency: 'EUR' : 'symbol' : '1.0-2' }}</span>
            <app-status-badge kind="session" [status]="s.status" />
            @if (showBook()) {
              @if (s.myBookingId) {
                <span class="badge badge-success">Réservée</span>
              } @else if (s.isBookable) {
                <button type="button" class="btn btn-primary btn-sm" (click)="onBook($event, s)">
                  Réserver
                </button>
              }
            }
            @if (s.bookingCount !== undefined) {
              <span class="badge badge-info">{{ s.bookingCount }} réservation(s)</span>
            }
          </div>
        </li>
      } @empty {
        <li class="empty-state">
          <div class="icon" aria-hidden="true"><app-icon name="calendar" size="14" /></div>
          {{ emptyMessage() }}
        </li>
      }
    </ul>
  `,
  styles: `
    .session {
      cursor: pointer;
      border: 1px solid transparent;
    }
    .session.selected {
      border-color: var(--color-primary);
    }
    .when {
      display: flex;
      flex-direction: column;
      min-width: 120px;
    }
    .day {
      font-weight: 700;
      text-transform: capitalize;
    }
    .time {
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }
    .info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 160px;
    }
    .full {
      color: var(--color-danger);
      font-weight: 600;
    }
    .right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
  `,
})
export class SessionListComponent {
  readonly sessions = input<Session[]>([]);
  readonly showBook = input(true);
  readonly showTitle = input(true);
  readonly selectedId = input<number | null>(null);
  readonly emptyMessage = input('Aucune séance sur cette période.');
  readonly book = output<Session>();
  readonly select = output<Session>();

  seatsLabel(s: Session): string {
    if (s.status === 'annulee') {
      return 'Séance annulée';
    }
    if (s.remainingSeats <= 0) {
      return 'Complet';
    }
    return `${s.remainingSeats} place${s.remainingSeats > 1 ? 's' : ''} restante${s.remainingSeats > 1 ? 's' : ''} / ${s.capacity}`;
  }

  onBook(event: Event, s: Session): void {
    event.stopPropagation();
    this.book.emit(s);
  }
}
