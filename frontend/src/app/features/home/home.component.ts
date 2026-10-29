import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Activity, CoachCard, GymCard, errorMessage } from '../../core/models';
import { CatalogService } from '../../core/services/catalog.service';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { CoachCardComponent } from '../../shared/components/coach-card/coach-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { GymCardComponent } from '../../shared/components/gym-card/gym-card.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    ReactiveFormsModule,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    GymCardComponent,
    CoachCardComponent,
  ],
  template: `
    <section class="hero">
      <div class="container">
        <h1 class="hero-title text-gradient">Trouvez votre prochaine séance de sport</h1>
        <p class="hero-sub">
          Salles, cours collectifs et coachs près de chez vous. Réservez en quelques clics.
        </p>
        <form class="search-bar" [formGroup]="form" (ngSubmit)="search()">
          <label class="sr-only" for="home-q">Mot-clé</label>
          <input
            id="home-q"
            class="input"
            formControlName="q"
            placeholder="Yoga, crossfit, nom d'une salle…"
          />
          <label class="sr-only" for="home-city">Ville</label>
          <input id="home-city" class="input" formControlName="city" placeholder="Ville" />
          <button type="submit" class="btn btn-primary btn-lg">Rechercher</button>
        </form>
      </div>
    </section>

    <div class="container page">
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Activités populaires</h2>
        </div>
        @if (activitiesLoading()) {
          <app-loader />
        } @else if (activitiesError()) {
          <app-alert type="error" [message]="activitiesError()" />
        } @else if (activities().length === 0) {
          <p class="muted">Aucune activité disponible pour le moment.</p>
        } @else {
          <div class="chips">
            @for (a of activities(); track a.id) {
              <a class="chip" [routerLink]="['/recherche']" [queryParams]="{ activity: a.id }">
                @if (a.icon) {
                  <span aria-hidden="true">{{ a.icon }}</span>
                } @else {
                  <app-icon name="award" size="16" />
                }
                {{ a.name }}
              </a>
            }
          </div>
        }
      </section>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Salles de sport</h2>
          <a [routerLink]="['/recherche']" [queryParams]="{ type: 'gym' }"
            >Voir toutes les salles →</a
          >
        </div>
        @if (gymsLoading()) {
          <app-loader />
        } @else if (gymsError()) {
          <app-alert type="error" [message]="gymsError()" />
        } @else if (gyms().length === 0) {
          <app-empty-state
            icon="building"
            title="Aucune salle"
            message="Aucune salle n'est encore référencée."
          />
        } @else {
          <div class="grid">
            @for (g of gyms(); track g.id) {
              <app-gym-card [gym]="g" />
            }
          </div>
        }
      </section>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Coachs</h2>
          <a [routerLink]="['/recherche']" [queryParams]="{ type: 'coach' }"
            >Voir tous les coachs →</a
          >
        </div>
        @if (coachesLoading()) {
          <app-loader />
        } @else if (coachesError()) {
          <app-alert type="error" [message]="coachesError()" />
        } @else if (coaches().length === 0) {
          <app-empty-state
            icon="user"
            title="Aucun coach"
            message="Aucun coach n'est encore disponible."
          />
        } @else {
          <div class="grid">
            @for (c of coaches(); track c.id) {
              <app-coach-card [coach]="c" />
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: `
    .hero {
      padding: 64px 0 48px;
    }
    .hero-title {
      font-size: 2.75rem;
      max-width: 700px;
      margin-bottom: 0.4em;
    }
    .hero-sub {
      color: var(--color-text-muted);
      font-size: 1.1rem;
      max-width: 560px;
    }
    .search-bar {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: 10px;
      background: var(--glass-bg-strong);
      -webkit-backdrop-filter: blur(var(--glass-blur));
      backdrop-filter: blur(var(--glass-blur));
      border: 1px solid var(--glass-border);
      padding: 10px;
      border-radius: var(--radius-lg);
      box-shadow: var(--glass-shadow-hover);
      max-width: 820px;
      margin-top: 24px;
    }
    .search-bar .input {
      border: none;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    @media (max-width: 768px) {
      .hero {
        padding: 40px 0 32px;
      }
      .hero-title {
        font-size: 1.7rem;
      }
      .search-bar {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class HomeComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({ q: '', city: '' });

  readonly activities = signal<Activity[]>([]);
  readonly activitiesLoading = signal(true);
  readonly activitiesError = signal<string | null>(null);

  readonly gyms = signal<GymCard[]>([]);
  readonly gymsLoading = signal(true);
  readonly gymsError = signal<string | null>(null);

  readonly coaches = signal<CoachCard[]>([]);
  readonly coachesLoading = signal(true);
  readonly coachesError = signal<string | null>(null);

  ngOnInit(): void {
    this.catalog.activities().subscribe({
      next: (list) => {
        this.activities.set(list);
        this.activitiesLoading.set(false);
      },
      error: (err: unknown) => {
        this.activitiesError.set(errorMessage(err));
        this.activitiesLoading.set(false);
      },
    });
    this.catalog.gyms({ limit: 6 }).subscribe({
      next: (page) => {
        this.gyms.set(page.items);
        this.gymsLoading.set(false);
      },
      error: (err: unknown) => {
        this.gymsError.set(errorMessage(err));
        this.gymsLoading.set(false);
      },
    });
    this.catalog.coaches({ limit: 6 }).subscribe({
      next: (page) => {
        this.coaches.set(page.items);
        this.coachesLoading.set(false);
      },
      error: (err: unknown) => {
        this.coachesError.set(errorMessage(err));
        this.coachesLoading.set(false);
      },
    });
  }

  search(): void {
    const { q, city } = this.form.getRawValue();
    this.router.navigate(['/recherche'], {
      queryParams: { q: q.trim() || null, city: city.trim() || null },
    });
  }
}
