import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoachCard } from '../../../core/models';
import { FavoriteButtonComponent } from '../favorite-button/favorite-button.component';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';

@Component({
  selector: 'app-coach-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, FavoriteButtonComponent, RatingStarsComponent],
  template: `
    <a class="card card-link coach-card" [routerLink]="['/coachs', coach().id]">
      <div class="top">
        @if (coach().avatarUrl) {
          <img class="avatar avatar-lg" [src]="coach().avatarUrl" [alt]="fullName()" loading="lazy" />
        } @else {
          <span class="avatar avatar-lg">{{ initials() }}</span>
        }
        <div class="fav">
          <app-favorite-button type="coach" [id]="coach().id" [isFavorite]="coach().isFavorite" />
        </div>
      </div>
      <h3 class="title">{{ fullName() }}</h3>
      @if (coach().specialty) {
        <span class="badge badge-primary">{{ coach().specialty }}</span>
      }
      <p class="muted small">📍 {{ coach().city || 'Ville non renseignée' }}</p>
      <app-rating-stars [rating]="coach().averageRating" [count]="coach().reviewCount" size="sm" />
      @if (coach().hourlyRate !== null) {
        <p class="rate">
          <span class="price">{{ coach().hourlyRate | currency: 'EUR' : 'symbol' : '1.0-2' }}</span>
          <span class="muted small"> / heure</span>
        </p>
      }
    </a>
  `,
  styles: `
    .coach-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 6px;
      height: 100%;
    }
    .top {
      position: relative;
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .fav {
      position: absolute;
      top: 0;
      right: 0;
    }
    .title {
      margin: 6px 0 0;
      font-size: 1.05rem;
    }
    p {
      margin: 0;
    }
    .rate {
      margin-top: 4px;
    }
  `,
})
export class CoachCardComponent {
  readonly coach = input.required<CoachCard>();

  fullName(): string {
    return `${this.coach().firstName} ${this.coach().lastName}`;
  }

  initials(): string {
    const c = this.coach();
    return `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase();
  }
}
