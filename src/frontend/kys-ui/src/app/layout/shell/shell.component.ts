import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="shell">
      <app-sidebar />
      <div class="shell__main">
        <app-topbar />
        <main class="shell__content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .shell__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .shell__content {
      flex: 1;
      overflow-y: auto;
      background: #F9FAFB;
    }
  `]
})
export class ShellComponent {}
