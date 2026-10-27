import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { AuthLayoutComponent } from '../auth-layout.component';

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, AuthLayoutComponent],
  template: `
    <app-auth-layout title="Nouveau mot de passe">
      @if (!token()) {
        <app-alert type="error" message="Lien invalide : aucun jeton de réinitialisation fourni." />
        <a routerLink="/mot-de-passe-oublie" class="btn btn-outline btn-block">Demander un nouveau lien</a>
      } @else if (done()) {
        <app-alert type="success" message="Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter." />
        <a routerLink="/connexion" class="btn btn-primary btn-block">Se connecter</a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <app-alert type="error" [message]="error()" />
          <div class="field">
            <label class="label" for="password">Nouveau mot de passe</label>
            <input id="password" type="password" class="input" formControlName="password" autocomplete="new-password" />
            @if (form.controls.password.touched && form.controls.password.invalid) {
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
          <button type="submit" class="btn btn-primary btn-block" [disabled]="busy()">
            {{ busy() ? 'Enregistrement…' : 'Réinitialiser le mot de passe' }}
          </button>
        </form>
      }
    </app-auth-layout>
  `,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly token = input<string | undefined>(undefined);

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    {
      validators: (group) =>
        group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true },
    },
  );
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.form.markAllAsTouched();
    const token = this.token();
    if (this.form.invalid || !token) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.auth.resetPassword(token, this.form.controls.password.value).subscribe({
      next: () => {
        this.busy.set(false);
        this.done.set(true);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(errorMessage(err, 'Le lien est invalide ou expiré.'));
      },
    });
  }
}
