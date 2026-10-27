import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SidebarLayoutComponent, SidebarLink } from '../../shared/components/sidebar-layout/sidebar-layout.component';

@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SidebarLayoutComponent],
  template: `<app-sidebar-layout title="Administration" [links]="links" />`,
})
export class AdminLayoutComponent {
  readonly links: SidebarLink[] = [
    { path: '/admin', label: 'Statistiques', icon: '📊', exact: true },
    { path: '/admin/utilisateurs', label: 'Utilisateurs', icon: '👥' },
    { path: '/admin/coachs', label: 'Coachs', icon: '🎯' },
    { path: '/admin/activites', label: 'Activités', icon: '🏅' },
    { path: '/admin/salles', label: 'Salles', icon: '🏢' },
    { path: '/admin/reservations', label: 'Réservations', icon: '📅' },
    { path: '/admin/avis', label: 'Avis', icon: '⭐' },
  ];
}
