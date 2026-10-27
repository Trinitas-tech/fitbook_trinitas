import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loader" role="status" aria-live="polite">
      <span class="spinner"></span>
      <span>{{ label() }}</span>
    </div>
  `,
})
export class LoaderComponent {
  readonly label = input('Chargement…');
}
