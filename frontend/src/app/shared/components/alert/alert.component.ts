import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

@Component({
  selector: 'app-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message()) {
      <div class="alert alert-{{ type() }}" role="alert">
        <span class="alert-icon" aria-hidden="true">{{ icon() }}</span>
        <div>
          @if (title()) {
            <strong>{{ title() }}</strong><br />
          }
          {{ message() }}
          <ng-content />
        </div>
      </div>
    }
  `,
  styles: `
    .alert-icon {
      font-weight: 700;
    }
  `,
})
export class AlertComponent {
  readonly type = input<AlertType>('info');
  readonly message = input<string | null | undefined>(null);
  readonly title = input<string | null>(null);

  icon(): string {
    switch (this.type()) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '!';
      default:
        return 'i';
    }
  }
}
