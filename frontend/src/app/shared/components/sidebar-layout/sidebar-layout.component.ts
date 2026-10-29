import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

export interface SidebarLink {
  path: string;
  label: string;
  /** Nom d'icône du composant `app-icon` (ex. `chart`, `users`). */
  icon: string;
  exact?: boolean;
}

/** Layout des espaces coach / gestionnaire / admin : barre latérale (desktop), onglets (mobile). */
@Component({
  selector: 'app-sidebar-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="space">
          <span class="space-label">Espace</span>
          <strong>{{ title() }}</strong>
        </div>
        <nav class="nav" [attr.aria-label]="'Menu ' + title()">
          @for (link of links(); track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: !!link.exact }"
            >
              <span class="ico"><app-icon [name]="link.icon" size="18" /></span>
              <span>{{ link.label }}</span>
            </a>
          }
        </nav>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .layout {
      display: grid;
      grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
      min-height: calc(100vh - var(--header-height));
    }
    .sidebar {
      background: var(--glass-bg);
      -webkit-backdrop-filter: blur(var(--glass-blur));
      backdrop-filter: blur(var(--glass-blur));
      border-right: 1px solid var(--glass-border);
      padding: 20px 14px;
      position: sticky;
      top: var(--header-height);
      height: calc(100vh - var(--header-height));
      overflow-y: auto;
    }
    .space {
      display: flex;
      flex-direction: column;
      padding: 6px 12px 16px;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 10px;
    }
    .space strong {
      font-family: var(--font-heading);
    }
    .space-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-muted);
    }
    .nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      min-height: 44px;
      border-radius: 12px;
      border: 1px solid transparent;
      color: var(--color-text-muted);
      font-weight: 600;
      white-space: nowrap;
      transition:
        background var(--dur-fast),
        color var(--dur-fast),
        box-shadow var(--dur-fast);
    }
    .nav a:hover {
      background: var(--glass-bg);
      color: var(--color-text);
      text-decoration: none;
    }
    .nav a.active {
      background: var(--color-surface);
      border-color: rgba(255, 255, 255, 0.5);
      box-shadow: var(--neu-pressed-sm);
      color: var(--color-link);
    }
    .ico {
      width: 22px;
    }
    .content {
      padding: 24px 28px 48px;
      min-width: 0;
    }
    @media (max-width: 1024px) {
      .layout {
        grid-template-columns: 200px minmax(0, 1fr);
      }
    }
    @media (max-width: 768px) {
      .layout {
        display: block;
      }
      .sidebar {
        position: sticky;
        top: var(--header-height);
        height: auto;
        padding: 8px 8px 0;
        border-right: none;
        border-bottom: 1px solid var(--glass-border);
        z-index: 40;
      }
      .space {
        display: none;
      }
      .nav {
        flex-direction: row;
        overflow-x: auto;
        gap: 4px;
        scrollbar-width: none;
      }
      .nav a {
        padding: 8px 12px;
        border-radius: 0;
        border: none;
        border-bottom: 2px solid transparent;
        font-size: 0.85rem;
      }
      .nav a.active {
        background: none;
        box-shadow: none;
        color: var(--color-link);
        border-bottom-color: var(--color-link);
      }
      .content {
        padding: 16px 16px 40px;
      }
    }
  `,
})
export class SidebarLayoutComponent {
  readonly title = input.required<string>();
  readonly links = input.required<SidebarLink[]>();
}
