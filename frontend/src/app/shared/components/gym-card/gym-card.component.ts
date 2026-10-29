import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GymCard } from '../../../core/models';
import { FavoriteButtonComponent } from '../favorite-button/favorite-button.component';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-gym-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, DecimalPipe, RouterLink, FavoriteButtonComponent, RatingStarsComponent],
  template: `
    <a class="card card-link gym-card" [routerLink]="['/salles', gym().id]">
      <div class="media">
        @if (gym().imageUrl) {
          <img class="card-img" [src]="gym().imageUrl" [alt]="gym().name" loading="lazy" />
        } @else {
          <div class="card-img-placeholder" aria-hidden="true">
            <app-icon name="dumbbell" size="40" />
          </div>
        }
        <div class="fav">
          <app-favorite-button type="gym" [id]="gym().id" [isFavorite]="gym().isFavorite" />
        </div>
      </div>
      <div class="body">
        <h3 class="title">{{ gym().name }}</h3>
        <p class="muted small location">
          <span><app-icon name="map-pin" size="14" /> {{ gym().city }} {{ gym().postalCode }}</span>
          @if (gym().distanceKm !== null && gym().distanceKm !== undefined) {
            <span class="badge badge-primary distance"
              >à {{ gym().distanceKm | number: '1.0-1' }} km</span
            >
          }
        </p>
        <app-rating-stars [rating]="gym().averageRating" [count]="gym().reviewCount" size="sm" />
        @if (gym().activities.length) {
          <div class="tags">
            @for (a of gym().activities.slice(0, 3); track a) {
              <span class="badge">{{ a }}</span>
            }
            @if (gym().activities.length > 3) {
              <span class="badge">+{{ gym().activities.length - 3 }}</span>
            }
          </div>
        }
      </div>
    </a>
  `,
  styles: `
    .gym-card {
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .media {
      position: relative;
    }
    .fav {
      position: absolute;
      top: 10px;
      right: 10px;
    }
    .body {
      padding: 14px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .title {
      margin: 0;
      font-size: 1.05rem;
    }
    p {
      margin: 0;
    }
    .location {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .distance {
      font-size: 0.75rem;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
  `,
})
export class GymCardComponent {
  readonly gym = input.required<GymCard>();
}
