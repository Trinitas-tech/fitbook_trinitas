import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegisterRole, errorMessage, isApiError } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { AuthLayoutComponent } from '../auth-layout.component';

interface RoleOption {
  value: RegisterRole;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, AuthLayoutComponent],
  template: `
    @if (done()) {
      <app-auth-layout title="Vérifiez votre e-mail" [subtitle]="null">
        <div class="text-center">
          <div style="font-size: 3rem">📬</div>
          <p>
            Votre compte a été créé. Nous avons envoyé un lien de confirmation à
            <strong>{{ form.controls.email.value }}</strong>. Cliquez dessus pour activer votre compte
            (le lien expire dans 24 heures).
          </p>
          <a routerLink="/connexion" class="btn btn-primary">Aller à la connexion</a>
        </div>
      </app-auth-layout>
    } @else {
      <app-auth-layout title="Créer un compte" subtitle="Rejoignez FitBook en quelques secondes." [wide]="true">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <app-alert type="error" [message]="error()" />

          <span class="label">Je suis…</span>
          <div class="roles">
            @for (r of roles; track r.value) {
              <button
                type="button"
                class="role"
                [class.selected]="form.controls.role.value === r.value"
                (click)="form.controls.role.setValue(r.value)"
              >
                <span class="role-icon" aria-hidden="true">{{ r.icon }}</span>
                <strong>{{ r.label }}</strong>
                <span class="muted small">{{ r.description }}</span>
              </button>
            }
          </div>

          <div class="form-row">
            <div class="field">
              <label class="label" for="firstName">Prénom</label>
              <input id="firstName" class="input" formControlName="firstName" autocomplete="given-name" />
              @if (showError('firstName')) {
                <span class="field-error">Le prénom est obligatoire.</span>
              }
            </div>
            <div class="field">
              <label class="label" for="lastName">Nom</label>
              <input id="lastName" class="input" formControlName="lastName" autocomplete="family-name" />
              @if (showError('lastName')) {
                <span class="field-error">Le nom est obligatoire.</span>
              }
            </div>
          </div>
          <div class="field">
            <label class="label" for="email">Adresse e-mail</label>
            <input id="email" type="email" class="input" formControlName="email" autocomplete="email" />
            @if (showError('email')) {
              <span class="field-error">Saisissez une adresse e-mail valide.</span>
            }
            @if (fieldErrors()['email']; as e) {
              <span class="field-error">{{ e }}</span>
            }
          </div>
          <div class="field">
            <label class="label" for="password">Mot de passe</label>
            <input id="password" type="password" class="input" formControlName="password" autocomplete="new-password" />
            <span class="hint">8 caractères minimum.</span>
            @if (showError('password')) {
              <span class="field-error">Le mot de passe doit contenir au moins 8 caractères.</span>
            }
          </div>
          <div class="field">
            <label class="label" for="confirm">Confirmer le mot de passe</label>
            <input id="confirm" type="password" class="input" formControlName="confirm" autocomplete="new-password" />
            @if (form.controls.confirm.touched && form.hasError('mismatch')) {
              <span class="field-error">Les mots de passe ne correspondent pas.</span>
            }
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="busy()">
            {{ busy() ? 'Création du compte…' : 'Créer mon compte' }}
          </button>
          <p class="text-center muted mt-16" style="margin-bottom: 0">
            Déjà inscrit ? <a routerLink="/connexion">Se connecter</a>
          </p>
        </form>
      </app-auth-layout>
    }
  `,
  styles: `
    .roles {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 8px 0 20px;
    }
    .role {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-align: center;
      padding: 16px 10px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius);
      background: #fff;
      transition: all 0.15s;
    }
    .role:hover {
      border-color: #fdba74;
    }
    .role.selected {
      border-color: var(--color-primary);
      background: #fff7ed;
    }
    .role-icon {
      font-size: 1.8rem;
    }
    @media (max-width: 768px) {
      .roles {
        grid-template-columns: 1fr;
      }
      .role {
        flex-direction: row;
        text-align: left;
        gap: 12px;
      }
      .role strong {
        flex: 1;
      }
    }
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly roles: RoleOption[] = [
    { value: 'user', label: 'Sportif', icon: '🏃', description: 'Je réserve des séances' },
    { value: 'coach', label: 'Coach', icon: '🎯', description: 'Je propose mes séances' },
    { value: 'manager', label: 'Gestionnaire', icon: '🏢', description: 'Je gère une salle' },
  ];

  readonly form = this.fb.nonNullable.group(
    {
      role: ['user' as RegisterRole, Validators.required],
      firstName: ['', [Validators.required, Validators.maxLength(80)]],
      lastName: ['', [Validators.required, Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    {
      validators: (group) =>
        group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true },
    },
  );

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly done = signal(false);

  showError(name: 'firstName' | 'lastName' | 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const { role, firstName, lastName, email, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set(null);
    this.fieldErrors.set({});
    this.auth.register({ role, firstName, lastName, email, password }).subscribe({
      next: () => {
        this.busy.set(false);
        this.done.set(true);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
        if (isApiError(err) && err.errors) {
          this.fieldErrors.set(err.errors);
        }
      },
    });
  }
}
