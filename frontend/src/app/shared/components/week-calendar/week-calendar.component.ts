import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DAY_SHORT_LABELS, Session } from '../../../core/models';
import {
  CalendarView,
  addDays,
  addMonths,
  calendarRange,
  sameDay,
  startOfWeek,
} from '../../../core/utils/date.utils';

interface CalendarDay {
  date: Date;
  isToday: boolean;
  inMonth: boolean;
  sessions: Session[];
}

@Component({
  selector: 'app-week-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div class="calendar card">
      <div class="toolbar">
        <div class="nav">
          <button type="button" class="btn btn-outline btn-sm" (click)="shift(-1)" aria-label="Période précédente">‹</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="today()">Aujourd'hui</button>
          <button type="button" class="btn btn-outline btn-sm" (click)="shift(1)" aria-label="Période suivante">›</button>
        </div>
        <div class="period">
          @if (view() === 'week') {
            Semaine du {{ range().from | date: 'd MMMM' }} au {{ lastDay() | date: 'd MMMM yyyy' }}
          } @else {
            {{ cursor() | date: 'MMMM yyyy' }}
          }
        </div>
        @if (showViewToggle()) {
          <div class="tabs-inline">
            <button type="button" class="chip" [class.active]="view() === 'week'" (click)="viewChange.emit('week')">Semaine</button>
            <button type="button" class="chip" [class.active]="view() === 'month'" (click)="viewChange.emit('month')">Mois</button>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="loader"><span class="spinner"></span> Chargement des séances…</div>
      } @else {
        <div class="head">
          @for (label of dayLabels; track label) {
            <div class="head-cell">{{ label }}</div>
          }
        </div>
        <div class="grid" [class.month]="view() === 'month'">
          @for (day of days(); track day.date.getTime()) {
            <div class="day" [class.today]="day.isToday" [class.out]="!day.inMonth" [class.empty]="day.sessions.length === 0">
              <div class="day-head">
                <span class="day-label">{{ day.date | date: 'EEE' }}</span>
                <span class="day-num">{{ day.date | date: 'd' }}</span>
              </div>
              <div class="chips">
                @for (s of day.sessions; track s.id) {
                  <button
                    type="button"
                    class="session"
                    [class]="'session status-' + s.status"
                    [class.selected]="s.id === selectedId()"
                    [title]="title(s)"
                    (click)="sessionClick.emit(s)"
                  >
                    <span class="time">{{ s.startAt | date: 'HH:mm' }}</span>
                    <span class="label">{{ s.course?.title || s.location || 'Séance' }}</span>
                    <span class="seats">{{ s.remainingSeats }}/{{ s.capacity }} pl.</span>
                  </button>
                } @empty {
                  <span class="none">—</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .calendar {
      padding: 16px;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }
    .nav {
      display: flex;
      gap: 6px;
    }
    .period {
      font-weight: 700;
      text-transform: capitalize;
    }
    .tabs-inline {
      display: flex;
      gap: 6px;
    }
    .tabs-inline .chip {
      padding: 5px 12px;
      font-size: 0.82rem;
    }
    .head {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      margin-bottom: 6px;
    }
    .head-cell {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-muted);
      font-weight: 600;
      text-align: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
    }
    .day {
      background: var(--color-bg);
      border-radius: 10px;
      padding: 8px;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .month .day {
      min-height: 90px;
    }
    .day.today {
      outline: 2px solid var(--color-primary);
    }
    .day.out {
      opacity: 0.45;
    }
    .day-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }
    .day-label {
      display: none;
      text-transform: capitalize;
    }
    .day-num {
      font-weight: 700;
      color: var(--color-dark);
      font-size: 0.95rem;
    }
    .chips {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .session {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1px;
      width: 100%;
      text-align: left;
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      color: #1e3a8a;
      border-radius: 8px;
      padding: 5px 7px;
      font-size: 0.75rem;
      line-height: 1.25;
    }
    .session:hover {
      filter: brightness(0.96);
    }
    .session.selected {
      box-shadow: 0 0 0 2px var(--color-primary);
    }
    .session.status-complete {
      background: #fef3c7;
      border-color: #fde68a;
      color: #92400e;
    }
    .session.status-annulee {
      background: #fee2e2;
      border-color: #fecaca;
      color: #991b1b;
      text-decoration: line-through;
    }
    .session.status-terminee {
      background: #f1f5f9;
      border-color: #e2e8f0;
      color: #475569;
    }
    .time {
      font-weight: 700;
    }
    .label {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .seats {
      opacity: 0.8;
    }
    .none {
      color: #cbd5e1;
      font-size: 0.8rem;
    }
    @media (max-width: 768px) {
      .head {
        display: none;
      }
      .grid,
      .grid.month {
        grid-template-columns: 1fr;
      }
      .day {
        min-height: 0;
      }
      .day.empty {
        display: none;
      }
      .month .day.out {
        display: none;
      }
      .day-label {
        display: inline;
      }
      .session {
        font-size: 0.85rem;
        flex-direction: row;
        gap: 10px;
        align-items: center;
      }
      .label {
        flex: 1;
      }
    }
  `,
})
export class WeekCalendarComponent {
  readonly sessions = input<Session[]>([]);
  /** Lundi de la semaine (vue semaine) ou n'importe quel jour du mois (vue mois). */
  readonly cursor = input.required<Date>();
  readonly view = input<CalendarView>('week');
  readonly showViewToggle = input(false);
  readonly selectedId = input<number | null>(null);
  readonly loading = input(false);

  readonly cursorChange = output<Date>();
  readonly viewChange = output<CalendarView>();
  readonly sessionClick = output<Session>();

  readonly dayLabels = DAY_SHORT_LABELS;

  readonly range = computed(() => calendarRange(this.cursor(), this.view()));
  readonly lastDay = computed(() => addDays(this.range().to, -1));

  readonly days = computed<CalendarDay[]>(() => {
    const { from, to } = this.range();
    const now = new Date();
    const month = this.cursor().getMonth();
    const result: CalendarDay[] = [];
    const sorted = [...this.sessions()].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
    for (let d = new Date(from); d < to; d = addDays(d, 1)) {
      result.push({
        date: d,
        isToday: sameDay(d, now),
        inMonth: this.view() === 'week' || d.getMonth() === month,
        sessions: sorted.filter((s) => sameDay(new Date(s.startAt), d)),
      });
    }
    return result;
  });

  shift(direction: 1 | -1): void {
    const next =
      this.view() === 'month' ? addMonths(this.cursor(), direction) : addDays(this.cursor(), 7 * direction);
    this.cursorChange.emit(next);
  }

  today(): void {
    const now = new Date();
    this.cursorChange.emit(this.view() === 'month' ? now : startOfWeek(now));
  }

  title(s: Session): string {
    return `${s.course?.title ?? 'Séance'} – ${s.remainingSeats} place(s) restante(s)`;
  }
}
