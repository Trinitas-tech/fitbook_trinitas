import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

export interface BarSeries {
  name: string;
  values: number[];
  /** Couleur CSS (variable CSS acceptée). */
  color?: string;
}

interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  title: string;
}

interface Tick {
  value: number;
  pos: number;
}

const DEFAULT_COLORS = ['var(--color-primary)', 'var(--color-dark)', 'var(--color-info)'];

function formatNumber(value: number): string {
  return value.toLocaleString('fr-FR');
}

/** Graduations « rondes » (0 → max) pour l'axe des valeurs. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) {
    return [0, 1];
  }
  const rough = max / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / magnitude;
  const step = (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.0001; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  if (ticks[ticks.length - 1] < max) {
    ticks.push(ticks[ticks.length - 1] + step);
  }
  return ticks;
}

/**
 * US-54 : graphique à barres en SVG inline, sans librairie.
 * - 1 ou plusieurs séries, groupées (`grouped`) ou empilées (`stacked`) ;
 * - vertical (par défaut) ou horizontal (classements) ;
 * - responsive : la largeur du viewBox suit celle du conteneur (texte toujours lisible) ;
 * - valeur au survol via `<title>`.
 */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isEmpty()) {
      <p class="muted small empty">{{ emptyMessage() }}</p>
    } @else {
      <svg
        [attr.viewBox]="'0 0 ' + width() + ' ' + totalHeight()"
        [attr.height]="totalHeight()"
        width="100%"
        role="img"
        [attr.aria-label]="ariaLabel()"
        class="chart"
      >
        <!-- Grille + axe des valeurs -->
        @for (t of ticks(); track t.value) {
          @if (horizontal()) {
            <line
              [attr.x1]="t.pos"
              [attr.x2]="t.pos"
              [attr.y1]="pad.top"
              [attr.y2]="totalHeight() - pad.bottom"
              class="grid"
            />
            <text
              [attr.x]="t.pos"
              [attr.y]="totalHeight() - pad.bottom + 16"
              text-anchor="middle"
              class="tick"
            >
              {{ fmt(t.value) }}
            </text>
          } @else {
            <line
              [attr.x1]="pad.left"
              [attr.x2]="width() - pad.right"
              [attr.y1]="t.pos"
              [attr.y2]="t.pos"
              class="grid"
            />
            <text [attr.x]="pad.left - 6" [attr.y]="t.pos + 4" text-anchor="end" class="tick">
              {{ fmt(t.value) }}
            </text>
          }
        }
        <!-- Barres -->
        @for (b of bars(); track $index) {
          <rect
            [attr.x]="b.x"
            [attr.y]="b.y"
            [attr.width]="b.width"
            [attr.height]="b.height"
            [attr.fill]="b.color"
            rx="3"
            class="bar"
          >
            <title>{{ b.title }}</title>
          </rect>
        }
        <!-- Étiquettes de catégories -->
        @for (l of categoryLabels(); track $index) {
          @if (horizontal()) {
            <text [attr.x]="pad.left - 8" [attr.y]="l.pos + 4" text-anchor="end" class="label">
              <title>{{ l.full }}</title>
              {{ l.text }}
            </text>
          } @else {
            <text
              [attr.x]="l.pos"
              [attr.y]="totalHeight() - pad.bottom + 16"
              text-anchor="middle"
              class="label"
            >
              {{ l.text }}
            </text>
          }
        }
      </svg>
      @if (series().length > 1) {
        <ul class="legend" aria-label="Légende">
          @for (s of series(); track s.name; let i = $index) {
            <li><span class="dot" [style.background]="colorAt(i)"></span>{{ s.name }}</li>
          }
        </ul>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    .chart {
      display: block;
      font-family: var(--font);
      overflow: visible;
    }
    .grid {
      stroke: var(--color-border);
      stroke-width: 1;
    }
    .tick,
    .label {
      font-size: 11px;
      fill: var(--color-text-muted);
    }
    .label {
      fill: var(--color-dark);
    }
    .bar {
      transition: opacity 0.15s;
    }
    .bar:hover {
      opacity: 0.8;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 8px;
      font-size: 0.82rem;
      color: var(--color-text-muted);
    }
    .legend li {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      display: inline-block;
    }
    .empty {
      margin: 0;
      padding: 24px 0;
      text-align: center;
    }
  `,
})
export class BarChartComponent implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly labels = input.required<string[]>();
  readonly series = input.required<BarSeries[]>();
  readonly mode = input<'grouped' | 'stacked'>('grouped');
  readonly horizontal = input(false);
  /** Hauteur (px) du graphique vertical ; en horizontal, hauteur d'une ligne. */
  readonly height = input(220);
  readonly rowHeight = input(30);
  readonly emptyMessage = input('Aucune donnée à afficher.');
  readonly ariaLabel = input('Graphique à barres');

  readonly pad = { top: 10, right: 12, bottom: 28, left: 40 };
  readonly width = signal(600);
  private resizeObserver: ResizeObserver | null = null;

  readonly isEmpty = computed(
    () => this.labels().length === 0 || !this.series().some((s) => s.values.some((v) => v > 0)),
  );

  readonly totalHeight = computed(() =>
    this.horizontal()
      ? this.pad.top + this.pad.bottom + this.labels().length * this.rowHeight()
      : this.height(),
  );

  private readonly leftPad = computed(() => (this.horizontal() ? 130 : this.pad.left));

  private readonly maxValue = computed(() => {
    const series = this.series();
    let max = 0;
    this.labels().forEach((_, i) => {
      const values = series.map((s) => s.values[i] ?? 0);
      const v = this.mode() === 'stacked' ? values.reduce((a, b) => a + b, 0) : Math.max(...values);
      max = Math.max(max, v);
    });
    return max;
  });

  private readonly tickValues = computed(() => niceTicks(this.maxValue()));
  private readonly scaleMax = computed(() => this.tickValues()[this.tickValues().length - 1] || 1);

  readonly ticks = computed<Tick[]>(() => {
    const max = this.scaleMax();
    return this.tickValues().map((value) => ({ value, pos: this.valueToPos(value, max) }));
  });

  readonly bars = computed<Bar[]>(() => {
    const labels = this.labels();
    const series = this.series();
    const max = this.scaleMax();
    const stacked = this.mode() === 'stacked';
    const result: Bar[] = [];
    const n = labels.length;
    if (n === 0) {
      return result;
    }

    if (this.horizontal()) {
      const row = this.rowHeight();
      const barH = Math.min(18, row * 0.6);
      labels.forEach((label, i) => {
        const rowY = this.pad.top + i * row + (row - barH) / 2;
        let offset = 0;
        series.forEach((s, si) => {
          const v = s.values[i] ?? 0;
          const len = this.valueToPos(v, max) - this.leftPad();
          const subH = stacked || series.length === 1 ? barH : barH / series.length;
          const y = stacked || series.length === 1 ? rowY : rowY + si * subH;
          result.push({
            x: this.leftPad() + (stacked ? offset : 0),
            y,
            width: Math.max(0, len),
            height: subH,
            color: this.colorAt(si),
            title: `${label} · ${s.name} : ${formatNumber(v)}`,
          });
          offset += len;
        });
      });
      return result;
    }

    const plotW = this.width() - this.leftPad() - this.pad.right;
    const band = plotW / n;
    const groupW = band * 0.64;
    const baseY = this.totalHeight() - this.pad.bottom;
    labels.forEach((label, i) => {
      const groupX = this.leftPad() + i * band + (band - groupW) / 2;
      let stackBase = baseY;
      series.forEach((s, si) => {
        const v = s.values[i] ?? 0;
        const h = baseY - this.valueToPos(v, max);
        if (stacked || series.length === 1) {
          result.push({
            x: groupX,
            y: stackBase - h,
            width: groupW,
            height: Math.max(0, h),
            color: this.colorAt(si),
            title: `${label} · ${s.name} : ${formatNumber(v)}`,
          });
          stackBase -= h;
        } else {
          const w = groupW / series.length;
          result.push({
            x: groupX + si * w,
            y: baseY - h,
            width: w - 2,
            height: Math.max(0, h),
            color: this.colorAt(si),
            title: `${label} · ${s.name} : ${formatNumber(v)}`,
          });
        }
      });
    });
    return result;
  });

  readonly categoryLabels = computed(() => {
    const labels = this.labels();
    const n = labels.length;
    if (this.horizontal()) {
      const row = this.rowHeight();
      return labels.map((full, i) => ({
        full,
        text: full.length > 18 ? full.slice(0, 17) + '…' : full,
        pos: this.pad.top + i * row + row / 2,
      }));
    }
    const plotW = this.width() - this.leftPad() - this.pad.right;
    const band = plotW / Math.max(1, n);
    return labels.map((full, i) => ({
      full,
      text: full,
      pos: this.leftPad() + i * band + band / 2,
    }));
  });

  constructor() {
    afterNextRender(() => {
      const el = this.host.nativeElement;
      this.width.set(Math.max(240, el.clientWidth || 600));
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver((entries) => {
          const w = Math.round(entries[0]?.contentRect.width ?? 0);
          if (w > 0 && w !== this.width()) {
            this.width.set(Math.max(240, w));
          }
        });
        this.resizeObserver.observe(el);
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  colorAt(index: number): string {
    return this.series()[index]?.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  }

  fmt(value: number): string {
    return formatNumber(value);
  }

  /** Position (x en horizontal, y en vertical) d'une valeur sur l'axe. */
  private valueToPos(value: number, max: number): number {
    const ratio = Math.min(1, Math.max(0, value / max));
    if (this.horizontal()) {
      const plotW = this.width() - this.leftPad() - this.pad.right;
      return this.leftPad() + ratio * plotW;
    }
    const plotH = this.totalHeight() - this.pad.top - this.pad.bottom;
    return this.totalHeight() - this.pad.bottom - ratio * plotH;
  }
}
