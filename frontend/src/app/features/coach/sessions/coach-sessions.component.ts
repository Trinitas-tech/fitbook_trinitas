import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Session, errorMessage } from '../../../core/models';
import { CoachService } from '../../../core/services/coach.service';
import { CalendarView, calendarRange, startOfWeek } from '../../../core/utils/date.utils';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { SessionListComponent } from '../../../shared/components/session-list/session-list.component';
import { WeekCalendarComponent } from '../../../shared/components/week-calendar/week-calendar.component';

@Component({
  selector: 'app-coach-sessions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AlertComponent, SessionListComponent, WeekCalendarComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Mes séances</h1>
      <a routerLink="/coach/seances/nouvelle" class="btn btn-primary">+ Nouvelle séance</a>
    </div>

    <app-alert type="error" [message]="error()" />

    <app-week-calendar
      [sessions]="sessions()"
      [cursor]="cursor()"
      [view]="view()"
      [showViewToggle]="true"
      [loading]="loading()"
      (cursorChange)="setCursor($event)"
      (viewChange)="setView($event)"
      (sessionClick)="open($event)"
    />

    <section class="section mt-24">
      <h2>Liste des séances de la période</h2>
      <app-session-list [sessions]="sorted()" [showBook]="false" (select)="open($event)" emptyMessage="Aucune séance sur cette période. Créez votre première séance !" />
    </section>
  `,
})
export class CoachSessionsComponent implements OnInit {
  private readonly coach = inject(CoachService);
  private readonly router = inject(Router);

  readonly cursor = signal(startOfWeek(new Date()));
  readonly view = signal<CalendarView>('week');
  readonly sessions = signal<Session[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly sorted = computed(() =>
    [...this.sessions()].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
  );

  ngOnInit(): void {
    this.load();
  }

  setCursor(date: Date): void {
    this.cursor.set(date);
    this.load();
  }

  setView(view: CalendarView): void {
    this.view.set(view);
    this.cursor.set(view === 'week' ? startOfWeek(this.cursor()) : this.cursor());
    this.load();
  }

  open(session: Session): void {
    this.router.navigate(['/coach/seances', session.id]);
  }

  private load(): void {
    const { from, to } = calendarRange(this.cursor(), this.view());
    this.loading.set(true);
    this.error.set(null);
    this.coach.sessions(from, to).subscribe({
      next: (list) => {
        this.sessions.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
