import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-bottom-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="tabs-bar" aria-label="Navigation mobile">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        <span class="ico">🏠</span><span>Accueil</span>
      </a>
      <a routerLink="/recherche" routerLinkActive="active">
        <span class="ico">🔍</span><span>Recherche</span>
      </a>
      <a routerLink="/mes-reservations" routerLinkActive="active">
        <span class="ico">📅</span><span>Réservations</span>
      </a>
      <a routerLink="/mes-favoris" routerLinkActive="active">
        <span class="ico">♥</span><span>Favoris</span>
      </a>
      <a [routerLink]="profileLink()" routerLinkActive="active">
        <span class="ico">👤</span><span>Profil</span>
      </a>
    </nav>
  `,
  styles: `
    .tabs-bar {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--bottom-tabs-height);
      background: #fff;
      border-top: 1px solid var(--color-border);
      z-index: 60;
      padding-bottom: env(safe-area-inset-bottom);
    }
    .tabs-bar a {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }
    .tabs-bar a:hover {
      text-decoration: none;
    }
    .tabs-bar a.active {
      color: var(--color-primary);
    }
    .ico {
      font-size: 1.25rem;
      line-height: 1;
    }
    @media (max-width: 768px) {
      .tabs-bar {
        display: flex;
      }
    }
  `,
})
export class BottomTabsComponent {
  private readonly auth = inject(AuthService);
  readonly profileLink = computed(() => (this.auth.isLoggedIn() ? '/profil' : '/connexion'));
}
