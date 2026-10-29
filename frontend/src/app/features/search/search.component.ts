import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Activity,
  LEVEL_OPTIONS,
  SearchParams,
  SearchResult,
  errorMessage,
} from '../../core/models';
import { CatalogService } from '../../core/services/catalog.service';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { CoachCardComponent } from '../../shared/components/coach-card/coach-card.component';
import { CourseCardComponent } from '../../shared/components/course-card/course-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { GymCardComponent } from '../../shared/components/gym-card/gym-card.component';
import { GymMapComponent, MapPosition } from '../../shared/components/gym-map/gym-map.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

/** Filtres pilotés par le formulaire. */
const FORM_KEYS = [
  'q',
  'city',
  'activity',
  'level',
  'priceMax',
  'date',
  'ratingMin',
  'type',
] as const;
/** Tous les paramètres d'URL transmis à l'API (US-21 : lat/lng hors formulaire). */
const FILTER_KEYS: (keyof SearchParams)[] = [...FORM_KEYS, 'lat', 'lng'];

type ViewMode = 'list' | 'map';

@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    ReactiveFormsModule,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    GymCardComponent,
    CoachCardComponent,
    CourseCardComponent,
    GymMapComponent,
  ],
  template: `
    <div class="container page">
      <form [formGroup]="form" (ngSubmit)="apply()">
        <div class="search-bar card">
          <label class="sr-only" for="s-q">Mot-clé</label>
          <input
            id="s-q"
            class="input"
            formControlName="q"
            placeholder="Mot-clé : yoga, crossfit, nom…"
          />
          <label class="sr-only" for="s-city">Ville</label>
          <input id="s-city" class="input" formControlName="city" placeholder="Ville" />
          <button type="submit" class="btn btn-primary">Rechercher</button>
          <button
            type="button"
            class="btn btn-outline hide-desktop"
            (click)="filtersOpen.set(!filtersOpen())"
          >
            Filtres {{ activeFilterCount() ? '(' + activeFilterCount() + ')' : '' }}
          </button>
        </div>

        <div class="layout">
          <aside class="filters card" [class.open]="filtersOpen()">
            <div class="flex between">
              <h3 style="margin: 0">Filtres</h3>
              <button type="button" class="btn btn-ghost btn-sm" (click)="reset()">
                Réinitialiser
              </button>
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
              <input
                id="f-price"
                type="number"
                min="0"
                class="input"
                formControlName="priceMax"
                placeholder="ex. 20"
              />
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
            <!-- US-21 : bascule Liste / Carte + géolocalisation -->
            <div class="toolbar">
              <div class="segmented" role="group" aria-label="Affichage des résultats">
                <button
                  type="button"
                  [class.active]="view() === 'list'"
                  [attr.aria-pressed]="view() === 'list'"
                  (click)="view.set('list')"
                >
                  <app-icon name="list" size="16" /> Liste
                </button>
                <button
                  type="button"
                  [class.active]="view() === 'map'"
                  [attr.aria-pressed]="view() === 'map'"
                  (click)="view.set('map')"
                >
                  <app-icon name="map" size="16" /> Carte
                </button>
              </div>
              <div class="geo">
                @if (position(); as pos) {
                  <span
                    class="badge badge-info"
                    title="Latitude {{ pos.lat }}, longitude {{ pos.lng }}"
                    ><app-icon name="map-pin" size="14" /> Position utilisée · tri par
                    distance</span
                  >
                  <button type="button" class="btn btn-ghost btn-sm" (click)="clearPosition()">
                    Retirer la position
                  </button>
                } @else {
                  <button
                    type="button"
                    class="btn btn-outline btn-sm"
                    (click)="locate()"
                    [disabled]="locating()"
                  >
                    @if (locating()) {
                      <span
                        class="spinner"
                        style="width: 14px; height: 14px; border-width: 2px"
                      ></span>
                      Localisation…
                    } @else {
                      <app-icon name="map-pin" size="14" /> Autour de moi
                    }
                  </button>
                }
              </div>
            </div>
            <app-alert type="warning" [message]="geoError()" />

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
                <app-empty-state
                  title="Aucun résultat"
                  message="Essayez d'élargir vos critères de recherche."
                />
              }
              @if (view() === 'map') {
                <div class="section">
                  <h2 class="section-title">Salles sur la carte ({{ mappableGyms().length }})</h2>
                  @if (mappableGyms().length) {
                    <app-gym-map
                      [gyms]="mappableGyms()"
                      [userPosition]="position()"
                      height="480px"
                    />
                    @if (r.gyms.length > mappableGyms().length) {
                      <p class="muted small" style="margin-top: 8px">
                        {{ r.gyms.length - mappableGyms().length }} salle{{
                          r.gyms.length - mappableGyms().length > 1 ? 's' : ''
                        }}
                        sans coordonnées n'apparai{{
                          r.gyms.length - mappableGyms().length > 1 ? 'ssent' : 't'
                        }}
                        pas sur la carte.
                      </p>
                    }
                  } @else {
                    <app-empty-state
                      icon="map"
                      title="Aucune salle géolocalisée"
                      message="Aucune salle de ces résultats ne dispose de coordonnées GPS. Passez en vue liste."
                    />
                  }
                </div>
              } @else if (r.gyms.length) {
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
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
    }
    .segmented {
      display: inline-flex;
      background: var(--color-surface);
      box-shadow: var(--neu-pressed-sm);
      border-radius: var(--radius-pill);
      padding: 4px;
    }
    .segmented button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: none;
      background: transparent;
      padding: 6px 14px;
      min-height: 36px;
      border-radius: var(--radius-pill);
      transition:
        background var(--dur-fast),
        color var(--dur-fast);
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--color-text-muted);
    }
    .segmented button.active {
      background: var(--grad-water);
      color: #0f172a;
    }
    .geo {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
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
  readonly view = signal<ViewMode>('list');
  readonly locating = signal(false);
  readonly geoError = signal<string | null>(null);

  readonly activeFilterCount = computed(
    () =>
      Object.entries(this.currentParams()).filter(
        ([k, v]) => !['q', 'city', 'lat', 'lng'].includes(k) && v,
      ).length,
  );

  /** Position issue de l'URL (`?lat=&lng=`), null si absente ou invalide. */
  readonly position = computed<MapPosition | null>(() => {
    const { lat, lng } = this.currentParams();
    const la = Number(lat);
    const ln = Number(lng);
    return lat && lng && Number.isFinite(la) && Number.isFinite(ln) ? { lat: la, lng: ln } : null;
  });

  readonly mappableGyms = computed(
    () =>
      this.result()?.gyms.filter(
        (g) => typeof g.latitude === 'number' && typeof g.longitude === 'number',
      ) ?? [],
  );

  ngOnInit(): void {
    this.catalog
      .activities()
      .subscribe({ next: (list) => this.activities.set(list), error: () => undefined });

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
      const formValues = { ...this.emptyValues() };
      for (const key of FORM_KEYS) {
        if (params[key]) {
          formValues[key] = params[key] as string;
        }
      }
      this.form.patchValue(formValues, { emitEvent: false });
      this.fetch(params);
    });
  }

  apply(): void {
    const raw = this.form.getRawValue();
    const queryParams: Record<string, string | null> = {};
    for (const key of FORM_KEYS) {
      const value = String(raw[key] ?? '').trim();
      queryParams[key] = value || null;
    }
    this.filtersOpen.set(false);
    // 'merge' : lat/lng (position) sont conservés lors d'un changement de filtre.
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  reset(): void {
    this.form.reset(this.emptyValues());
    this.apply();
  }

  /** US-21 : « Autour de moi » — ajoute lat/lng aux query params. */
  locate(): void {
    this.geoError.set(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.geoError.set("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.locating.set(false);
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            lat: pos.coords.latitude.toFixed(5),
            lng: pos.coords.longitude.toFixed(5),
          },
          queryParamsHandling: 'merge',
        });
      },
      (err) => {
        this.locating.set(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            this.geoError.set(
              'Vous avez refusé le partage de votre position. Autorisez la géolocalisation dans votre navigateur pour trier les salles par distance.',
            );
            break;
          case err.TIMEOUT:
            this.geoError.set('La localisation a pris trop de temps. Veuillez réessayer.');
            break;
          default:
            this.geoError.set('Impossible de déterminer votre position pour le moment.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  clearPosition(): void {
    this.geoError.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { lat: null, lng: null },
      queryParamsHandling: 'merge',
    });
  }

  private fetch(params: SearchParams): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalog.search(params).subscribe({
      next: (res) => {
        // L'ordre renvoyé par l'API est conservé (trié par distance quand lat/lng sont fournis).
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private emptyValues(): Record<(typeof FORM_KEYS)[number], string> {
    return {
      q: '',
      city: '',
      activity: '',
      level: '',
      priceMax: '',
      date: '',
      ratingMin: '',
      type: '',
    };
  }
}
