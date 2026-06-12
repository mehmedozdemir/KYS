import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { selectCurrentUser } from '../../core/store/auth/auth.selectors';
import { TokenService } from '../../core/services/token.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
  template: `
    <div class="page-content account">
      <div class="page-header">
        <h1 class="page-title">{{ 'account.title' | transloco }}</h1>
        <p class="page-subtitle">{{ 'account.subtitle' | transloco }}</p>
      </div>

      <!-- Profil özeti -->
      <div class="card">
        <div class="profile-row">
          <div class="avatar">{{ initials() }}</div>
          <div>
            <div class="profile-name">{{ user()?.fullName ?? '—' }}</div>
            @if (email()) { <div class="profile-email">{{ email() }}</div> }
          </div>
        </div>
        @if (permissions().length) {
          <div class="perm-section">
            <span class="perm-label">{{ 'account.permissions' | transloco }}</span>
            <div class="perm-chips">
              @for (p of permissions(); track p) {
                <span class="perm-chip">{{ p }}</span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Şifre değiştir -->
      <div class="card">
        <h2 class="card-title">{{ 'account.changePassword' | transloco }}</h2>

        @if (success()) {
          <div class="alert-success"><i class="pi pi-check-circle"></i> {{ 'account.success' | transloco }}</div>
        }
        @if (error()) {
          <div class="alert-error">{{ error() }}</div>
        }

        <div class="form-group">
          <label>{{ 'account.currentPassword' | transloco }} <span class="req">*</span></label>
          <input type="password" autocomplete="current-password" [(ngModel)]="form.current"
            [class.input-error]="submitted() && !form.current" />
          @if (submitted() && !form.current) { <span class="field-error">{{ 'account.currentRequired' | transloco }}</span> }
        </div>
        <div class="form-group">
          <label>{{ 'account.newPassword' | transloco }} <span class="req">*</span></label>
          <input type="password" autocomplete="new-password" [(ngModel)]="form.next"
            [class.input-error]="submitted() && form.next.length < 8" />
          @if (submitted() && form.next.length < 8) { <span class="field-error">{{ 'account.newMinLength' | transloco }}</span> }
        </div>
        <div class="form-group">
          <label>{{ 'account.confirmPassword' | transloco }} <span class="req">*</span></label>
          <input type="password" autocomplete="new-password" [(ngModel)]="form.confirm"
            [class.input-error]="submitted() && form.confirm !== form.next" />
          @if (submitted() && form.confirm !== form.next) { <span class="field-error">{{ 'account.passwordsMismatch' | transloco }}</span> }
        </div>

        <button class="btn-primary" [disabled]="saving()" (click)="changePassword()">
          {{ (saving() ? 'common.saving' : 'account.changeButton') | transloco }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .account { max-width: 640px; }
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.25rem; box-shadow: var(--shadow-sm); }
    .card-title { font-size: 1rem; font-weight: 700; color: var(--text-strong); margin-bottom: 1rem; }

    .profile-row { display: flex; align-items: center; gap: 1rem; }
    .avatar { width: 3rem; height: 3rem; border-radius: 50%; background: var(--primary-soft-bg); color: var(--primary-soft-text); display: flex; align-items: center; justify-content: center; font-size: 1.125rem; font-weight: 700; flex-shrink: 0; }
    .profile-name { font-size: 1.0625rem; font-weight: 600; color: var(--text-strong); }
    .profile-email { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.125rem; }

    .perm-section { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--border-light); }
    .perm-label { font-size: 0.75rem; font-weight: 600; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; }
    .perm-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.5rem; }
    .perm-chip { background: var(--surface-3); color: var(--text-muted); padding: 0.15rem 0.55rem; border-radius: 9999px; font-size: 0.7rem; font-family: monospace; }

    .form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; label { font-size: 0.875rem; font-weight: 500; color: var(--text); } input { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; background: var(--surface); color: var(--text-strong); max-width: 320px; &:focus { outline: none; border-color: var(--primary); } } }
    .req { color: var(--danger); }
    .field-error { font-size: 0.75rem; color: var(--danger); }
    .input-error { border-color: var(--danger) !important; }
    .btn-primary { background: var(--primary); color: var(--primary-contrast); border: none; border-radius: 0.5rem; padding: 0.5rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; &:not(:disabled):hover { background: var(--primary-hover); } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .alert-success { padding: 0.75rem 1rem; background: var(--success-soft-bg); color: var(--success-soft-text); border-radius: 0.5rem; font-size: 0.875rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .alert-error { padding: 0.75rem 1rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); color: var(--danger-soft-text); border-radius: 0.5rem; font-size: 0.875rem; margin-bottom: 1rem; }
  `]
})
export class AccountComponent {
  private http = inject(HttpClient);
  private store = inject(Store);
  private token = inject(TokenService);
  private transloco = inject(TranslocoService);

  user = toSignal(this.store.select(selectCurrentUser));
  permissions = computed(() => this.user()?.permissions ?? []);
  email = signal<string>(this.extractEmail());

  initials = computed(() => {
    const name = this.user()?.fullName ?? '';
    return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || '?';
  });

  form = { current: '', next: '', confirm: '' };
  submitted = signal(false);
  saving = signal(false);
  error = signal('');
  success = signal(false);

  private extractEmail(): string {
    const t = this.token.getAccessToken();
    if (!t) return '';
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload['email']
        ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
        ?? '';
    } catch {
      return '';
    }
  }

  changePassword(): void {
    this.submitted.set(true);
    this.error.set('');
    this.success.set(false);
    if (!this.form.current || this.form.next.length < 8 || this.form.confirm !== this.form.next) return;

    this.saving.set(true);
    this.http.post(`${environment.apiUrl}/auth/change-password`, {
      currentPassword: this.form.current,
      newPassword: this.form.next
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        this.submitted.set(false);
        this.form = { current: '', next: '', confirm: '' };
      },
      error: err => {
        this.saving.set(false);
        this.error.set(err.error?.detail ?? this.transloco.translate('account.changeError'));
      }
    });
  }
}
