import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ROLE_LABELS, Role, User, errorMessage } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

const LIMIT = 20;

@Component({
  selector: 'app-admin-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, ReactiveFormsModule, AlertComponent, LoaderComponent, EmptyStateComponent, PaginationComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Utilisateurs</h1>
    </div>

    <form class="card card-sm filters" (ngSubmit)="search()">
      <input class="input" name="q" [(ngModel)]="q" placeholder="Rechercher (nom, e-mail)…" />
      <select class="input" name="role" [(ngModel)]="role">
        <option value="">Tous les rôles</option>
        @for (r of roles; track r) {
          <option [value]="r">{{ roleLabels[r] }}</option>
        }
      </select>
      <button type="submit" class="btn btn-primary">Filtrer</button>
    </form>

    @if (loading()) {
      <app-loader />
    } @else if (error()) {
      <app-alert type="error" [message]="error()" />
    } @else if (users().length === 0) {
      <app-empty-state icon="👥" title="Aucun utilisateur" message="Aucun utilisateur ne correspond à ces critères." />
    } @else {
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>E-mail</th>
              <th>Rôles</th>
              <th>Statut</th>
              <th>Inscrit le</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (u of users(); track u.id) {
              <tr>
                <td><strong>{{ u.firstName }} {{ u.lastName }}</strong></td>
                <td>{{ u.email }}</td>
                <td>
                  @for (r of u.roles; track r) {
                    <span class="badge badge-primary" style="margin-right: 4px">{{ roleLabels[r] }}</span>
                  }
                </td>
                <td>
                  @if (u.isActive === false) {
                    <span class="badge badge-danger">Désactivé</span>
                  } @else if (!u.isVerified) {
                    <span class="badge badge-warning">Non vérifié</span>
                  } @else {
                    <span class="badge badge-success">Actif</span>
                  }
                </td>
                <td>{{ u.createdAt | date: 'd MMM yyyy' }}</td>
                <td style="text-align: right">
                  <button type="button" class="btn btn-outline btn-sm" (click)="edit(u)">Modifier</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [total]="total()" [limit]="limit" (pageChange)="goTo($event)" />
    }

    @if (editing(); as u) {
      <div class="modal-backdrop" (click)="closeEdit()">
        <form class="modal" [formGroup]="form" (ngSubmit)="save(u)" (click)="$event.stopPropagation()" novalidate>
          <h3 class="modal-title">Modifier {{ u.email }}</h3>
          <app-alert type="error" [message]="modalError()" />
          <div class="form-row">
            <div class="field">
              <label class="label" for="u-first">Prénom</label>
              <input id="u-first" class="input" formControlName="firstName" />
            </div>
            <div class="field">
              <label class="label" for="u-last">Nom</label>
              <input id="u-last" class="input" formControlName="lastName" />
            </div>
          </div>
          <div class="field">
            <span class="label">Rôles</span>
            <div class="flex flex-wrap">
              @for (r of roles; track r) {
                <label class="checkbox">
                  <input type="checkbox" [checked]="selectedRoles().includes(r)" (change)="toggleRole(r)" />
                  {{ roleLabels[r] }}
                </label>
              }
            </div>
            @if (selectedRoles().length === 0) {
              <span class="field-error">Au moins un rôle est requis.</span>
            }
          </div>
          <div class="field">
            <label class="checkbox"><input type="checkbox" formControlName="isActive" /> Compte actif (peut se connecter)</label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" (click)="closeEdit()" [disabled]="busy()">Annuler</button>
            <button type="submit" class="btn btn-primary" [disabled]="busy() || selectedRoles().length === 0">{{ busy() ? 'Enregistrement…' : 'Enregistrer' }}</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: `
    .filters {
      display: grid;
      grid-template-columns: 1fr 200px auto;
      gap: 10px;
      margin-bottom: 16px;
    }
    @media (max-width: 768px) {
      .filters {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly roles: Role[] = ['ROLE_USER', 'ROLE_COACH', 'ROLE_MANAGER', 'ROLE_ADMIN'];
  readonly roleLabels = ROLE_LABELS;
  readonly limit = LIMIT;

  q = '';
  role = '';

  readonly users = signal<User[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly editing = signal<User | null>(null);
  readonly selectedRoles = signal<Role[]>([]);
  readonly busy = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    isActive: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  search(): void {
    this.page.set(1);
    this.load();
  }

  goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  edit(user: User): void {
    this.editing.set(user);
    this.selectedRoles.set([...user.roles]);
    this.modalError.set(null);
    this.form.reset({ firstName: user.firstName, lastName: user.lastName, isActive: user.isActive !== false });
  }

  closeEdit(): void {
    if (!this.busy()) {
      this.editing.set(null);
    }
  }

  toggleRole(role: Role): void {
    this.selectedRoles.update((list) => (list.includes(role) ? list.filter((r) => r !== role) : [...list, role]));
  }

  save(user: User): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.selectedRoles().length === 0) {
      return;
    }
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.modalError.set(null);
    this.admin
      .updateUser(user.id, { roles: this.selectedRoles(), isActive: v.isActive, firstName: v.firstName.trim(), lastName: v.lastName.trim() })
      .subscribe({
        next: (updated) => {
          this.busy.set(false);
          this.editing.set(null);
          this.users.update((list) => list.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
          this.toast.success('Utilisateur mis à jour.');
        },
        error: (err: unknown) => {
          this.busy.set(false);
          this.modalError.set(errorMessage(err));
        },
      });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.admin.users({ q: this.q.trim(), role: this.role, page: this.page(), limit: LIMIT }).subscribe({
      next: (res) => {
        this.users.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
