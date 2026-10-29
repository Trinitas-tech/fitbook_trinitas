import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { errorMessage } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { FavoriteService, FavoriteType } from '../../../core/services/favorite.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-favorite-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="fav"
      [class.active]="isFav()"
      [class.with-label]="showLabel()"
      [disabled]="busy()"
      [attr.aria-pressed]="isFav()"
      [attr.aria-label]="isFav() ? 'Retirer des favoris' : 'Ajouter aux favoris'"
      [title]="isFav() ? 'Retirer des favoris' : 'Ajouter aux favoris'"
      (click)="toggle($event)"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          [attr.fill]="isFav() ? 'currentColor' : 'none'"
          stroke="currentColor"
          stroke-width="2"
        />
      </svg>
      @if (showLabel()) {
        <span>{{ isFav() ? 'Dans mes favoris' : 'Ajouter aux favoris' }}</span>
      }
    </button>
  `,
  styles: `
    .fav {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--glass-border);
      background: var(--glass-bg-strong);
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
      color: var(--color-text-muted);
      border-radius: 999px;
      width: 36px;
      height: 36px;
      justify-content: center;
      transition: all 0.15s;
      box-shadow: var(--shadow);
    }
    .fav.with-label {
      width: auto;
      padding: 8px 14px;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: none;
    }
    .fav:hover {
      color: var(--color-primary);
      border-color: var(--color-primary);
    }
    .fav.active {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: var(--color-primary-light);
    }
    .fav:disabled {
      opacity: 0.6;
    }
  `,
})
export class FavoriteButtonComponent {
  private readonly favorites = inject(FavoriteService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly type = input.required<FavoriteType>();
  readonly id = input.required<number>();
  readonly isFavorite = input(false);
  readonly showLabel = input(false);
  readonly changed = output<boolean>();

  readonly isFav = linkedSignal(() => this.isFavorite());
  readonly busy = signal(false);

  toggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/connexion'], { queryParams: { redirect: this.router.url } });
      return;
    }

    const next = !this.isFav();
    this.busy.set(true);
    const request = next
      ? this.favorites.add(this.type(), this.id())
      : this.favorites.remove(this.type(), this.id());

    request.subscribe({
      next: () => {
        this.isFav.set(next);
        this.busy.set(false);
        this.changed.emit(next);
        this.toast.success(next ? 'Ajouté à vos favoris.' : 'Retiré de vos favoris.');
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }
}
