import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Session, errorMessage, isApiError } from '../../../core/models';
import { CoachService } from '../../../core/services/coach.service';
import { ToastService } from '../../../core/services/toast.service';
import { durationMinutes, fromDateTimeLocal, toDateTimeLocal } from '../../../core/utils/date.utils';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

/** Création (page /coach/seances/nouvelle) ou modification (intégré dans le détail) d'une séance. */
@Component({
  selector: 'app-coach-session-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent],
  template: `
    @if (!session()) {
      <div class="page-header">
        <h1 class="page-title">Nouvelle séance</h1>
        <a routerLink="/coach/seances" class="btn btn-ghost btn-sm">← Retour</a>
      </div>
    }
    <form class="card" style="max-width: 640px" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      @if (session()) {
        <h3>Modifier la séance</h3>
      }
      <app-alert type="error" [message]="error()" />
      <div class="form-row">
        <div class="field">
          <label class="label" for="startAt">Date et heure de début</label>
          <input id="startAt" type="datetime-local" class="input" formControlName="startAt" />
          @if (invalid('startAt')) {
            <span class="field-error">La date de début est obligatoire.</span>
          }
        </div>
        <div class="field">
          <label class="label" for="durationMinutes">Durée (minutes)</label>
          <input id="durationMinutes" type="number" min="15" step="15" class="input" formControlName="durationMinutes" />
          @if (invalid('durationMinutes')) {
            <span class="field-error">Durée minimale : 15 minutes.</span>
          }
        </div>
      </div>
      <div class="field">
        <label class="label" for="location">Lieu</label>
        <input id="location" class="input" formControlName="location" placeholder="ex. Parc de la Tête d'Or, Lyon" />
        @if (invalid('location')) {
          <span class="field-error">Le lieu est obligatoire.</span>
        }
      </div>
      <div class="form-row">
        <div class="field">
          <label class="label" for="capacity">Capacité (places)</label>
          <input id="capacity" type="number" min="1" class="input" formControlName="capacity" />
          @if (invalid('capacity')) {
            <span class="field-error">Au moins 1 place.</span>
          }
        </div>
        <div class="field">
          <label class="label" for="price">Prix (€)</label>
          <input id="price" type="number" min="0" step="0.5" class="input" formControlName="price" />
          @if (invalid('price')) {
            <span class="field-error">Saisissez un prix positif.</span>
          }
        </div>
      </div>
      <p class="hint">La séance doit être comprise dans vos disponibilités hebdomadaires.</p>
      <div class="form-actions">
        @if (session()) {
          <button type="button" class="btn btn-outline" (click)="cancelled.emit()" [disabled]="busy()">Annuler</button>
        }
        <button type="submit" class="btn btn-primary" [disabled]="busy()">
          {{ busy() ? 'Enregistrement…' : session() ? 'Enregistrer' : 'Créer la séance' }}
        </button>
      </div>
    </form>
  `,
})
export class CoachSessionFormComponent implements OnInit {
  private readonly coach = inject(CoachService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  /** Séance à modifier (null = création). */
  readonly session = input<Session | null>(null);
  readonly saved = output<Session>();
  readonly cancelled = output<void>();

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    startAt: ['', Validators.required],
    durationMinutes: [60, [Validators.required, Validators.min(15)]],
    location: ['', [Validators.required, Validators.maxLength(200)]],
    capacity: [5, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    const s = this.session();
    if (s) {
      this.form.patchValue({
        startAt: toDateTimeLocal(s.startAt),
        durationMinutes: durationMinutes(s.startAt, s.endAt),
        location: s.location ?? '',
        capacity: s.capacity,
        price: s.price,
      });
    }
  }

  invalid(name: 'startAt' | 'durationMinutes' | 'location' | 'capacity' | 'price'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      startAt: fromDateTimeLocal(v.startAt),
      durationMinutes: Number(v.durationMinutes),
      location: v.location.trim(),
      capacity: Number(v.capacity),
      price: Number(v.price),
    };
    this.busy.set(true);
    this.error.set(null);
    const existing = this.session();
    const request = existing ? this.coach.updateSession(existing.id, payload) : this.coach.createSession(payload);
    request.subscribe({
      next: (session) => {
        this.busy.set(false);
        this.toast.success(existing ? 'Séance modifiée.' : 'Séance créée.');
        this.saved.emit(session);
        if (!existing) {
          this.router.navigate(['/coach/seances', session.id]);
        }
      },
      error: (err: unknown) => {
        this.busy.set(false);
        const details = isApiError(err) && err.errors ? ' ' + Object.values(err.errors).join(' ') : '';
        this.error.set(errorMessage(err) + details);
      },
    });
  }
}
