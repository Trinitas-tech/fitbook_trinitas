import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Availability, DAY_LABELS, errorMessage } from '../../../core/models';
import { CoachService } from '../../../core/services/coach.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

interface Slot {
  key: number;
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
}

@Component({
  selector: 'app-coach-availabilities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AlertComponent, LoaderComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Mes disponibilités</h1>
      <button type="button" class="btn btn-primary" [disabled]="busy() || !valid()" (click)="save()">
        {{ busy() ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </div>
    <p class="muted">Définissez vos créneaux hebdomadaires. Vos séances devront être créées à l'intérieur de ces créneaux.</p>

    @if (loading()) {
      <app-loader />
    } @else {
      <app-alert type="error" [message]="error()" />
      <div class="days">
        @for (day of days(); track day.index) {
          <div class="card card-sm day">
            <div class="flex between">
              <strong>{{ day.label }}</strong>
              <button type="button" class="btn btn-ghost btn-sm" (click)="add(day.index + 1)">+ Créneau</button>
            </div>
            @if (day.slots.length === 0) {
              <p class="muted small" style="margin: 6px 0 0">Indisponible</p>
            }
            @for (slot of day.slots; track slot.key) {
              <div class="slot" [class.invalid]="slot.startsAt >= slot.endsAt">
                <input type="time" class="input" [(ngModel)]="slot.startsAt" (ngModelChange)="touch()" aria-label="Début" />
                <span>→</span>
                <input type="time" class="input" [(ngModel)]="slot.endsAt" (ngModelChange)="touch()" aria-label="Fin" />
                <button type="button" class="btn btn-ghost btn-sm" (click)="remove(slot)" aria-label="Supprimer le créneau">✕</button>
              </div>
            }
          </div>
        }
      </div>
      @if (!valid()) {
        <p class="field-error mt-16">Chaque créneau doit avoir une heure de fin postérieure à l'heure de début.</p>
      }
    }
  `,
  styles: `
    .days {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 14px;
    }
    .slot {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }
    .slot .input {
      padding: 6px 10px;
    }
    .slot.invalid .input {
      border-color: var(--color-danger);
    }
  `,
})
export class CoachAvailabilitiesComponent implements OnInit {
  private readonly coach = inject(CoachService);
  private readonly toast = inject(ToastService);
  private nextKey = 1;

  readonly slots = signal<Slot[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly version = signal(0);

  readonly days = computed(() => {
    this.version();
    const slots = this.slots();
    return DAY_LABELS.map((label, index) => ({
      index,
      label,
      slots: slots.filter((s) => s.dayOfWeek === index + 1),
    }));
  });

  readonly valid = computed(() => {
    this.version();
    return this.slots().every((s) => s.startsAt && s.endsAt && s.startsAt < s.endsAt);
  });

  ngOnInit(): void {
    this.coach.availabilities().subscribe({
      next: (list) => {
        this.slots.set(list.map((a) => ({ key: this.nextKey++, ...a })));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  add(dayOfWeek: number): void {
    this.slots.update((list) => [...list, { key: this.nextKey++, dayOfWeek, startsAt: '09:00', endsAt: '12:00' }]);
  }

  remove(slot: Slot): void {
    this.slots.update((list) => list.filter((s) => s.key !== slot.key));
  }

  /** Les champs ngModel mutent les objets : on force le recalcul des computed. */
  touch(): void {
    this.version.update((v) => v + 1);
  }

  save(): void {
    if (!this.valid()) {
      return;
    }
    const payload: Availability[] = this.slots()
      .map(({ dayOfWeek, startsAt, endsAt }) => ({ dayOfWeek, startsAt, endsAt }))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startsAt.localeCompare(b.startsAt));
    this.busy.set(true);
    this.error.set(null);
    this.coach.saveAvailabilities(payload).subscribe({
      next: (list) => {
        this.slots.set(list.map((a) => ({ key: this.nextKey++, ...a })));
        this.busy.set(false);
        this.toast.success('Disponibilités enregistrées.');
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
