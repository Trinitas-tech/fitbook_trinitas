import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

@Component({
  selector: 'app-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (message()) {
      <div class="alert alert-{{ type() }}" role="alert">
        <span class="alert-icon"><app-icon [name]="icon()" size="18" /></span>
        <div>
          @if (title()) {
            <strong>{{ title() }}</strong
            ><br />
          }
          {{ message() }}
          <ng-content />
        </div>
      </div>
    }
  `,
  styles: `
    .alert-icon {
      display: inline-flex;
      margin-top: 2px;
    }
  `,
})
export class AlertComponent {
  readonly type = input<AlertType>('info');
  readonly message = input<string | null | undefined>(null);
  readonly title = input<string | null>(null);

  /** Icône + couleur : l'information n'est jamais portée par la couleur seule. */
  readonly icon = computed(() => {
    switch (this.type()) {
      case 'success':
        return 'check';
      case 'error':
        return 'x';
      case 'warning':
        return 'alert-triangle';
      default:
        return 'info';
    }
  });
}
