import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Sous-navigation d'une salle : fiche / cours / réservations / avis. */
@Component({
  selector: 'app-manager-gym-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="tabs" aria-label="Sections de la salle">
      <a class="tab" [routerLink]="['/gestionnaire/salles', gymId()]" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Fiche</a>
      <a class="tab" [routerLink]="['/gestionnaire/salles', gymId(), 'cours']" routerLinkActive="active">Cours</a>
      <a class="tab" [routerLink]="['/gestionnaire/salles', gymId(), 'reservations']" routerLinkActive="active">Réservations</a>
      <a class="tab" [routerLink]="['/gestionnaire/salles', gymId(), 'avis']" routerLinkActive="active">Avis</a>
    </nav>
  `,
  styles: `
    .tab:hover {
      text-decoration: none;
    }
  `,
})
export class ManagerGymNavComponent {
  readonly gymId = input.required<number>();
}
