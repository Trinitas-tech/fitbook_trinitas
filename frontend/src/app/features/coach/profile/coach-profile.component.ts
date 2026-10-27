import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CoachProfile, errorMessage, isApiError } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { CoachService } from '../../../core/services/coach.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-coach-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, LoaderComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Profil professionnel</h1>
      @if (profile()?.isValidated) {
        <a [routerLink]="['/coachs', profile()!.id]" class="btn btn-outline btn-sm">Voir ma fiche publique</a>
      }
    </div>

    @if (loading()) {
      <app-loader />
    } @else {
      <app-alert type="error" [message]="error()" />
      <form class="card" style="max-width: 760px" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <p class="muted">Ces informations sont affichées sur votre fiche publique. Un profil complet est requis pour être visible dans la recherche.</p>
        <div class="form-row">
          <div class="field">
            <label class="label" for="specialty">Spécialité</label>
            <input id="specialty" class="input" formControlName="specialty" placeholder="ex. Préparation physique" />
            @if (invalid('specialty')) {
              <span class="field-error">La spécialité est obligatoire.</span>
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
            <label class="label" for="hourlyRate">Tarif horaire (€)</label>
            <input id="hourlyRate" type="number" min="0" step="0.5" class="input" formControlName="hourlyRate" />
            @if (invalid('hourlyRate')) {
              <span class="field-error">Saisissez un tarif positif.</span>
            }
          </div>
          <div class="field">
            <label class="label" for="avatarUrl">Photo (URL)</label>
            <input id="avatarUrl" type="url" class="input" formControlName="avatarUrl" placeholder="https://…" />
            @if (invalid('avatarUrl')) {
              <span class="field-error">URL invalide.</span>
            }
          </div>
        </div>
        <div class="field">
          <label class="label" for="bio">Présentation</label>
          <textarea id="bio" class="input" formControlName="bio" rows="6" placeholder="Parcours, diplômes, approche…"></textarea>
          @if (invalid('bio')) {
            <span class="field-error">La présentation doit contenir entre 20 et 2000 caractères.</span>
          }
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="busy()">{{ busy() ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    }
  `,
})
export class CoachProfileComponent implements OnInit {
  private readonly coach = inject(CoachService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly profile = signal<CoachProfile | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    specialty: ['', [Validators.required, Validators.maxLength(100)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    hourlyRate: [0, [Validators.required, Validators.min(0)]],
    avatarUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    bio: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    this.coach.profile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.form.patchValue({
          specialty: p.specialty ?? '',
          city: p.city ?? '',
          hourlyRate: p.hourlyRate ?? 0,
          avatarUrl: p.avatarUrl ?? '',
          bio: p.bio ?? '',
        });
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  invalid(name: 'specialty' | 'city' | 'hourlyRate' | 'avatarUrl' | 'bio'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.error.set(null);
    this.coach
      .updateProfile({
        specialty: v.specialty.trim(),
        city: v.city.trim(),
        hourlyRate: Number(v.hourlyRate),
        avatarUrl: v.avatarUrl.trim() || null,
        bio: v.bio.trim(),
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.toast.success('Profil professionnel enregistré.');
          this.auth.refreshMe().subscribe({ error: () => undefined });
        },
        error: (err: unknown) => {
          this.busy.set(false);
          const details = isApiError(err) && err.errors ? ' ' + Object.values(err.errors).join(' ') : '';
          this.error.set(errorMessage(err) + details);
        },
      });
  }
}
