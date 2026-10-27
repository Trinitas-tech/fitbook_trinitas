import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <div class="icon" aria-hidden="true">{{ icon() }}</div>
      <p class="bold" style="color: var(--color-dark); margin-bottom: 4px">{{ title() }}</p>
      @if (message()) {
        <p class="small" style="margin: 0">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('🔍');
  readonly title = input('Aucun résultat');
  readonly message = input<string | null>(null);
}
