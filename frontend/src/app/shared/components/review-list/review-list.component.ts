import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Review } from '../../../core/models';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';

@Component({
  selector: 'app-review-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RatingStarsComponent],
  template: `
    @if (reviews().length) {
      <ul>
        @for (r of reviews(); track r.id) {
          <li class="review">
            <div class="flex between flex-wrap">
              <span class="bold">{{ r.author.firstName }} {{ r.author.lastName }}</span>
              <span class="muted small">{{ r.createdAt | date: 'd MMMM yyyy' }}</span>
            </div>
            <app-rating-stars [rating]="r.rating" [showValue]="false" size="sm" />
            @if (r.comment) {
              <p class="comment">{{ r.comment }}</p>
            }
          </li>
        }
      </ul>
    } @else {
      <p class="muted">{{ emptyMessage() }}</p>
    }
  `,
  styles: `
    .comment {
      margin: 6px 0 0;
      white-space: pre-line;
    }
  `,
})
export class ReviewListComponent {
  readonly reviews = input<Review[]>([]);
  readonly emptyMessage = input('Aucun avis pour le moment.');
}
