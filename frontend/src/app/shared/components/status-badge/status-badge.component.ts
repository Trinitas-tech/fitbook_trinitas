import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  BOOKING_STATUS_BADGES,
  BOOKING_STATUS_LABELS,
  BookingStatus,
  REVIEW_STATUS_LABELS,
  SESSION_STATUS_BADGES,
  SESSION_STATUS_LABELS,
  SessionStatus,
} from '../../../core/models';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge {{ cssClass() }}">{{ label() }}</span>`,
})
export class StatusBadgeComponent {
  readonly kind = input.required<'session' | 'booking' | 'review'>();
  readonly status = input.required<string>();

  readonly label = computed(() => {
    const s = this.status();
    switch (this.kind()) {
      case 'session':
        return SESSION_STATUS_LABELS[s as SessionStatus] ?? s;
      case 'booking':
        return BOOKING_STATUS_LABELS[s as BookingStatus] ?? s;
      default:
        return REVIEW_STATUS_LABELS[s] ?? s;
    }
  });

  readonly cssClass = computed(() => {
    const s = this.status();
    switch (this.kind()) {
      case 'session':
        return SESSION_STATUS_BADGES[s as SessionStatus] ?? '';
      case 'booking':
        return BOOKING_STATUS_BADGES[s as BookingStatus] ?? '';
      default:
        return s === 'approuve' ? 'badge-success' : s === 'masque' ? 'badge-danger' : 'badge-warning';
    }
  });
}
