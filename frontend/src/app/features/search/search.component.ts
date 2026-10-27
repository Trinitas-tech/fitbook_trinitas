import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Activity, LEVEL_OPTIONS, SearchParams, SearchResult, errorMessage } from '../../core/models';
import { CatalogService } from '../../core/services/catalog.service';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { CoachCardComponent } from '../../shared/components/coach-card/coach-card.component';
import { CourseCardComponent } from '../../shared/components/course-card/course-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { GymCardComponent } from '../../shared/components/gym-card/gym-card.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

const FILTER_KEYS: (keyof SearchParams)[] = ['q', 'city', 'activity', 'level', 'priceMax', 'date', 'ratingMin', 'type'];

@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    GymCardComponent,
    CoachCardComponent,
    CourseCardComponent,
  ],
  template: `
    <div class="container page">
      <form [formGroup]="form" (ngSubmit)="apply()">
        <div class="search-bar card">
          <label class="sr-only" for="s-q">Mot-clé</label>
          <input id="s-q" class="input" formControlName="q" placeholder="Mot-clé : yoga, crossfit, nom…" />
          <label class="sr-only" for="s-city">Ville</label>
          <input id="s-city" class="input" formControlName="city" placeholder="Ville" />
          <button type="submit" class="btn btn-primary">Rechercher</button>
          <button type="button" class="btn btn-outline hide-desktop" (click)="filtersOpen.set(!filtersOpen())">
            Filtres {{ activeFilterCount() ? '(' + activeFilterCount() + ')' : '' }}
          </button>
        </div>

        <div class="layout">
          <aside class="filters card" [class.open]="filtersOpen()">
            <div class="flex between">
              <h3 style="margin: 0">Filtres</h3>
              <button type="button" class="btn btn-ghost btn-sm" (click)="reset()">Réinitialiser</button>
            </div>
            <div class="field">
              <label class="label" for="f-type">Type</label>
              <select id="f-type" class="input" formControlName="type">
                <option value="">Tout</option>
                <option value="gym">Salles</option>
                <option value="coach">Coachs</option>
                <option value="course">Cours</option>
              </select>
            </div>
            <div class="field">
              <label class="label" for="f-activity">Activité</label>
              <select id="f-activity" class="input" formControlName="activity">
                <option value="">Toutes</option>
                @for (a of activities(); track a.id) {
                  <option [value]="a.id">{{ a.name }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label class="label" for="f-level">Niveau</label>
              <select id="f-level" class="input" formControlName="level">
                <option value="">Tous</option>
                @for (l of levels; track l.value) {
                  <option [value]="l.value">{{ l.label }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label class="label" for="f-price">Prix max (€)</label>
              <input id="f-price" type="number" min="0" class="input" formControlName="priceMax" placeholder="ex. 20" />
            </div>
            <div class="field">
              <label class="label" for="f-date">Date</label>
              <input id="f-date" type="date" class="input" formControlName="date" />
            </div>
            <div class="field">
              <label class="label" for="f-rating">Note minimale</label>
              <select id="f-rating" class="input" formControlName="ratingMin">
                <option value="">Toutes</option>
                <option value="3">3 ★ et plus</option>
                <option value="4">4 ★ et plus</option>
                <option value="4.5">4,5 ★ et plus</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Appliquer les filtres</button>
          </aside>

          <section class="results">
            @if (loading()) {
              <app-loader label="Recherche en cours…" />
            } @else if (error()) {
              <app-alert type="error" [message]="error()" />
            } @else if (result(); as r) {
              <p class="count">
                <strong>{{ r.total }}</strong> résultat{{ r.total > 1 ? 's' : '' }}
                @if (form.controls.q.value) {
                  pour « {{ form.controls.q.value }} »
                }
              </p>
              @if (r.total === 0) {
                <app-empty-state title="Aucun résultat" message="Essayez d'élargir vos critères de recherche." />
              }
              @if (r.gyms.length) {
                <div class="section">
                  <h2 class="section-title">Salles ({{ r.gyms.length }})</h2>
                  <div class="grid">
                    @for (g of r.gyms; track g.id) {
                      <app-gym-card [gym]="g" />
                    }
                  </div>
                </div>
              }
              @if (r.coaches.length) {
                <div class="section">
                  <h2 class="section-title">Coachs ({{ r.coaches.length }})</h2>
                  <div class="grid">
                    @for (c of r.coaches; track c.id) {
                      <app-coach-card [coach]="c" />
                    }
                  </div>
                </div>
              }
              @if (r.courses.length) {
                <div class="section">
                  <h2 class="section-title">Cours ({{ r.courses.length }})</h2>
                  <div class="grid">
                    @for (c of r.courses; track c.id) {
                      <app-course-card [course]="c" />
                    }
                  </div>
                </div>
              }
            }
          </section>
        </div>
      </form>
    </div>
  `,
  styles: `
    .search-bar {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: 10px;
      padding: 12px;
      margin-bottom: 20px;
    }
    .layout {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      gap: 24px;
      align-items: start;
    }
    .filters {
      position: sticky;
      top: calc(var(--header-height) + 16px);
    }
    .filters .field {
      margin-bottom: 12px;
    }
    .count {
      color: var(--color-text-muted);
      margin-bottom: 16px;
    }
    .section-title {
      margin-bottom: 12px;
    }
    @media (max-width: 768px) {
      .search-bar {
        grid-template-columns: 1fr 1fr;
      }
      .search-bar .input:first-of-type {
        grid-column: 1 / -1;
      }
      .layout {
        grid-template-columns: 1fr;
      }
      .filters {
        display: none;
        position: static;
      }
      .filters.open {
        display: block;
      }
    }
  `,
})
export class SearchComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly levels = LEVEL_OPTIONS;
  readonly form = this.fb.nonNullable.group({
    q: '',
    city: '',
    activity: '',
    level: '',
    priceMax: '',
    date: '',
    ratingMin: '',
    type: '',
  });

  readonly activities = signal<Activity[]>([]);
  readonly result = signal<SearchResult | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filtersOpen = signal(false);
  readonly currentParams = signal<SearchParams>({});
  readonly activeFilterCount = computed(
    () => Object.entries(this.currentParams()).filter(([k, v]) => k !== 'q' && k !== 'city' && v).length,
  );

  ngOnInit(): void {
    this.catalog.activities().subscribe({ next: (list) => this.activities.set(list), error: () => undefined });

    // Synchronisation URL → formulaire → requête (US-11 : URL partageable)
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((map) => {
      const params: SearchParams = {};
      for (const key of FILTER_KEYS) {
        const value = map.get(key);
        if (value) {
          params[key] = value as never;
        }
      }
      this.currentParams.set(params);
      this.form.patchValue({ ...this.emptyValues(), ...params }, { emitEvent: false });
      this.fetch(params);
    });
  }

  apply(): void {
    const raw = this.form.getRawValue();
    const queryParams: Record<string, string | null> = {};
    for (const key of FILTER_KEYS) {
      const value = String(raw[key] ?? '').trim();
      queryParams[key] = value || null;
    }
    this.filtersOpen.set(false);
    this.router.navigate([], { relativeTo: this.route, queryParams });
  }

  reset(): void {
    this.form.reset(this.emptyValues());
    this.apply();
  }

  private fetch(params: SearchParams): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalog.search(params).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private emptyValues() {
    return { q: '', city: '', activity: '', level: '', priceMax: '', date: '', ratingMin: '', type: '' };
  }
}
