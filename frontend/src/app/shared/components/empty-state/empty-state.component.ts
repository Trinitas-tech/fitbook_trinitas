import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="empty-state">
      <div class="icon" aria-hidden="true"><app-icon [name]="icon()" size="36" /></div>
      <p class="bold" style="color: var(--color-text); margin-bottom: 4px">{{ title() }}</p>
      @if (message()) {
        <p class="small" style="margin: 0">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  /** Nom d'icône `app-icon` (ex. `search`, `building`, `calendar`). */
  readonly icon = input('search');
  readonly title = input('Aucun résultat');
  readonly message = input<string | null>(null);
}
