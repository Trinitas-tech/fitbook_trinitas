import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Carte centrée pour les écrans d'authentification. */
@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth container">
      <div class="card auth-card" [class.wide]="wide()">
        <h1 class="auth-title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="muted">{{ subtitle() }}</p>
        }
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .auth {
      display: flex;
      justify-content: center;
      padding: 40px 16px 56px;
    }
    .auth-card {
      width: 100%;
      max-width: 460px;
      padding: 32px;
    }
    .auth-card.wide {
      max-width: 720px;
    }
    .auth-title {
      font-size: 1.6rem;
      margin-bottom: 6px;
    }
    @media (max-width: 768px) {
      .auth {
        padding: 20px 16px 40px;
      }
      .auth-card {
        padding: 22px 18px;
      }
    }
  `,
})
export class AuthLayoutComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly wide = input(false);
}
