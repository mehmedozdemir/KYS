import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    <div class="toast-container">
      @for (t of notifications.toasts(); track t.id) {
        <div class="toast" [class.toast--error]="t.kind === 'error'" [class.toast--success]="t.kind === 'success'"
             (click)="notifications.dismiss(t.id)">
          <i class="pi" [class.pi-exclamation-triangle]="t.kind === 'error'"
             [class.pi-check-circle]="t.kind === 'success'" [class.pi-info-circle]="t.kind === 'info'"></i>
          <span>{{ t.text }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container { position: fixed; top: 1rem; right: 1rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; }
    .toast { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.875rem;
      background: var(--surface, #fff); color: var(--text-strong, #111); border: 1px solid var(--border-strong, #ddd);
      box-shadow: 0 4px 16px rgba(0,0,0,0.18); cursor: pointer; max-width: 360px; }
    .toast--error { border-left: 4px solid var(--danger, #dc2626); }
    .toast--success { border-left: 4px solid var(--success, #16a34a); }
    .toast i { font-size: 1rem; }
  `]
})
export class AppComponent {
  protected notifications = inject(NotificationService);

  constructor() {
    inject(ThemeService).init();
  }
}
