import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Activity, errorMessage, isApiError } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-activities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    ReactiveFormsModule,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Activités</h1>
      <button type="button" class="btn btn-primary" (click)="open(null)">
        + Nouvelle activité
      </button>
    </div>

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (activities().length === 0) {
      <app-empty-state
        icon="award"
        title="Aucune activité"
        message="Créez les activités proposées sur la plateforme (Yoga, CrossFit…)."
      />
    } @else {
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Icône</th>
              <th>Nom</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (a of activities(); track a.id) {
              <tr>
                <td style="font-size: 1.4rem">{{ a.icon || '–' }}</td>
                <td>
                  <strong>{{ a.name }}</strong>
                </td>
                <td class="muted">{{ a.description || '–' }}</td>
                <td style="text-align: right; white-space: nowrap">
                  <button type="button" class="btn btn-outline btn-sm" (click)="open(a)">
                    Modifier
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    (click)="toDelete.set(a)"
                    aria-label="Supprimer"
                  >
                    <app-icon name="trash" size="18" />
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (modalOpen()) {
      <div class="modal-backdrop" (click)="close()">
        <form
          class="modal"
          [formGroup]="form"
          (ngSubmit)="save()"
          (click)="$event.stopPropagation()"
          novalidate
        >
          <h3 class="modal-title">{{ editing() ? 'Modifier l’activité' : 'Nouvelle activité' }}</h3>
          <app-alert type="error" [message]="modalError()" />
          <div class="form-row">
            <div class="field">
              <label class="label" for="a-name">Nom</label>
              <input id="a-name" class="input" formControlName="name" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <span class="field-error">Le nom est obligatoire.</span>
              }
            </div>
            <div class="field">
              <label class="label" for="a-icon">Icône (emoji)</label>
              <input
                id="a-icon"
                class="input"
                formControlName="icon"
                placeholder="🧘"
                maxlength="8"
              />
            </div>
          </div>
          <div class="field">
            <label class="label" for="a-desc">Description</label>
            <textarea id="a-desc" class="input" formControlName="description" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" (click)="close()" [disabled]="busy()">
              Annuler
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="busy()">
              {{ busy() ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    }

    @if (toDelete(); as a) {
      <app-confirm-dialog
        title="Supprimer l’activité ?"
        [message]="
          'L’activité « ' + a.name + ' » sera supprimée. Impossible si des cours l’utilisent.'
        "
        confirmLabel="Supprimer"
        [danger]="true"
        [busy]="busy()"
        (confirm)="remove(a)"
        (cancel)="toDelete.set(null)"
      />
    }
  `,
})
export class AdminActivitiesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly activities = signal<Activity[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly editing = signal<Activity | null>(null);
  readonly toDelete = signal<Activity | null>(null);
  readonly busy = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: [''],
    icon: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  open(activity: Activity | null): void {
    this.editing.set(activity);
    this.modalError.set(null);
    this.form.reset({
      name: activity?.name ?? '',
      description: activity?.description ?? '',
      icon: activity?.icon ?? '',
    });
    this.modalOpen.set(true);
  }

  close(): void {
    if (!this.busy()) {
      this.modalOpen.set(false);
    }
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const v = this.form.getRawValue();
    const payload = { name: v.name.trim(), description: v.description.trim(), icon: v.icon.trim() };
    const editing = this.editing();
    this.busy.set(true);
    this.modalError.set(null);
    const request = editing
      ? this.admin.updateActivity(editing.id, payload)
      : this.admin.createActivity(payload);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.modalOpen.set(false);
        this.toast.success(editing ? 'Activité modifiée.' : 'Activité créée.');
        this.load();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        const details =
          isApiError(err) && err.errors ? ' ' + Object.values(err.errors).join(' ') : '';
        this.modalError.set(errorMessage(err) + details);
      },
    });
  }

  remove(activity: Activity): void {
    this.busy.set(true);
    this.admin.deleteActivity(activity.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.toDelete.set(null);
        this.activities.update((list) => list.filter((a) => a.id !== activity.id));
        this.toast.success('Activité supprimée.');
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.toDelete.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.admin.activities().subscribe({
      next: (list) => {
        this.activities.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
