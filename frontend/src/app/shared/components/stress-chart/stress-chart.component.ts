import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface StressPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-stress-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (points().length === 0) {
      <p class="muted empty">Aucune mesure de stress disponible.</p>
    } @else {
      <div class="plot">
        <svg
          viewBox="0 0 600 260"
          role="img"
          aria-label="Évolution du stress sur une échelle de 0 à 10"
        >
          <title>Évolution du niveau de stress</title>
          <desc>{{ description() }}</desc>
          <rect x="40" y="16" width="530" height="60" class="zone high" />
          <rect x="40" y="76" width="530" height="80" class="zone medium" />
          <rect x="40" y="156" width="530" height="60" class="zone low" />
          @for (tick of ticks; track tick) {
            <line
              x1="40"
              x2="570"
              [attr.y1]="216 - tick * 20"
              [attr.y2]="216 - tick * 20"
              class="grid"
            />
            <text x="30" [attr.y]="220 - tick * 20" text-anchor="end">{{ tick }}</text>
          }
          <path [attr.d]="path()" class="curve" />
          @for (point of points(); track $index) {
            <circle [attr.cx]="point.x" [attr.cy]="point.y" r="5" class="point" tabindex="0">
              <title>{{ point.label }} : {{ point.value }}/10</title>
            </circle>
            @if ($index % labelStep() === 0 || $last) {
              <text [attr.x]="point.x" y="240" text-anchor="middle">{{ point.label }}</text>
            }
          }
        </svg>
      </div>
      <ul class="legend" aria-label="Repères de lecture">
        <li><span class="low"></span>Faible (0–3)</li>
        <li><span class="medium"></span>Modéré (4–6)</li>
        <li><span class="high"></span>Élevé (7–10)</li>
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .plot {
      overflow-x: auto;
    }
    svg {
      display: block;
      width: 100%;
      min-width: 320px;
      font-family: var(--font);
    }
    text {
      font-size: 12px;
      fill: var(--color-text-muted);
    }
    .zone {
      opacity: 0.1;
    }
    .low {
      fill: var(--color-success);
      background: var(--color-success);
    }
    .medium {
      fill: var(--color-warning, #d99016);
      background: var(--color-warning, #d99016);
    }
    .high {
      fill: var(--color-danger);
      background: var(--color-danger);
    }
    .grid {
      stroke: var(--color-border);
      stroke-dasharray: 4 4;
    }
    .curve {
      fill: none;
      stroke: var(--color-primary);
      stroke-width: 3;
      stroke-linejoin: round;
      stroke-linecap: round;
    }
    .point {
      fill: var(--color-primary);
      stroke: var(--color-white, #fff);
      stroke-width: 2;
    }
    .point:focus {
      outline: none;
      stroke: var(--color-dark);
      stroke-width: 3;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding: 0;
      margin: 8px 0 0;
      list-style: none;
      color: var(--color-text-muted);
      font-size: 0.82rem;
    }
    .legend li {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legend span {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }
    .empty {
      padding: 24px 0;
      text-align: center;
    }
  `,
})
export class StressChartComponent {
  readonly measurements = input.required<StressPoint[]>();
  readonly ticks = [0, 2, 4, 6, 8, 10];

  readonly points = computed(() => {
    const measurements = this.measurements();
    return measurements.flatMap((point, index) =>
      Number.isFinite(point.value) && point.value >= 0 && point.value <= 10
        ? [
            {
              ...point,
              x: measurements.length === 1 ? 305 : 40 + (index * 530) / (measurements.length - 1),
              y: 216 - point.value * 20,
            },
          ]
        : [],
    );
  });
  readonly path = computed(() =>
    this.points()
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' '),
  );
  readonly labelStep = computed(() => Math.max(1, Math.ceil(this.points().length / 7)));
  readonly description = computed(() =>
    this.points()
      .map((point) => `${point.label} : ${point.value} sur 10`)
      .join(', '),
  );
}
