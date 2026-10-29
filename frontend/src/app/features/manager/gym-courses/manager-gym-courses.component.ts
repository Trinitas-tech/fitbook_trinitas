import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Activity,
  CoachCard,
  CourseCard,
  GymDetail,
  LEVEL_LABELS,
  LEVEL_OPTIONS,
  errorMessage,
  isApiError,
} from '../../../core/models';
import { CatalogService } from '../../../core/services/catalog.service';
import { ManagerService } from '../../../core/services/manager.service';
import { ToastService } from '../../../core/services/toast.service';
import { fromDateTimeLocal } from '../../../core/utils/date.utils';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ManagerGymNavComponent } from '../gym-nav/manager-gym-nav.component';
import { ManagerGymStore } from '../manager-gym.store';
import { IconComponent } from '../../../shared/components/icon/icon.component';

type Modal =
  | { kind: 'course'; course: CourseCard | null }
  | { kind: 'plan'; course: CourseCard }
  | { kind: 'delete'; course: CourseCard }
  | null;

@Component({
  selector: 'app-manager-gym-courses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    ManagerGymNavComponent,
  ],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/gestionnaire/salles" class="small">← Mes salles</a>
        <h1 class="page-title">Cours · {{ gym()?.name || '' }}</h1>
      </div>
      <button type="button" class="btn btn-primary" (click)="openCourse(null)" [disabled]="!gym()">
        + Nouveau cours
      </button>
    </div>
    <app-manager-gym-nav [gymId]="gymId()" />

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (courses().length === 0) {
      <app-empty-state
        icon="leaf"
        title="Aucun cours"
        message="Créez un cours puis planifiez ses séances."
      >
        <button type="button" class="btn btn-primary btn-sm mt-16" (click)="openCourse(null)">
          Créer un cours
        </button>
      </app-empty-state>
    } @else {
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Cours</th>
              <th>Activité</th>
              <th>Niveau</th>
              <th>Durée</th>
              <th>Capacité</th>
              <th>Prix</th>
              <th>Coach</th>
              <th>Prochaine séance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of courses(); track c.id) {
              <tr>
                <td>
                  <strong>{{ c.title }}</strong>
                </td>
                <td>{{ c.activity.name }}</td>
                <td>{{ levelLabel(c.level) }}</td>
                <td>{{ c.durationMinutes }} min</td>
                <td>{{ c.capacity }}</td>
                <td>{{ c.price | currency: 'EUR' : 'symbol' : '1.0-2' }}</td>
                <td>{{ c.coach ? c.coach.firstName + ' ' + c.coach.lastName : '–' }}</td>
                <td>{{ c.nextSessionAt ? (c.nextSessionAt | date: 'd MMM HH:mm') : '–' }}</td>
                <td>
                  <div class="flex" style="justify-content: flex-end">
                    <button
                      type="button"
                      class="btn btn-primary btn-sm"
                      (click)="modal.set({ kind: 'plan', course: c })"
                    >
                      Planifier
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" (click)="openCourse(c)">
                      Modifier
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      (click)="modal.set({ kind: 'delete', course: c })"
                      aria-label="Supprimer"
                    >
                      <app-icon name="trash" size="18" />
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Modale cours -->
    @if (modal()?.kind === 'course') {
      <div class="modal-backdrop" (click)="closeModal()">
        <form
          class="modal modal-lg"
          [formGroup]="courseForm"
          (ngSubmit)="saveCourse()"
          (click)="$event.stopPropagation()"
          novalidate
        >
          <h3 class="modal-title">{{ editingCourse() ? 'Modifier le cours' : 'Nouveau cours' }}</h3>
          <app-alert type="error" [message]="modalError()" />
          <div class="field">
            <label class="label" for="c-title">Titre</label>
            <input id="c-title" class="input" formControlName="title" />
            @if (cinvalid('title')) {
              <span class="field-error">Le titre est obligatoire.</span>
            }
          </div>
          <div class="field">
            <label class="label" for="c-desc">Description</label>
            <textarea id="c-desc" class="input" formControlName="description" rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="field">
              <label class="label" for="c-activity">Activité</label>
              <select id="c-activity" class="input" formControlName="activityId">
                <option value="">Choisir…</option>
                @for (a of activities(); track a.id) {
                  <option [value]="a.id">{{ a.name }}</option>
                }
              </select>
              @if (cinvalid('activityId')) {
                <span class="field-error">Choisissez une activité.</span>
              }
            </div>
            <div class="field">
              <label class="label" for="c-level">Niveau</label>
              <select id="c-level" class="input" formControlName="level">
                @for (l of levels; track l.value) {
                  <option [value]="l.value">{{ l.label }}</option>
                }
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label class="label" for="c-duration">Durée (min)</label>
              <input
                id="c-duration"
                type="number"
                min="15"
                step="5"
                class="input"
                formControlName="durationMinutes"
              />
              @if (cinvalid('durationMinutes')) {
                <span class="field-error">Durée minimale : 15 min.</span>
              }
            </div>
            <div class="field">
              <label class="label" for="c-capacity">Capacité</label>
              <input
                id="c-capacity"
                type="number"
                min="1"
                class="input"
                formControlName="capacity"
              />
              @if (cinvalid('capacity')) {
                <span class="field-error"
                  >Entre 1 et {{ gym()?.totalCapacity || '…' }} places (capacité de la salle).</span
                >
              }
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label class="label" for="c-price">Prix (€)</label>
              <input
                id="c-price"
                type="number"
                min="0"
                step="0.5"
                class="input"
                formControlName="price"
              />
              @if (cinvalid('price')) {
                <span class="field-error">Prix positif requis.</span>
              }
            </div>
            <div class="field">
              <label class="label" for="c-coach">Coach (optionnel)</label>
              <select id="c-coach" class="input" formControlName="coachId">
                <option value="">Aucun</option>
                @for (co of coaches(); track co.id) {
                  <option [value]="co.id">
                    {{ co.firstName }} {{ co.lastName
                    }}{{ co.specialty ? ' – ' + co.specialty : '' }}
                  </option>
                }
              </select>
            </div>
          </div>
          <div class="field">
            <label class="label" for="c-image">Image (URL)</label>
            <input
              id="c-image"
              type="url"
              class="input"
              formControlName="imageUrl"
              placeholder="https://…"
            />
          </div>
          <div class="form-actions">
            <button
              type="button"
              class="btn btn-outline"
              (click)="closeModal()"
              [disabled]="busy()"
            >
              Annuler
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="busy()">
              {{ busy() ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    }

    <!-- Modale planification -->
    @if (modal(); as m) {
      @if (m.kind === 'plan') {
        <div class="modal-backdrop" (click)="closeModal()">
          <form
            class="modal"
            [formGroup]="planForm"
            (ngSubmit)="plan(m.course)"
            (click)="$event.stopPropagation()"
            novalidate
          >
            <h3 class="modal-title">Planifier des séances · {{ m.course.title }}</h3>
            <app-alert type="error" [message]="modalError()" />
            <div class="field">
              <label class="label" for="p-start">Date et heure de début</label>
              <input id="p-start" type="datetime-local" class="input" formControlName="startAt" />
              @if (planForm.controls.startAt.touched && planForm.controls.startAt.invalid) {
                <span class="field-error">La date est obligatoire.</span>
              }
            </div>
            <div class="form-row">
              <div class="field">
                <label class="label" for="p-capacity">Capacité</label>
                <input
                  id="p-capacity"
                  type="number"
                  min="1"
                  class="input"
                  formControlName="capacity"
                />
                <span class="hint">Par défaut : capacité du cours ({{ m.course.capacity }}).</span>
              </div>
              <div class="field">
                <label class="label" for="p-price">Prix (€)</label>
                <input
                  id="p-price"
                  type="number"
                  min="0"
                  step="0.5"
                  class="input"
                  formControlName="price"
                />
                <span class="hint"
                  >Par défaut : prix du cours ({{
                    m.course.price | currency: 'EUR' : 'symbol' : '1.0-2'
                  }}).</span
                >
              </div>
            </div>
            <div class="field">
              <label class="label" for="p-repeat">Répéter chaque semaine pendant</label>
              <select id="p-repeat" class="input" formControlName="repeatWeeks">
                <option value="0">Séance unique</option>
                @for (n of repeatOptions; track n) {
                  <option [value]="n">{{ n }} semaine{{ n > 1 ? 's' : '' }}</option>
                }
              </select>
            </div>
            <div class="form-actions">
              <button
                type="button"
                class="btn btn-outline"
                (click)="closeModal()"
                [disabled]="busy()"
              >
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="busy()">
                {{ busy() ? 'Planification…' : 'Planifier' }}
              </button>
            </div>
          </form>
        </div>
      }
      @if (m.kind === 'delete') {
        <app-confirm-dialog
          title="Supprimer le cours ?"
          [message]="'Le cours « ' + m.course.title + ' » et ses séances futures seront supprimés.'"
          confirmLabel="Supprimer"
          [danger]="true"
          [busy]="busy()"
          (confirm)="deleteCourse(m.course)"
          (cancel)="closeModal()"
        />
      }
    }
  `,
})
export class ManagerGymCoursesComponent implements OnInit {
  private readonly manager = inject(ManagerService);
  private readonly catalog = inject(CatalogService);
  private readonly store = inject(ManagerGymStore);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();
  readonly gymId = computed(() => Number(this.id()));

  readonly levels = LEVEL_OPTIONS;
  readonly repeatOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  readonly gym = signal<GymDetail | null>(null);
  readonly activities = signal<Activity[]>([]);
  readonly coaches = signal<CoachCard[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly modal = signal<Modal>(null);
  readonly editingCourse = signal<CourseCard | null>(null);
  readonly busy = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly courses = computed(() => this.gym()?.courses ?? []);

  readonly courseForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    activityId: ['', Validators.required],
    level: ['tous_niveaux'],
    durationMinutes: [60, [Validators.required, Validators.min(15)]],
    capacity: [10, [Validators.required, Validators.min(1)]],
    price: [10, [Validators.required, Validators.min(0)]],
    imageUrl: [''],
    coachId: [''],
  });

  readonly planForm = this.fb.nonNullable.group({
    startAt: ['', Validators.required],
    capacity: [null as number | null],
    price: [null as number | null],
    repeatWeeks: ['0'],
  });

  ngOnInit(): void {
    const init = () => {
      const gym = this.store.byId(this.gymId());
      if (!gym) {
        this.error.set('Salle introuvable ou non gérée par votre compte.');
      } else {
        this.gym.set(gym);
      }
      this.loading.set(false);
    };
    this.store.load().subscribe({
      next: init,
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
    this.catalog
      .activities()
      .subscribe({ next: (a) => this.activities.set(a), error: () => undefined });
    this.catalog
      .coaches({ limit: 100 })
      .subscribe({ next: (p) => this.coaches.set(p.items), error: () => undefined });
  }

  levelLabel(level: string): string {
    return LEVEL_LABELS[level] ?? level;
  }

  cinvalid(name: 'title' | 'activityId' | 'durationMinutes' | 'capacity' | 'price'): boolean {
    const c = this.courseForm.controls[name];
    return c.touched && c.invalid;
  }

  openCourse(course: CourseCard | null): void {
    this.editingCourse.set(course);
    this.modalError.set(null);
    const max = this.gym()?.totalCapacity ?? 1000;
    this.courseForm.controls.capacity.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(max),
    ]);
    this.courseForm.reset({
      title: course?.title ?? '',
      description: '',
      activityId: course ? String(course.activity.id) : '',
      level: course?.level ?? 'tous_niveaux',
      durationMinutes: course?.durationMinutes ?? 60,
      capacity: course?.capacity ?? Math.min(10, max),
      price: course?.price ?? 10,
      imageUrl: course?.imageUrl ?? '',
      coachId: course?.coach ? String(course.coach.id) : '',
    });
    this.modal.set({ kind: 'course', course });
  }

  closeModal(): void {
    if (!this.busy()) {
      this.modal.set(null);
      this.modalError.set(null);
    }
  }

  saveCourse(): void {
    this.courseForm.markAllAsTouched();
    if (this.courseForm.invalid) {
      return;
    }
    const v = this.courseForm.getRawValue();
    const payload = {
      title: v.title.trim(),
      description: v.description.trim(),
      activityId: Number(v.activityId),
      level: v.level,
      durationMinutes: Number(v.durationMinutes),
      price: Number(v.price),
      capacity: Number(v.capacity),
      imageUrl: v.imageUrl.trim() || null,
      coachId: v.coachId ? Number(v.coachId) : null,
    };
    const editing = this.editingCourse();
    this.busy.set(true);
    this.modalError.set(null);
    const request = editing
      ? this.manager.updateCourse(editing.id, payload)
      : this.manager.createCourse(this.gymId(), payload);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.modal.set(null);
        this.toast.success(editing ? 'Cours modifié.' : 'Cours créé.');
        this.refresh();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        const details =
          isApiError(err) && err.errors ? ' ' + Object.values(err.errors).join(' ') : '';
        this.modalError.set(errorMessage(err) + details);
      },
    });
  }

  plan(course: CourseCard): void {
    this.planForm.markAllAsTouched();
    if (this.planForm.invalid) {
      return;
    }
    const v = this.planForm.getRawValue();
    this.busy.set(true);
    this.modalError.set(null);
    this.manager
      .planSessions(course.id, {
        startAt: fromDateTimeLocal(v.startAt),
        capacity: v.capacity ? Number(v.capacity) : undefined,
        price:
          v.price !== null && v.price !== undefined && String(v.price) !== ''
            ? Number(v.price)
            : undefined,
        repeatWeeks: Number(v.repeatWeeks) || 0,
      })
      .subscribe({
        next: (sessions) => {
          this.busy.set(false);
          this.modal.set(null);
          this.planForm.reset({ startAt: '', capacity: null, price: null, repeatWeeks: '0' });
          this.toast.success(
            `${sessions.length} séance${sessions.length > 1 ? 's' : ''} planifiée${sessions.length > 1 ? 's' : ''}.`,
          );
          this.refresh();
        },
        error: (err: unknown) => {
          this.busy.set(false);
          const details =
            isApiError(err) && err.errors ? ' ' + Object.values(err.errors).join(' ') : '';
          this.modalError.set(errorMessage(err) + details);
        },
      });
  }

  deleteCourse(course: CourseCard): void {
    this.busy.set(true);
    this.manager.deleteCourse(course.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.modal.set(null);
        this.toast.success('Cours supprimé.');
        this.refresh();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.modal.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }

  private refresh(): void {
    this.store.load().subscribe({
      next: () => this.gym.set(this.store.byId(this.gymId())),
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }
}
