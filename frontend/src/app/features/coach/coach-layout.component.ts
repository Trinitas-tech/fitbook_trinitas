import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SidebarLayoutComponent, SidebarLink } from '../../shared/components/sidebar-layout/sidebar-layout.component';

@Component({
  selector: 'app-coach-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SidebarLayoutComponent],
  template: `<app-sidebar-layout title="Coach" [links]="links" />`,
})
export class CoachLayoutComponent {
  readonly links: SidebarLink[] = [
    { path: '/coach', label: 'Tableau de bord', icon: '📊', exact: true },
    { path: '/coach/seances', label: 'Mes séances', icon: '📅' },
    { path: '/coach/disponibilites', label: 'Disponibilités', icon: '🕒' },
    { path: '/coach/profil', label: 'Profil pro', icon: '👤' },
    { path: '/coach/avis', label: 'Avis reçus', icon: '⭐' },
  ];
}
