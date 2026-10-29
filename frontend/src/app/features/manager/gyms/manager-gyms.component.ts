import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/models';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { ManagerGymStore } from '../manager-gym.store';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-manager-gyms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    RatingStarsComponent,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Mes salles</h1>
      <a routerLink="/gestionnaire/salles/nouvelle" class="btn btn-primary">+ Nouvelle salle</a>
    </div>

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (store.gyms().length === 0) {
      <app-empty-state
        icon="building"
        title="Aucune salle"
        message="Créez la fiche de votre première salle."
      >
        <a routerLink="/gestionnaire/salles/nouvelle" class="btn btn-primary btn-sm mt-16"
          >Créer une salle</a
        >
      </app-empty-state>
    } @else {
      <div class="grid">
        @for (g of store.gyms(); track g.id) {
          <article class="card gym">
            @if (g.imageUrl) {
              <img class="card-img" [src]="g.imageUrl" [alt]="g.name" />
            } @else {
              <div class="card-img-placeholder" aria-hidden="true">
                <app-icon name="dumbbell" size="40" />
              </div>
            }
            <div class="body">
              <h3 style="margin: 0">{{ g.name }}</h3>
              <p class="muted small" style="margin: 0">
                <app-icon name="map-pin" size="14" /> {{ g.address }}, {{ g.postalCode }}
                {{ g.city }}
              </p>
              <app-rating-stars [rating]="g.averageRating" [count]="g.reviewCount" size="sm" />
              <p class="muted small" style="margin: 4px 0 0">
                {{ g.courses.length }} cours · capacité {{ g.totalCapacity }}
              </p>
              <div class="actions">
                <a [routerLink]="['/gestionnaire/salles', g.id]" class="btn btn-outline btn-sm"
                  >Fiche</a
                >
                <a
                  [routerLink]="['/gestionnaire/salles', g.id, 'cours']"
                  class="btn btn-outline btn-sm"
                  >Cours</a
                >
                <a
                  [routerLink]="['/gestionnaire/salles', g.id, 'reservations']"
                  class="btn btn-outline btn-sm"
                  >Réservations</a
                >
                <a
                  [routerLink]="['/gestionnaire/salles', g.id, 'avis']"
                  class="btn btn-outline btn-sm"
                  >Avis</a
                >
                <a [routerLink]="['/salles', g.id]" class="btn btn-ghost btn-sm">Voir en public</a>
              </div>
            </div>
          </article>
        }
      </div>
    }
  `,
  styles: `
    .gym {
      padding: 0;
      overflow: hidden;
    }
    .body {
      padding: 14px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }
  `,
})
export class ManagerGymsComponent implements OnInit {
  readonly store = inject(ManagerGymStore);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.store.load().subscribe({
      next: () => this.loading.set(false),
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
