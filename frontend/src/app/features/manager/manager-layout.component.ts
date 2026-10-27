import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SidebarLayoutComponent, SidebarLink } from '../../shared/components/sidebar-layout/sidebar-layout.component';

@Component({
  selector: 'app-manager-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SidebarLayoutComponent],
  template: `<app-sidebar-layout title="Gestionnaire" [links]="links" />`,
})
export class ManagerLayoutComponent {
  readonly links: SidebarLink[] = [
    { path: '/gestionnaire', label: 'Tableau de bord', icon: '📊', exact: true },
    { path: '/gestionnaire/salles', label: 'Mes salles', icon: '🏢' },
  ];
}
