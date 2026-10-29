import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <header class="header">
      <div class="container inner">
        <a routerLink="/" class="logo" aria-label="FitBook – accueil">
          <span class="logo-mark" aria-hidden="true"><app-icon name="flame" size="18" /></span>
          <span>FitBook</span>
        </a>

        <nav class="links hide-mobile" aria-label="Navigation principale">
          <a routerLink="/recherche" routerLinkActive="active">Recherche</a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/mes-reservations" routerLinkActive="active">Mes réservations</a>
            <a routerLink="/mes-favoris" routerLinkActive="active">Favoris</a>
          }
        </nav>

        <div class="right">
          @if (auth.currentUser(); as user) {
            <div class="menu-wrap">
              <button
                type="button"
                class="user-btn"
                (click)="toggle()"
                [attr.aria-expanded]="open()"
                aria-haspopup="menu"
                aria-label="Menu du compte"
              >
                @if (user.avatarUrl) {
                  <img class="avatar" [src]="user.avatarUrl" [alt]="user.firstName" />
                } @else {
                  <span class="avatar">{{ auth.initials() }}</span>
                }
                <span class="hide-mobile name">{{ user.firstName }}</span>
                <span class="hide-mobile caret"><app-icon name="chevron-down" size="16" /></span>
              </button>
              @if (open()) {
                <div class="menu" role="menu">
                  <div class="menu-head">
                    <strong>{{ user.firstName }} {{ user.lastName }}</strong>
                    <span class="muted small">{{ user.email }}</span>
                  </div>
                  @if (auth.isAdmin()) {
                    <a routerLink="/admin" role="menuitem" (click)="close()">Administration</a>
                  }
                  @if (auth.isManager()) {
                    <a routerLink="/gestionnaire" role="menuitem" (click)="close()"
                      >Espace gestionnaire</a
                    >
                  }
                  @if (auth.isCoach()) {
                    <a routerLink="/coach" role="menuitem" (click)="close()">Espace coach</a>
                  }
                  <a routerLink="/mes-reservations" role="menuitem" (click)="close()"
                    >Mes réservations</a
                  >
                  <a routerLink="/mes-favoris" role="menuitem" (click)="close()">Mes favoris</a>
                  <a routerLink="/profil" role="menuitem" (click)="close()">Mon profil</a>
                  <button type="button" role="menuitem" class="logout" (click)="logout()">
                    Déconnexion
                  </button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/connexion" class="btn btn-ghost btn-sm">Connexion</a>
            <a routerLink="/inscription" class="btn btn-primary btn-sm">Inscription</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: `
    .header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--glass-bg-strong);
      -webkit-backdrop-filter: blur(var(--glass-blur));
      backdrop-filter: blur(var(--glass-blur));
      border-bottom: 1px solid var(--glass-border);
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      height: var(--header-height);
    }
    .inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      gap: 16px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 1.3rem;
      color: var(--color-text);
      letter-spacing: -0.01em;
    }
    .logo:hover {
      text-decoration: none;
    }
    .logo-mark {
      width: 34px;
      height: 34px;
      border-radius: 11px;
      background: var(--grad-fire);
      color: #0f172a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--glow-fire);
    }
    .links {
      display: flex;
      gap: 24px;
      flex: 1;
      margin-left: 24px;
    }
    .links a {
      color: var(--color-text-muted);
      font-weight: 600;
      padding: 6px 0;
      border-bottom: 2px solid transparent;
      transition:
        color var(--dur-fast),
        border-color var(--dur-fast);
    }
    .links a:hover,
    .links a.active {
      color: var(--color-link);
      text-decoration: none;
    }
    .links a.active {
      border-image: var(--grad-water) 1;
      border-bottom: 2px solid;
    }
    .right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .menu-wrap {
      position: relative;
    }
    .user-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: 1px solid transparent;
      padding: 4px;
      min-height: 44px;
      border-radius: var(--radius-pill);
      font-weight: 600;
      transition: box-shadow var(--dur-fast);
    }
    .user-btn:hover,
    .user-btn[aria-expanded='true'] {
      box-shadow: var(--neu-raised-sm);
      border-color: rgba(255, 255, 255, 0.5);
    }
    .caret {
      color: var(--color-text-muted);
      display: inline-flex;
    }
    .menu {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      background: var(--glass-bg-strong);
      -webkit-backdrop-filter: blur(var(--glass-blur));
      backdrop-filter: blur(var(--glass-blur));
      border-radius: var(--radius);
      box-shadow: var(--glass-shadow-hover);
      border: 1px solid var(--glass-border);
      min-width: 240px;
      display: flex;
      flex-direction: column;
      padding: 6px;
      animation: menu-in var(--dur-base) var(--ease-out);
    }
    @keyframes menu-in {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    .menu-head {
      display: flex;
      flex-direction: column;
      padding: 10px 12px;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 6px;
    }
    .menu a,
    .menu .logout {
      padding: 10px 12px;
      min-height: 44px;
      display: flex;
      align-items: center;
      border-radius: 10px;
      color: var(--color-text);
      text-align: left;
      background: none;
      border: none;
      font-weight: 500;
      transition: background var(--dur-fast);
    }
    .menu a:hover,
    .menu .logout:hover {
      background: var(--color-info-light);
      color: var(--color-link);
      text-decoration: none;
    }
    .menu .logout {
      color: var(--color-danger);
      border-top: 1px solid var(--color-border);
      margin-top: 6px;
      border-radius: 0 0 10px 10px;
    }
    .menu .logout:hover {
      background: var(--color-danger-light);
      color: var(--color-danger);
    }
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  logout(): void {
    this.close();
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
