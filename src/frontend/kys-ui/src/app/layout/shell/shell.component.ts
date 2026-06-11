import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { SessionTimeoutService } from '../../core/services/session-timeout.service';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="shell">
      <app-sidebar />
      @if (layout.mobileOpen()) {
        <div class="shell__backdrop" (click)="layout.closeMobile()"></div>
      }
      <div class="shell__main">
        <app-topbar />
        <main class="shell__content">
          <router-outlet />
        </main>
      </div>
    </div>

    @if (sessionTimeout.showWarning()) {
      <div class="timeout-backdrop">
        <div class="timeout-modal">
          <div class="timeout-icon">
            <i class="pi pi-clock"></i>
          </div>
          <h2 class="timeout-title">Oturum Süresi Dolmak Üzere</h2>
          <p class="timeout-body">
            Oturumunuz <strong>{{ sessionTimeout.secondsRemaining() }}</strong> saniye içinde sona erecek.
            Devam etmek istiyor musunuz?
          </p>
          <div class="timeout-actions">
            <button class="btn-logout" (click)="sessionTimeout.logout()">
              <i class="pi pi-sign-out"></i> Çıkış Yap
            </button>
            <button class="btn-extend" (click)="sessionTimeout.extendSession()">
              <i class="pi pi-refresh"></i> Devam Et
            </button>
          </div>
        </div>
      </div>
    }
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
      background: var(--bg);
    }
    .shell__backdrop {
      position: fixed; inset: 0; z-index: 1090;
      background: rgba(0, 0, 0, 0.45);
    }
    @media (min-width: 1024px) {
      .shell__backdrop { display: none; }
    }

    .timeout-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .timeout-modal {
      background: var(--surface);
      border-radius: 1rem;
      padding: 2rem;
      width: 100%;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
    }
    .timeout-icon {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: var(--warning-soft-bg);
      color: var(--warning-strong);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin: 0 auto 1.25rem;
    }
    .timeout-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-strong);
      margin: 0 0 0.75rem;
    }
    .timeout-body {
      font-size: 0.9375rem;
      color: var(--text-muted);
      margin: 0 0 1.5rem;
      line-height: 1.6;
      strong { color: var(--warning-strong); font-size: 1.125rem; }
    }
    .timeout-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
    .btn-logout {
      padding: 0.625rem 1.25rem;
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text);
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      &:hover { background: var(--surface-2); }
    }
    .btn-extend {
      padding: 0.625rem 1.25rem;
      border: none;
      background: var(--primary);
      color: white;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      &:hover { background: var(--primary-hover); }
    }
  `]
})
export class ShellComponent implements OnInit {
  readonly sessionTimeout = inject(SessionTimeoutService);
  readonly layout = inject(LayoutService);

  ngOnInit(): void {
    // Schedule on init to handle page-refresh session restores
    this.sessionTimeout.schedule();
  }
}
