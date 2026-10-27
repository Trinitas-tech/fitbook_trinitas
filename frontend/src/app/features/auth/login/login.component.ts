import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage, isApiError } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { AuthLayoutComponent } from '../auth-layout.component';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, AuthLayoutComponent],
  template: `
    <app-auth-layout title="Connexion" subtitle="Heureux de vous revoir !">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-alert type="error" [message]="error()" />
        @if (redirect()) {
          <app-alert type="info" message="Connectez-vous pour continuer." />
        }
        <div class="field">
          <label class="label" for="email">Adresse e-mail</label>
          <input id="email" type="email" class="input" formControlName="email" autocomplete="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="field-error">Saisissez une adresse e-mail valide.</span>
          }
        </div>
        <div class="field">
          <div class="flex between">
            <label class="label" for="password">Mot de passe</label>
            <a routerLink="/mot-de-passe-oublie" class="small">Mot de passe oublié ?</a>
          </div>
          <input id="password" type="password" class="input" formControlName="password" autocomplete="current-password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field-error">Le mot de passe est obligatoire.</span>
          }
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="busy()">
          {{ busy() ? 'Connexion…' : 'Se connecter' }}
        </button>
        <p class="text-center muted mt-16" style="margin-bottom: 0">
          Pas encore de compte ? <a routerLink="/inscription">Créer un compte</a>
        </p>
      </form>
    </app-auth-layout>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  /** Query param ?redirect= */
  readonly redirect = input<string | undefined>(undefined);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.busy.set(false);
        const redirect = this.redirect();
        if (redirect && redirect.startsWith('/') && !redirect.startsWith('/connexion')) {
          this.router.navigateByUrl(redirect);
        } else {
          this.router.navigateByUrl(this.auth.homeFor(user));
        }
      },
      error: (err: unknown) => {
        this.busy.set(false);
        if (isApiError(err) && err.status === 401) {
          this.error.set('Identifiants incorrects.');
        } else {
          this.error.set(errorMessage(err));
        }
      },
    });
  }
}
