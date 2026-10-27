import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseCard, LEVEL_LABELS } from '../../../core/models';

@Component({
  selector: 'app-course-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <a class="card card-link course-card" [routerLink]="['/cours', course().id]">
      @if (course().imageUrl) {
        <img class="card-img" [src]="course().imageUrl" [alt]="course().title" loading="lazy" />
      } @else {
        <div class="card-img-placeholder" aria-hidden="true">{{ course().activity.icon || '🏃' }}</div>
      }
      <div class="body">
        <div class="flex between">
          <span class="badge badge-primary">{{ course().activity.name }}</span>
          <span class="badge">{{ levelLabel() }}</span>
        </div>
        <h3 class="title">{{ course().title }}</h3>
        <p class="muted small">🏢 {{ course().gym.name }} · {{ course().gym.city }}</p>
        @if (course().coach) {
          <p class="muted small">👤 {{ course().coach!.firstName }} {{ course().coach!.lastName }}</p>
        }
        <div class="flex between meta">
          <span class="small muted">⏱ {{ course().durationMinutes }} min</span>
          <span class="price">{{ course().price | currency: 'EUR' : 'symbol' : '1.0-2' }}</span>
        </div>
        @if (course().nextSessionAt) {
          <p class="next">Prochaine séance : {{ course().nextSessionAt | date: 'EEE d MMM à HH:mm' }}</p>
        }
      </div>
    </a>
  `,
  styles: `
    .course-card {
      padding: 0;
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .body {
      padding: 14px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .title {
      margin: 2px 0 0;
      font-size: 1.05rem;
    }
    p {
      margin: 0;
    }
    .meta {
      margin-top: 4px;
    }
    .next {
      font-size: 0.82rem;
      color: var(--color-success);
      font-weight: 600;
    }
  `,
})
export class CourseCardComponent {
  readonly course = input.required<CourseCard>();

  levelLabel(): string {
    return LEVEL_LABELS[this.course().level] ?? this.course().level;
  }
}
