import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Session, SessionParticipant, errorMessage } from '../../../core/models';
import { CatalogService } from '../../../core/services/catalog.service';
import { CoachService } from '../../../core/services/coach.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CoachSessionFormComponent } from '../session-form/coach-session-form.component';

type Action = 'cancel' | 'delete' | null;

@Component({
  selector: 'app-coach-session-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
    CoachSessionFormComponent,
  ],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/coach/seances" class="small">← Mes séances</a>
        <h1 class="page-title">Détail de la séance</h1>
      </div>
      @if (session(); as s) {
        @if (s.status !== 'annulee' && s.status !== 'terminee') {
          <div class="flex flex-wrap">
            <button type="button" class="btn btn-outline" (click)="editing.set(!editing())">{{ editing() ? 'Fermer' : 'Modifier' }}</button>
            <button type="button" class="btn btn-outline" (click)="action.set('cancel')">Annuler la séance</button>
            <button type="button" class="btn btn-danger" (click)="action.set('delete')">Supprimer</button>
          </div>
        }
      }
    </div>

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (session(); as s) {
      @if (editing()) {
        <div class="mb-16">
          <app-coach-session-form [session]="s" (saved)="onSaved($event)" (cancelled)="editing.set(false)" />
        </div>
      }

      <div class="two-col">
        <section class="card">
          <div class="flex between flex-wrap">
            <h2 style="margin: 0; text-transform: capitalize">{{ s.startAt | date: 'EEEE d MMMM yyyy' }}</h2>
            <app-status-badge kind="session" [status]="s.status" />
          </div>
          <dl class="details">
            <dt>Horaire</dt>
            <dd>{{ s.startAt | date: 'HH:mm' }} – {{ s.endAt | date: 'HH:mm' }}</dd>
            <dt>Lieu</dt>
            <dd>{{ s.location || '–' }}</dd>
            <dt>Prix</dt>
            <dd>{{ s.price | currency: 'EUR' : 'symbol' : '1.0-2' }}</dd>
            <dt>Places</dt>
            <dd>{{ s.capacity - s.remainingSeats }} réservée(s) · {{ s.remainingSeats }} restante(s) / {{ s.capacity }}</dd>
          </dl>
        </section>

        <section class="card">
          <h2>Participants ({{ participants().length }})</h2>
          <app-alert type="error" [message]="participantsError()" />
          @if (participants().length === 0) {
            <p class="muted">Aucune réservation pour cette séance.</p>
          } @else {
            <ul class="list">
              @for (p of participants(); track p.id) {
                <li class="participant">
                  <div>
                    <strong>{{ p.user.firstName }} {{ p.user.lastName }}</strong>
                    <div class="muted small">{{ p.user.email }}</div>
                  </div>
                  <div class="flex">
                    <span class="badge">{{ p.seats }} place{{ p.seats > 1 ? 's' : '' }}</span>
                    <app-status-badge kind="booking" [status]="p.status" />
                  </div>
                </li>
              }
            </ul>
          }
        </section>
      </div>
    }

    @if (action() === 'cancel') {
      <app-confirm-dialog
        title="Annuler la séance ?"
        message="Toutes les réservations confirmées seront annulées et les participants recevront un e-mail."
        confirmLabel="Annuler la séance"
        [danger]="true"
        [busy]="busy()"
        (confirm)="cancelSession()"
        (cancel)="action.set(null)"
      />
    }
    @if (action() === 'delete') {
      <app-confirm-dialog
        title="Supprimer la séance ?"
        message="La suppression est impossible si des réservations confirmées existent (annulez d'abord la séance)."
        confirmLabel="Supprimer"
        [danger]="true"
        [busy]="busy()"
        (confirm)="deleteSession()"
        (cancel)="action.set(null)"
      />
    }
  `,
  styles: `
    .details {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 8px 12px;
      margin: 16px 0 0;
    }
    .details dt {
      color: var(--color-text-muted);
      font-size: 0.85rem;
    }
    .details dd {
      margin: 0;
      font-weight: 500;
    }
    .participant {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .participant:last-child {
      border-bottom: none;
    }
  `,
})
export class CoachSessionDetailComponent implements OnInit {
  private readonly coach = inject(CoachService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();

  readonly session = signal<Session | null>(null);
  readonly participants = signal<SessionParticipant[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly participantsError = signal<string | null>(null);
  readonly editing = signal(false);
  readonly action = signal<Action>(null);
  readonly busy = signal(false);

  ngOnInit(): void {
    const id = Number(this.id());
    this.catalog.session(id).subscribe({
      next: (s) => {
        this.session.set(s);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Séance introuvable.'));
        this.loading.set(false);
      },
    });
    this.coach.sessionBookings(id).subscribe({
      next: (list) => this.participants.set(list),
      error: (err: unknown) => this.participantsError.set(errorMessage(err)),
    });
  }

  onSaved(session: Session): void {
    this.session.set(session);
    this.editing.set(false);
  }

  cancelSession(): void {
    const s = this.session();
    if (!s) {
      return;
    }
    this.busy.set(true);
    this.coach.cancelSession(s.id).subscribe({
      next: (updated) => {
        this.session.set(updated);
        this.busy.set(false);
        this.action.set(null);
        this.toast.success('Séance annulée, les participants ont été prévenus.');
        this.coach.sessionBookings(s.id).subscribe({ next: (l) => this.participants.set(l), error: () => undefined });
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.action.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }

  deleteSession(): void {
    const s = this.session();
    if (!s) {
      return;
    }
    this.busy.set(true);
    this.coach.deleteSession(s.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success('Séance supprimée.');
        this.router.navigate(['/coach/seances']);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.action.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }
}
