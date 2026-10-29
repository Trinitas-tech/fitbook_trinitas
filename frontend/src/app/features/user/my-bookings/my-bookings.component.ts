import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Booking, errorMessage } from '../../../core/models';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

type Scope = 'upcoming' | 'past';

@Component({
  selector: 'app-my-bookings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    AlertComponent,
    LoaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="container page">
      <div class="page-header">
        <h1 class="page-title">Mes réservations</h1>
        <a routerLink="/recherche" class="btn btn-primary">Réserver une séance</a>
      </div>

      <div class="tabs" role="tablist">
        <button
          type="button"
          class="tab"
          role="tab"
          [class.active]="scope() === 'upcoming'"
          (click)="setScope('upcoming')"
        >
          À venir
        </button>
        <button
          type="button"
          class="tab"
          role="tab"
          [class.active]="scope() === 'past'"
          (click)="setScope('past')"
        >
          Passées
        </button>
      </div>

      @if (loading()) {
        <app-loader />
      } @else if (error()) {
        <app-alert type="error" [message]="error()" />
      } @else if (bookings().length === 0) {
        <app-empty-state
          icon="📅"
          [title]="
            scope() === 'upcoming' ? 'Aucune réservation à venir' : 'Aucune réservation passée'
          "
          [message]="scope() === 'upcoming' ? 'Trouvez une séance et réservez votre place !' : null"
        >
          @if (scope() === 'upcoming') {
            <a routerLink="/recherche" class="btn btn-primary btn-sm mt-16"
              >Rechercher une séance</a
            >
          }
        </app-empty-state>
      } @else {
        <div class="grid">
          @for (b of bookings(); track b.id) {
            <article class="card booking">
              <div class="flex between">
                <app-status-badge kind="booking" [status]="b.status" />
                <span class="muted small">Réservé le {{ b.bookedAt | date: 'd MMM yyyy' }}</span>
              </div>
              <h3 style="margin: 10px 0 2px">
                @if (b.session.course) {
                  <a [routerLink]="['/cours', b.session.course.id]">{{ b.session.course.title }}</a>
                } @else if (b.session.coach) {
                  <a [routerLink]="['/coachs', b.session.coach.id]"
                    >Séance avec {{ b.session.coach.firstName }} {{ b.session.coach.lastName }}</a
                  >
                } @else {
                  Séance
                }
              </h3>
              <p class="when">{{ b.session.startAt | date: 'EEEE d MMMM yyyy' }}</p>
              <p class="muted" style="margin: 0">
                {{ b.session.startAt | date: 'HH:mm' }} – {{ b.session.endAt | date: 'HH:mm' }}
                @if (b.session.course?.gym) {
                  · 🏢 {{ b.session.course!.gym.name }}
                } @else if (b.session.location) {
                  · 📍 {{ b.session.location }}
                }
              </p>
              <p class="muted small" style="margin: 4px 0 0">
                {{ b.seats }} place{{ b.seats > 1 ? 's' : '' }} ·
                {{ b.session.price * b.seats | currency: 'EUR' : 'symbol' : '1.0-2' }}
              </p>
              @if (b.qrCode) {
                <div class="qr">
                  @if (b.status === 'confirmee' && qrSrc(b); as src) {
                    <button
                      type="button"
                      class="qr-img"
                      (click)="qrOpen.set(b)"
                      title="Agrandir le QR code"
                      aria-label="Agrandir le QR code"
                    >
                      <img
                        [src]="src"
                        width="140"
                        height="140"
                        alt="QR code de la réservation {{ b.qrCode }}"
                      />
                    </button>
                  }
                  <span class="muted small">Code d'accès</span>
                  <code>{{ b.qrCode }}</code>
                </div>
              }
              @if (b.canBeCancelled) {
                <div class="form-actions">
                  <button type="button" class="btn btn-outline btn-sm" (click)="toCancel.set(b)">
                    Annuler
                  </button>
                </div>
              }
            </article>
          }
        </div>
      }

      <!-- US-22 : QR code en grand -->
      @if (qrOpen(); as b) {
        <div class="modal-backdrop" (click)="qrOpen.set(null)">
          <div
            class="modal qr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-title"
            (click)="$event.stopPropagation()"
          >
            <h3 class="modal-title" id="qr-title">À présenter à l'entrée</h3>
            <p class="muted small" style="margin-bottom: 16px">
              @if (b.session.course) {
                {{ b.session.course.title }} ·
              }
              {{ b.session.startAt | date: 'EEEE d MMMM yyyy à HH:mm' }}
            </p>
            @if (qrSrc(b); as src) {
              <img
                class="qr-large"
                [src]="src"
                width="300"
                height="300"
                alt="QR code de la réservation {{ b.qrCode }}"
              />
            }
            <code class="qr-code">{{ b.qrCode }}</code>
            <div class="form-actions" style="justify-content: center">
              <button type="button" class="btn btn-outline" (click)="qrOpen.set(null)">
                Fermer
              </button>
            </div>
          </div>
        </div>
      }

      @if (toCancel(); as b) {
        <app-confirm-dialog
          title="Annuler la réservation ?"
          [message]="
            'Votre place pour la séance du ' +
            (b.session.startAt | date: 'd MMMM à HH:mm') +
            ' sera libérée. Cette action est irréversible.'
          "
          confirmLabel="Oui, annuler"
          [danger]="true"
          [busy]="cancelling()"
          (confirm)="cancel(b)"
          (cancel)="toCancel.set(null)"
        />
      }
    </div>
  `,
  styles: `
    .booking {
      display: flex;
      flex-direction: column;
    }
    .when {
      margin: 0;
      font-weight: 600;
      text-transform: capitalize;
    }
    .qr {
      margin-top: 12px;
      background: var(--color-bg);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
    }
    .qr code {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      word-break: break-all;
    }
    .qr-img {
      align-self: center;
      background: #fff;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 6px;
      margin-bottom: 8px;
      cursor: zoom-in;
      transition: box-shadow 0.15s;
    }
    .qr-img:hover {
      box-shadow: var(--shadow-hover);
    }
    .qr-img img {
      width: 140px;
      height: 140px;
      border-radius: 8px;
    }
    .qr-modal {
      max-width: 400px;
      text-align: center;
    }
    .qr-large {
      width: 300px;
      max-width: 100%;
      height: auto;
      margin: 0 auto 12px;
      background: #fff;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 8px;
    }
    .qr-code {
      display: block;
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      margin-bottom: 8px;
      word-break: break-all;
    }
    .form-actions {
      margin-top: auto;
      padding-top: 12px;
    }
  `,
})
export class MyBookingsComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);
  /** Cache des data URI « approuvées » (évite de recréer un SafeUrl à chaque rendu). */
  private readonly qrCache = new Map<string, SafeUrl>();

  readonly scope = signal<Scope>('upcoming');
  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly toCancel = signal<Booking | null>(null);
  readonly cancelling = signal(false);
  /** US-22 : réservation dont le QR code est affiché en grand. */
  readonly qrOpen = signal<Booking | null>(null);

  ngOnInit(): void {
    this.load();
  }

  @HostListener('document:keydown.escape')
  closeQr(): void {
    this.qrOpen.set(null);
  }

  /**
   * US-22 : Angular n'autorise pas `data:image/svg+xml` dans `[src]` par défaut ;
   * la data URI vient de notre API, on la déclare sûre (SVG généré côté serveur).
   */
  qrSrc(booking: Booking): SafeUrl | null {
    const uri = booking.qrCodeDataUri;
    if (!uri || !uri.startsWith('data:image/svg+xml')) {
      return null;
    }
    let safe = this.qrCache.get(uri);
    if (!safe) {
      safe = this.sanitizer.bypassSecurityTrustUrl(uri);
      this.qrCache.set(uri, safe);
    }
    return safe;
  }

  setScope(scope: Scope): void {
    if (this.scope() !== scope) {
      this.scope.set(scope);
      this.load();
    }
  }

  cancel(booking: Booking): void {
    this.cancelling.set(true);
    this.bookingService.cancel(booking.id).subscribe({
      next: (updated) => {
        this.cancelling.set(false);
        this.toCancel.set(null);
        this.bookings.update((list) => list.map((b) => (b.id === updated.id ? updated : b)));
        this.toast.success('Réservation annulée. Un e-mail de confirmation vous a été envoyé.');
      },
      error: (err: unknown) => {
        this.cancelling.set(false);
        this.toCancel.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.bookingService.mine(this.scope()).subscribe({
      next: (list) => {
        const sorted = [...list].sort((a, b) => {
          const diff =
            new Date(a.session.startAt).getTime() - new Date(b.session.startAt).getTime();
          return this.scope() === 'upcoming' ? diff : -diff;
        });
        this.bookings.set(sorted);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
