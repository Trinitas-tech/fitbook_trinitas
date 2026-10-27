import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DAY_LABELS, GymDetail, OpeningHour, errorMessage, isApiError } from '../../../core/models';
import { ManagerService } from '../../../core/services/manager.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ManagerGymNavComponent } from '../gym-nav/manager-gym-nav.component';
import { ManagerGymStore } from '../manager-gym.store';

type HourGroup = FormGroup<{
  closed: FormControl<boolean>;
  opensAt: FormControl<string>;
  closesAt: FormControl<string>;
}>;

@Component({
  selector: 'app-manager-gym-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, LoaderComponent, ManagerGymNavComponent],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/gestionnaire/salles" class="small">← Mes salles</a>
        <h1 class="page-title">{{ isNew() ? 'Nouvelle salle' : gym()?.name || 'Fiche salle' }}</h1>
      </div>
      @if (gym(); as g) {
        <a [routerLink]="['/salles', g.id]" class="btn btn-ghost btn-sm">Voir la fiche publique</a>
      }
    </div>

    @if (!isNew()) {
      <app-manager-gym-nav [gymId]="numericId()" />
    }

    @if (loading()) {
      <app-loader />
    } @else if (loadError()) {
      <app-alert type="error" [message]="loadError()" />
    } @else {
      <div class="two-col">
        <form class="card" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <h2>Informations</h2>
          <app-alert type="error" [message]="error()" />
          <div class="field">
            <label class="label" for="name">Nom de la salle</label>
            <input id="name" class="input" formControlName="name" />
            @if (invalid('name')) {
              <span class="field-error">Le nom est obligatoire.</span>
            }
          </div>
          <div class="field">
            <label class="label" for="description">Description</label>
            <textarea id="description" class="input" formControlName="description" rows="4"></textarea>
          </div>
          <div class="field">
            <label class="label" for="address">Adresse</label>
            <input id="address" class="input" formControlName="address" />
            @if (invalid('address')) {
              <span class="field-error">L'adresse est obligatoire.</span>
            }
          </div>
          <div class="form-row">
            <div class="field">
              <label class="label" for="postalCode">Code postal</label>
              <input id="postalCode" class="input" formControlName="postalCode" inputmode="numeric" />
              @if (invalid('postalCode')) {
                <span class="field-error">Code postal à 5 chiffres.</span>
              }
            </div>
            <div class="field">
              <label class="label" for="city">Ville</label>
              <input id="city" class="input" formControlName="city" />
              @if (invalid('city')) {
                <span class="field-error">La ville est obligatoire.</span>
              }
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label class="label" for="phone">Téléphone</label>
              <input id="phone" type="tel" class="input" formControlName="phone" />
            </div>
            <div class="field">
              <label class="label" for="totalCapacity">Capacité totale</label>
              <input id="totalCapacity" type="number" min="1" class="input" formControlName="totalCapacity" />
              @if (invalid('totalCapacity')) {
                <span class="field-error">Capacité minimale : 1.</span>
              }
            </div>
          </div>
          <div class="field">
            <label class="label" for="imageUrl">Photo (URL)</label>
            <input id="imageUrl" type="url" class="input" formControlName="imageUrl" placeholder="https://…" />
            @if (invalid('imageUrl')) {
              <span class="field-error">URL invalide.</span>
            }
          </div>
          <div class="form-row">
            <div class="field">
              <label class="label" for="latitude">Latitude (optionnel)</label>
              <input id="latitude" type="number" step="any" class="input" formControlName="latitude" />
            </div>
            <div class="field">
              <label class="label" for="longitude">Longitude (optionnel)</label>
              <input id="longitude" type="number" step="any" class="input" formControlName="longitude" />
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="busy()">{{ busy() ? 'Enregistrement…' : isNew() ? 'Créer la salle' : 'Enregistrer' }}</button>
          </div>
        </form>

        <form class="card" [formGroup]="hoursForm" (ngSubmit)="saveHours()" novalidate>
          <h2>Horaires d'ouverture</h2>
          @if (isNew()) {
            <p class="muted small">Enregistrez d'abord la fiche de la salle pour définir ses horaires.</p>
          } @else {
            <app-alert type="error" [message]="hoursError()" />
            <div formArrayName="days" class="days">
              @for (day of days.controls; track $index; let i = $index) {
                <div class="day" [formGroupName]="i" [class.closed]="day.controls.closed.value">
                  <span class="day-label">{{ dayLabels[i] }}</span>
                  <label class="checkbox small"><input type="checkbox" formControlName="closed" /> Fermé</label>
                  <input type="time" class="input" formControlName="opensAt" aria-label="Ouverture" />
                  <span>→</span>
                  <input type="time" class="input" formControlName="closesAt" aria-label="Fermeture" />
                </div>
              }
            </div>
            @if (hoursInvalid()) {
              <p class="field-error mt-16">L'heure de fermeture doit être postérieure à l'heure d'ouverture.</p>
            }
            <div class="form-actions">
              <button type="submit" class="btn btn-outline" [disabled]="hoursBusy() || hoursInvalid()">{{ hoursBusy() ? 'Enregistrement…' : 'Enregistrer les horaires' }}</button>
            </div>
          }
        </form>
      </div>
    }
  `,
  styles: `
    .days {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .day {
      display: grid;
      grid-template-columns: 80px auto 1fr auto 1fr;
      align-items: center;
      gap: 8px;
    }
    .day .input {
      padding: 6px 8px;
    }
    .day.closed .input {
      opacity: 0.4;
      pointer-events: none;
    }
    .day-label {
      font-weight: 600;
      font-size: 0.9rem;
    }
    @media (max-width: 480px) {
      .day {
        grid-template-columns: 1fr 1fr;
      }
      .day > span:not(.day-label) {
        display: none;
      }
    }
  `,
})
export class ManagerGymFormComponent implements OnInit {
  private readonly manager = inject(ManagerService);
  private readonly store = inject(ManagerGymStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  /** Paramètre :id (absent pour /nouvelle). */
  readonly id = input<string | undefined>(undefined);

  readonly dayLabels = DAY_LABELS;
  readonly gym = signal<GymDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly hoursBusy = signal(false);
  readonly hoursError = signal<string | null>(null);
  readonly hoursVersion = signal(0);

  readonly isNew = computed(() => !this.id());
  readonly numericId = computed(() => Number(this.id() ?? 0));

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    address: ['', Validators.required],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    city: ['', Validators.required],
    phone: [''],
    imageUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    totalCapacity: [50, [Validators.required, Validators.min(1)]],
    latitude: [null as number | null],
    longitude: [null as number | null],
  });

  readonly hoursForm = this.fb.group({
    days: this.fb.array<HourGroup>(DAY_LABELS.map(() => this.createHourGroup())),
  });

  get days(): FormArray<HourGroup> {
    return this.hoursForm.controls.days;
  }

  readonly hoursInvalid = computed(() => {
    this.hoursVersion();
    return this.days.controls.some((g) => {
      const v = g.getRawValue();
      return !v.closed && (!v.opensAt || !v.closesAt || v.opensAt >= v.closesAt);
    });
  });

  ngOnInit(): void {
    this.hoursForm.valueChanges.subscribe(() => this.hoursVersion.update((v) => v + 1));
    if (this.isNew()) {
      this.loading.set(false);
      return;
    }
    const load = () => {
      const gym = this.store.byId(this.numericId());
      if (!gym) {
        this.loadError.set('Salle introuvable ou non gérée par votre compte.');
      } else {
        this.gym.set(gym);
        this.fill(gym);
      }
      this.loading.set(false);
    };
    if (this.store.loaded()) {
      load();
    } else {
      this.store.load().subscribe({
        next: load,
        error: (err: unknown) => {
          this.loadError.set(errorMessage(err));
          this.loading.set(false);
        },
      });
    }
  }

  invalid(name: 'name' | 'address' | 'postalCode' | 'city' | 'totalCapacity' | 'imageUrl'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      name: v.name.trim(),
      description: v.description.trim(),
      address: v.address.trim(),
      city: v.city.trim(),
      postalCode: v.postalCode.trim(),
      phone: v.phone.trim(),
      imageUrl: v.imageUrl.trim() || null,
      totalCapacity: Number(v.totalCapacity),
      latitude: v.latitude === null || v.latitude === undefined ? null : Number(v.latitude),
      longitude: v.longitude === null || v.longitude === undefined ? null : Number(v.longitude),
    };
    this.busy.set(true);
    this.error.set(null);
    const request = this.isNew()
      ? this.manager.createGym(payload)
      : this.manager.updateGym(this.numericId(), payload);
    request.subscribe({
      next: (gym) => {
        this.busy.set(false);
        this.store.upsert(gym);
        this.toast.success(this.isNew() ? 'Salle créée.' : 'Salle enregistrée.');
        if (this.isNew()) {
          this.router.navigate(['/gestionnaire/salles', gym.id]);
        } else {
          this.gym.set(gym);
        }
      },
      error: (err: unknown) => {
        this.busy.set(false);
        const details = isApiError(err) && err.errors ? ' ' + Object.values(err.errors).join(' ') : '';
        this.error.set(errorMessage(err) + details);
      },
    });
  }

  saveHours(): void {
    if (this.hoursInvalid()) {
      return;
    }
    const payload: OpeningHour[] = this.days.controls
      .map((g, i) => ({ dayOfWeek: i + 1, ...g.getRawValue() }))
      .filter((d) => !d.closed)
      .map(({ dayOfWeek, opensAt, closesAt }) => ({ dayOfWeek, opensAt, closesAt }));
    this.hoursBusy.set(true);
    this.hoursError.set(null);
    this.manager.saveOpeningHours(this.numericId(), payload).subscribe({
      next: (hours) => {
        this.hoursBusy.set(false);
        const gym = this.gym();
        if (gym) {
          const updated = { ...gym, openingHours: hours };
          this.gym.set(updated);
          this.store.upsert(updated);
        }
        this.toast.success('Horaires enregistrés.');
      },
      error: (err: unknown) => {
        this.hoursBusy.set(false);
        this.hoursError.set(errorMessage(err));
      },
    });
  }

  private fill(gym: GymDetail): void {
    this.form.patchValue({
      name: gym.name,
      description: gym.description ?? '',
      address: gym.address,
      postalCode: gym.postalCode,
      city: gym.city,
      phone: gym.phone ?? '',
      imageUrl: gym.imageUrl ?? '',
      totalCapacity: gym.totalCapacity,
      latitude: gym.latitude,
      longitude: gym.longitude,
    });
    this.days.controls.forEach((group, i) => {
      const hour = gym.openingHours.find((h) => h.dayOfWeek === i + 1);
      group.patchValue(
        hour ? { closed: false, opensAt: hour.opensAt, closesAt: hour.closesAt } : { closed: true, opensAt: '08:00', closesAt: '20:00' },
      );
    });
  }

  private createHourGroup(): HourGroup {
    return this.fb.nonNullable.group({
      closed: [true],
      opensAt: ['08:00'],
      closesAt: ['20:00'],
    });
  }
}
