import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AuthLayoutComponent } from '../auth-layout.component';

@Component({
  selector: 'app-verify-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AlertComponent, LoaderComponent, AuthLayoutComponent],
  template: `
    <app-auth-layout title="Vérification de votre e-mail">
      @if (loading()) {
        <app-loader label="Vérification en cours…" />
      } @else if (success()) {
        <app-alert type="success" [message]="success()" />
        <p>Votre compte est maintenant actif.</p>
        <a routerLink="/connexion" class="btn btn-primary btn-block">Se connecter</a>
      } @else {
        <app-alert type="error" [message]="error()" />
        <p class="muted">Le lien est peut-être expiré (validité 24 h). Vous pouvez vous réinscrire pour recevoir un nouveau lien.</p>
        <div class="flex">
          <a routerLink="/inscription" class="btn btn-outline">S'inscrire</a>
          <a routerLink="/connexion" class="btn btn-primary">Connexion</a>
        </div>
      }
    </app-auth-layout>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly auth = inject(AuthService);

  readonly token = input<string | undefined>(undefined);
  readonly loading = signal(true);
  readonly success = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.token();
    if (!token) {
      this.loading.set(false);
      this.error.set('Lien de vérification invalide : aucun jeton fourni.');
      return;
    }
    this.auth.verifyEmail(token).subscribe({
      next: (res) => {
        this.success.set(res.message || 'Votre adresse e-mail a bien été vérifiée.');
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Le lien de vérification est invalide ou expiré.'));
        this.loading.set(false);
      },
    });
  }
}
