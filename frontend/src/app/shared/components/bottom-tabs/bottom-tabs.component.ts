import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-bottom-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <nav class="tabs-bar" aria-label="Navigation mobile">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        <span class="ico"><app-icon name="home" size="22" /></span><span>Accueil</span>
      </a>
      <a routerLink="/recherche" routerLinkActive="active">
        <span class="ico"><app-icon name="search" size="22" /></span><span>Recherche</span>
      </a>
      <a routerLink="/mes-reservations" routerLinkActive="active">
        <span class="ico"><app-icon name="calendar" size="22" /></span><span>Réservations</span>
      </a>
      <a routerLink="/mes-favoris" routerLinkActive="active">
        <span class="ico"><app-icon name="heart" size="22" /></span><span>Favoris</span>
      </a>
      <a [routerLink]="profileLink()" routerLinkActive="active">
        <span class="ico"><app-icon name="user" size="22" /></span><span>Profil</span>
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
      height: calc(var(--bottom-tabs-height) + env(safe-area-inset-bottom));
      background: var(--glass-bg-strong);
      -webkit-backdrop-filter: blur(var(--glass-blur));
      backdrop-filter: blur(var(--glass-blur));
      border-top: 1px solid var(--glass-border);
      box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.08);
      z-index: 60;
      padding-bottom: env(safe-area-inset-bottom);
    }
    .tabs-bar a {
      flex: 1;
      min-width: 44px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--color-text-muted);
      transition: color var(--dur-fast);
    }
    .tabs-bar a:hover {
      text-decoration: none;
      color: var(--color-text);
    }
    .tabs-bar a.active {
      color: var(--color-link);
    }
    .ico {
      position: relative;
      width: 44px;
      height: 28px;
      border-radius: var(--radius-pill);
      transition: background var(--dur-base) var(--ease-out);
    }
    .tabs-bar a.active .ico::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -3px;
      width: 18px;
      height: 3px;
      border-radius: 2px;
      transform: translateX(-50%);
      background: var(--grad-water);
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
