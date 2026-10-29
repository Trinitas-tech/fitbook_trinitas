import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast toast-{{ t.type }}" (click)="toast.dismiss(t.id)">
          <app-icon [name]="iconFor(t.type)" size="18" />
          <span>{{ t.message }}</span>
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
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--grad-cta-info);
      color: #fff;
      padding: 12px 18px;
      min-height: 44px;
      border-radius: var(--radius-pill);
      border: 1px solid rgba(255, 255, 255, 0.25);
      box-shadow: var(--glow-water);
      max-width: 420px;
      font-weight: 500;
      cursor: pointer;
      animation: slide var(--dur-base) var(--ease-out);
    }
    .toast-success {
      background: var(--grad-cta-success);
      box-shadow: var(--glow-nature);
    }
    .toast-error {
      background: var(--grad-cta);
      box-shadow: var(--glow-fire);
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

  iconFor(type: string): string {
    return type === 'success' ? 'check' : type === 'error' ? 'x' : 'info';
  }
}
