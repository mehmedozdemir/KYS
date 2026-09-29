import { Component, HostListener, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ConfirmDialogService } from './core/services/confirm-dialog.service';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { NotificationService } from './core/services/notification.service';
import { BrandingService } from './core/services/branding.service';
import { Store } from '@ngrx/store';
import { TokenService } from './core/services/token.service';
import { AuthUser } from './core/models/auth.models';
import { restoreSession } from './core/store/auth/auth.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslocoModule],
  template: `
    <router-outlet />
    @if (confirmDialog.pending(); as pending) {
      <div class="confirm-backdrop" (click)="confirmDialog.close(false)" (keydown.escape)="confirmDialog.close(false)">
        <div class="confirm-dialog" role="alertdialog" aria-modal="true" [attr.aria-label]="'common.areYouSure' | transloco"
             (click)="$event.stopPropagation()">
          <div class="confirm-icon"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="confirm-body">
            <h2>{{ 'common.areYouSure' | transloco }}</h2>
            <p>{{ pending.message }}</p>
          </div>
          <div class="confirm-actions">
            <button type="button" class="confirm-btn confirm-btn--secondary" (click)="confirmDialog.close(false)">{{ 'common.cancel' | transloco }}</button>
            <button type="button" class="confirm-btn confirm-btn--danger" (click)="confirmDialog.close(true)" autofocus>{{ 'common.confirm' | transloco }}</button>
          </div>
        </div>
      </div>
    }
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

    .confirm-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 10000;
      display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .confirm-dialog { background: var(--surface, #fff); color: var(--text, #111); border: 1px solid var(--border, #ddd);
      border-radius: 0.75rem; box-shadow: 0 20px 60px rgba(0,0,0,0.35); width: 100%; max-width: 440px;
      padding: 1.5rem; display: grid; grid-template-columns: auto 1fr; gap: 0.75rem 1rem; }
    .confirm-icon { width: 2.5rem; height: 2.5rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center;
      background: color-mix(in srgb, var(--danger, #dc2626) 15%, transparent); color: var(--danger, #dc2626); }
    .confirm-body h2 { margin: 0 0 0.375rem; font-size: 1rem; font-weight: 600; color: var(--text-strong, #111); }
    .confirm-body p { margin: 0; font-size: 0.875rem; line-height: 1.5; color: var(--text-muted, #555); white-space: pre-line; }
    .confirm-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
    .confirm-btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: 1px solid transparent; }
    .confirm-btn--secondary { background: transparent; color: var(--text, #111); border-color: var(--border-strong, #ccc); }
    .confirm-btn--danger { background: var(--danger, #dc2626); color: #fff; }
    .confirm-btn:focus-visible { outline: 2px solid var(--primary, #3b82f6); outline-offset: 2px; }
  `]
})
export class AppComponent {
  protected notifications = inject(NotificationService);
  protected confirmDialog = inject(ConfirmDialogService);

  // Esc ile iptal (odak diyalog dışında olsa bile).
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.confirmDialog.pending()) this.confirmDialog.close(false);
  }

  constructor() {
    inject(ThemeService).init();
    inject(BrandingService).load();

    // F5 sonrası store boş başlar; oturum hâlâ geçerliyse kullanıcıyı (güncel token'larla) geri yükle.
    const tokens = inject(TokenService);
    const user = tokens.getUser<AuthUser>();
    if (user && tokens.isLoggedIn()) {
      inject(Store).dispatch(restoreSession({
        user: { ...user, accessToken: tokens.getAccessToken()!, refreshToken: tokens.getRefreshToken() ?? user.refreshToken }
      }));
    }
  }
}
