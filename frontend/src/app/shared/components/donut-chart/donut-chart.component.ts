import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface DonutSlice {
  label: string;
  value: number;
  /** Couleur CSS (variable CSS acceptée). */
  color: string;
}

interface Arc extends DonutSlice {
  dasharray: string;
  dashoffset: number;
  percent: number;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * US-54 : graphique en anneau SVG inline (répartition) avec légende.
 * Les parts sont dessinées avec `stroke-dasharray` sur des cercles superposés.
 */
@Component({
  selector: 'app-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (total() === 0) {
      <p class="muted small empty">{{ emptyMessage() }}</p>
    } @else {
      <div class="wrap">
        <svg viewBox="0 0 140 140" class="donut" role="img" [attr.aria-label]="ariaLabel()">
          <circle
            cx="70"
            cy="70"
            [attr.r]="radius"
            fill="none"
            stroke="var(--color-border)"
            stroke-width="18"
          />
          @for (a of arcs(); track a.label) {
            <circle
              cx="70"
              cy="70"
              [attr.r]="radius"
              fill="none"
              [attr.stroke]="a.color"
              stroke-width="18"
              [attr.stroke-dasharray]="a.dasharray"
              [attr.stroke-dashoffset]="a.dashoffset"
              transform="rotate(-90 70 70)"
              class="arc"
            >
              <title>{{ a.label }} : {{ a.value }} ({{ a.percent }} %)</title>
            </circle>
          }
          <text x="70" y="66" text-anchor="middle" class="total">{{ total() }}</text>
          <text x="70" y="84" text-anchor="middle" class="caption">{{ centerLabel() }}</text>
        </svg>
        <ul class="legend">
          @for (a of arcs(); track a.label) {
            <li>
              <span class="dot" [style.background]="a.color"></span>
              <span class="name">{{ a.label }}</span>
              <strong>{{ a.value }}</strong>
              <span class="muted small">{{ a.percent }} %</span>
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .wrap {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .donut {
      width: 180px;
      height: 180px;
      flex-shrink: 0;
      font-family: var(--font);
    }
    .arc {
      transition: opacity 0.15s;
    }
    .arc:hover {
      opacity: 0.8;
    }
    .total {
      font-size: 26px;
      font-weight: 800;
      fill: var(--color-dark);
    }
    .caption {
      font-size: 10px;
      fill: var(--color-text-muted);
    }
    .legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 180px;
      flex: 1;
    }
    .legend li {
      display: grid;
      grid-template-columns: 12px 1fr auto auto;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 4px;
    }
    .empty {
      margin: 0;
      padding: 24px 0;
      text-align: center;
    }
  `,
})
export class DonutChartComponent {
  readonly slices = input.required<DonutSlice[]>();
  readonly centerLabel = input('au total');
  readonly emptyMessage = input('Aucune donnée à afficher.');
  readonly ariaLabel = input('Répartition');

  readonly radius = RADIUS;
  readonly total = computed(() => this.slices().reduce((sum, s) => sum + Math.max(0, s.value), 0));

  readonly arcs = computed<Arc[]>(() => {
    const total = this.total();
    let offset = 0;
    return this.slices().map((s) => {
      const value = Math.max(0, s.value);
      const length = total > 0 ? (value / total) * CIRCUMFERENCE : 0;
      const arc: Arc = {
        ...s,
        value,
        dasharray: `${length} ${CIRCUMFERENCE - length}`,
        dashoffset: -offset,
        percent: total > 0 ? Math.round((value / total) * 100) : 0,
      };
      offset += length;
      return arc;
    });
  });
}
