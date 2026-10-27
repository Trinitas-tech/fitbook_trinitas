import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { AuthLayoutComponent } from '../auth-layout.component';

@Component({
  selector: 'app-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, AuthLayoutComponent],
  template: `
    <app-auth-layout title="Mot de passe oublié" subtitle="Nous vous enverrons un lien de réinitialisation valable 1 heure.">
      @if (sent()) {
        <app-alert type="success" message="Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d'être envoyé." />
        <a routerLink="/connexion" class="btn btn-outline btn-block">Retour à la connexion</a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <app-alert type="error" [message]="error()" />
          <div class="field">
            <label class="label" for="email">Adresse e-mail</label>
            <input id="email" type="email" class="input" formControlName="email" autocomplete="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <span class="field-error">Saisissez une adresse e-mail valide.</span>
            }
          </div>
          <button type="submit" class="btn btn-primary btn-block" [disabled]="busy()">
            {{ busy() ? 'Envoi…' : 'Envoyer le lien' }}
          </button>
          <p class="text-center mt-16" style="margin-bottom: 0"><a routerLink="/connexion">Retour à la connexion</a></p>
        </form>
      }
    </app-auth-layout>
  `,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  readonly busy = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.auth.forgotPassword(this.form.controls.email.value).subscribe({
      next: () => {
        this.busy.set(false);
        this.sent.set(true);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
