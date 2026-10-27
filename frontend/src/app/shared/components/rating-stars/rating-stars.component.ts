import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-rating-stars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <span class="stars" [class.editable]="editable()" [class.sm]="size() === 'sm'">
      @for (star of stars; track star) {
        <button
          type="button"
          class="star"
          [class.filled]="star <= displayed()"
          [class.half]="!editable() && star - 0.5 <= displayed() && star > displayed()"
          [disabled]="!editable()"
          [attr.aria-label]="star + ' étoile' + (star > 1 ? 's' : '')"
          (mouseenter)="editable() && hover.set(star)"
          (mouseleave)="editable() && hover.set(0)"
          (click)="select(star)"
        >
          ★
        </button>
      }
    </span>
    @if (showValue()) {
      <span class="value">
        @if (rating() !== null && rating() !== undefined) {
          {{ rating() | number: '1.1-1' }}
        } @else {
          –
        }
        @if (count() !== null && count() !== undefined) {
          <span class="muted">({{ count() }} avis)</span>
        }
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .stars {
      display: inline-flex;
      gap: 1px;
    }
    .star {
      background: none;
      border: none;
      padding: 0;
      font-size: 1.1rem;
      line-height: 1;
      color: #cbd5e1;
      cursor: default;
    }
    .sm .star {
      font-size: 0.9rem;
    }
    .star.filled,
    .star.half {
      color: #f59e0b;
    }
    .editable .star {
      cursor: pointer;
      font-size: 1.6rem;
    }
    .value {
      font-size: 0.9rem;
      font-weight: 600;
    }
    .muted {
      font-weight: 400;
    }
  `,
})
export class RatingStarsComponent {
  readonly rating = input<number | null | undefined>(null);
  readonly count = input<number | null | undefined>(null);
  readonly editable = input(false);
  readonly showValue = input(true);
  readonly size = input<'sm' | 'md'>('md');
  readonly ratingChange = output<number>();

  readonly stars = [1, 2, 3, 4, 5];
  readonly hover = signal(0);
  readonly displayed = computed(() => (this.hover() > 0 ? this.hover() : this.rating() ?? 0));

  select(star: number): void {
    if (this.editable()) {
      this.ratingChange.emit(star);
    }
  }
}
