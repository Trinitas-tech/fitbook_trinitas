import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Review, errorMessage } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import { AlertComponent } from '../alert/alert.component';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';

/** Formulaire de publication d'un avis sur une salle ou un coach. */
@Component({
  selector: 'app-review-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, RatingStarsComponent],
  template: `
    <div class="card">
      <h3>{{ heading() }}</h3>
      @if (!auth.isLoggedIn()) {
        <p class="muted">
          <a [routerLink]="['/connexion']" [queryParams]="{ redirect: router.url }">Connectez-vous</a> pour publier un avis.
          Un avis n'est possible qu'après une réservation terminée.
        </p>
      } @else if (success()) {
        <app-alert type="success" message="Merci ! Votre avis a bien été publié." />
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <app-alert type="error" [message]="error()" />
          <div class="field">
            <span class="label">Votre note</span>
            <app-rating-stars [rating]="form.controls.rating.value" [editable]="true" [showValue]="false" (ratingChange)="form.controls.rating.setValue($event)" />
            @if (form.controls.rating.touched && form.controls.rating.invalid) {
              <span class="field-error">Choisissez une note de 1 à 5.</span>
            }
          </div>
          <div class="field">
            <label class="label" for="review-comment">Votre commentaire</label>
            <textarea id="review-comment" class="input" formControlName="comment" placeholder="Partagez votre expérience…"></textarea>
            @if (form.controls.comment.touched && form.controls.comment.invalid) {
              <span class="field-error">Le commentaire doit contenir entre 10 et 1000 caractères.</span>
            }
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="busy()">
            {{ busy() ? 'Envoi…' : 'Publier mon avis' }}
          </button>
        </form>
      }
    </div>
  `,
})
export class ReviewFormComponent {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  private readonly reviews = inject(ReviewService);
  private readonly fb = inject(FormBuilder);

  readonly gymId = input<number | null>(null);
  readonly coachId = input<number | null>(null);
  readonly heading = input('Donner votre avis');
  readonly published = output<Review>();

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  readonly form = this.fb.nonNullable.group({
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const { rating, comment } = this.form.getRawValue();
    this.reviews
      .create({
        rating,
        comment,
        gymId: this.gymId() ?? undefined,
        coachId: this.coachId() ?? undefined,
      })
      .subscribe({
        next: (review) => {
          this.busy.set(false);
          this.success.set(true);
          this.published.emit(review);
        },
        error: (err: unknown) => {
          this.busy.set(false);
          this.error.set(errorMessage(err));
        },
      });
  }
}
