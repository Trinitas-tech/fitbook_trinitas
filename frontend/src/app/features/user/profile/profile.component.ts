import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ROLE_LABELS, errorMessage, isApiError } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AlertComponent],
  template: `
    <div class="container page">
      <div class="page-header">
        <h1 class="page-title">Mon profil</h1>
      </div>

      @if (auth.currentUser(); as user) {
        <div class="two-col">
          <div>
            <form class="card" [formGroup]="form" (ngSubmit)="save()" novalidate>
              <h2>Informations personnelles</h2>
              <app-alert type="error" [message]="error()" />
              <div class="form-row">
                <div class="field">
                  <label class="label" for="firstName">Prénom</label>
                  <input id="firstName" class="input" formControlName="firstName" />
                  @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
                    <span class="field-error">Le prénom est obligatoire.</span>
                  }
                </div>
                <div class="field">
                  <label class="label" for="lastName">Nom</label>
                  <input id="lastName" class="input" formControlName="lastName" />
                  @if (form.controls.lastName.touched && form.controls.lastName.invalid) {
                    <span class="field-error">Le nom est obligatoire.</span>
                  }
                </div>
              </div>
              <div class="field">
                <label class="label" for="email">Adresse e-mail</label>
                <input id="email" class="input" [value]="user.email" disabled />
                <span class="hint">L'adresse e-mail ne peut pas être modifiée.</span>
              </div>
              <div class="field">
                <label class="label" for="phone">Téléphone</label>
                <input id="phone" type="tel" class="input" formControlName="phone" placeholder="06 12 34 56 78" />
                @if (form.controls.phone.touched && form.controls.phone.invalid) {
                  <span class="field-error">Numéro de téléphone invalide.</span>
                }
              </div>
              <div class="field">
                <label class="label" for="avatarUrl">URL de l'avatar</label>
                <input id="avatarUrl" type="url" class="input" formControlName="avatarUrl" placeholder="https://…" />
                @if (form.controls.avatarUrl.touched && form.controls.avatarUrl.invalid) {
                  <span class="field-error">Saisissez une URL valide (https://…).</span>
                }
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" [disabled]="busy()">{{ busy() ? 'Enregistrement…' : 'Enregistrer' }}</button>
              </div>
            </form>

            <form class="card mt-24" [formGroup]="passwordForm" (ngSubmit)="changePassword()" novalidate>
              <h2>Changer de mot de passe</h2>
              <app-alert type="error" [message]="passwordError()" />
              <div class="field">
                <label class="label" for="currentPassword">Mot de passe actuel</label>
                <input id="currentPassword" type="password" class="input" formControlName="currentPassword" autocomplete="current-password" />
              </div>
              <div class="form-row">
                <div class="field">
                  <label class="label" for="newPassword">Nouveau mot de passe</label>
                  <input id="newPassword" type="password" class="input" formControlName="newPassword" autocomplete="new-password" />
                  @if (passwordForm.controls.newPassword.touched && passwordForm.controls.newPassword.invalid) {
                    <span class="field-error">8 caractères minimum.</span>
                  }
                </div>
                <div class="field">
                  <label class="label" for="confirm">Confirmation</label>
                  <input id="confirm" type="password" class="input" formControlName="confirm" autocomplete="new-password" />
                  @if (passwordForm.controls.confirm.touched && passwordForm.hasError('mismatch')) {
                    <span class="field-error">Les mots de passe ne correspondent pas.</span>
                  }
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-outline" [disabled]="passwordBusy()">{{ passwordBusy() ? 'Enregistrement…' : 'Modifier le mot de passe' }}</button>
              </div>
            </form>
          </div>

          <aside class="card side">
            @if (user.avatarUrl) {
              <img class="avatar avatar-lg" [src]="user.avatarUrl" [alt]="user.firstName" />
            } @else {
              <span class="avatar avatar-lg">{{ auth.initials() }}</span>
            }
            <h3 style="margin: 12px 0 2px">{{ user.firstName }} {{ user.lastName }}</h3>
            <p class="muted small" style="margin: 0">{{ user.email }}</p>
            <div class="flex flex-wrap mt-16" style="justify-content: center">
              @for (r of user.roles; track r) {
                <span class="badge badge-primary">{{ roleLabel(r) }}</span>
              }
            </div>
            <p class="muted small mt-16" style="margin-bottom: 0">
              Compte {{ user.isVerified ? 'vérifié ✓' : 'non vérifié' }}
            </p>
            <button type="button" class="btn btn-ghost btn-sm mt-16" (click)="auth.logout()">Déconnexion</button>
          </aside>
        </div>
      }
    </div>
  `,
  styles: `
    .side {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  `,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  private readonly user = this.auth.currentUser();

  readonly form = this.fb.nonNullable.group({
    firstName: [this.user?.firstName ?? '', Validators.required],
    lastName: [this.user?.lastName ?? '', Validators.required],
    phone: [this.user?.phone ?? '', Validators.pattern(/^[+0-9 .()-]{6,20}$/)],
    avatarUrl: [this.user?.avatarUrl ?? '', Validators.pattern(/^https?:\/\/.+/)],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    {
      validators: (group) =>
        group.get('newPassword')?.value === group.get('confirm')?.value ? null : { mismatch: true },
    },
  );

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordBusy = signal(false);
  readonly passwordError = signal<string | null>(null);

  roleLabel(role: string): string {
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.error.set(null);
    this.auth
      .updateProfile({
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        phone: v.phone.trim() || null,
        avatarUrl: v.avatarUrl.trim() || null,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.toast.success('Profil mis à jour.');
        },
        error: (err: unknown) => {
          this.busy.set(false);
          this.error.set(this.describe(err));
        },
      });
  }

  changePassword(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) {
      return;
    }
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.passwordBusy.set(true);
    this.passwordError.set(null);
    this.auth
      .updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        currentPassword,
        newPassword,
      })
      .subscribe({
        next: () => {
          this.passwordBusy.set(false);
          this.passwordForm.reset();
          this.toast.success('Mot de passe modifié.');
        },
        error: (err: unknown) => {
          this.passwordBusy.set(false);
          this.passwordError.set(this.describe(err));
        },
      });
  }

  private describe(err: unknown): string {
    if (isApiError(err) && err.errors) {
      return `${err.message} ${Object.values(err.errors).join(' ')}`.trim();
    }
    return errorMessage(err);
  }
}
