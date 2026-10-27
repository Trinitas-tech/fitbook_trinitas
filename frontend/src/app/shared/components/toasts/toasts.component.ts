import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast toast-{{ t.type }}" (click)="toast.dismiss(t.id)">
          {{ t.message }}
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      top: 16px;
      right: 16px;
      left: 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      z-index: 200;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      background: var(--color-dark);
      color: #fff;
      padding: 12px 18px;
      border-radius: 10px;
      box-shadow: var(--shadow-hover);
      max-width: 420px;
      font-weight: 500;
      cursor: pointer;
      animation: slide 0.2s ease-out;
    }
    .toast-success {
      background: var(--color-success);
    }
    .toast-error {
      background: var(--color-danger);
    }
    @keyframes slide {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @media (max-width: 768px) {
      .toasts {
        top: auto;
        bottom: calc(var(--bottom-tabs-height) + 12px);
        align-items: stretch;
      }
      .toast {
        max-width: none;
      }
    }
  `,
})
export class ToastsComponent {
  readonly toast = inject(ToastService);
}
