import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomTabsComponent } from './shared/components/bottom-tabs/bottom-tabs.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastsComponent } from './shared/components/toasts/toasts.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarComponent, BottomTabsComponent, ToastsComponent],
  template: `
    <div class="aurora" aria-hidden="true"></div>
    <app-navbar />
    <router-outlet />
    <app-bottom-tabs />
    <app-toasts />
  `,
})
export class App {}
