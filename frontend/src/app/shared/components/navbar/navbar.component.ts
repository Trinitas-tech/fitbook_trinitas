import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="container inner">
        <a routerLink="/" class="logo" aria-label="FitBook – accueil">
          <span class="logo-mark">F</span>
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
              <button type="button" class="user-btn" (click)="toggle()" [attr.aria-expanded]="open()">
                @if (user.avatarUrl) {
                  <img class="avatar" [src]="user.avatarUrl" [alt]="user.firstName" />
                } @else {
                  <span class="avatar">{{ auth.initials() }}</span>
                }
                <span class="hide-mobile name">{{ user.firstName }}</span>
                <span class="hide-mobile caret">▾</span>
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
                    <a routerLink="/gestionnaire" role="menuitem" (click)="close()">Espace gestionnaire</a>
                  }
                  @if (auth.isCoach()) {
                    <a routerLink="/coach" role="menuitem" (click)="close()">Espace coach</a>
                  }
                  <a routerLink="/mes-reservations" role="menuitem" (click)="close()">Mes réservations</a>
                  <a routerLink="/mes-favoris" role="menuitem" (click)="close()">Mes favoris</a>
                  <a routerLink="/profil" role="menuitem" (click)="close()">Mon profil</a>
                  <button type="button" role="menuitem" class="logout" (click)="logout()">Déconnexion</button>
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
      background: #fff;
      border-bottom: 1px solid var(--color-border);
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
      font-weight: 800;
      font-size: 1.25rem;
      color: var(--color-dark);
    }
    .logo:hover {
      text-decoration: none;
    }
    .logo-mark {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: var(--color-primary);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
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
    }
    .links a:hover,
    .links a.active {
      color: var(--color-primary);
      text-decoration: none;
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
      border: none;
      padding: 4px;
      border-radius: 999px;
      font-weight: 600;
    }
    .user-btn:hover {
      background: var(--color-bg);
    }
    .caret {
      color: var(--color-text-muted);
    }
    .menu {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      background: #fff;
      border-radius: var(--radius);
      box-shadow: var(--shadow-hover);
      border: 1px solid var(--color-border);
      min-width: 240px;
      display: flex;
      flex-direction: column;
      padding: 6px;
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
      padding: 9px 12px;
      border-radius: 8px;
      color: var(--color-dark);
      text-align: left;
      background: none;
      border: none;
      font-weight: 500;
    }
    .menu a:hover,
    .menu .logout:hover {
      background: var(--color-bg);
      text-decoration: none;
    }
    .menu .logout {
      color: var(--color-danger);
      border-top: 1px solid var(--color-border);
      margin-top: 6px;
      border-radius: 0 0 8px 8px;
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
