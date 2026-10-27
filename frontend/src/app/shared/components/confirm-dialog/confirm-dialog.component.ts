import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop" (click)="cancel.emit()">
      <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="title()" (click)="$event.stopPropagation()">
        <h3 class="modal-title">{{ title() }}</h3>
        <p class="muted">{{ message() }}</p>
        <ng-content />
        <div class="form-actions">
          <button type="button" class="btn btn-outline" (click)="cancel.emit()" [disabled]="busy()">Annuler</button>
          <button type="button" class="btn" [class.btn-danger]="danger()" [class.btn-primary]="!danger()" (click)="confirm.emit()" [disabled]="busy()">
            @if (busy()) {
              <span class="spinner" style="width: 16px; height: 16px; border-width: 2px"></span>
            }
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly title = input('Confirmer');
  readonly message = input('');
  readonly confirmLabel = input('Confirmer');
  readonly danger = input(false);
  readonly busy = input(false);
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
