import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';

interface EmailAccount {
  id: string;
  name: string;
  provider: string;   // Exchange | Gmail | Custom
  host: string;
  port: number;
  security: string;   // None | StartTls | SslOnConnect
  username: string;
  fromAddress: string;
  fromName: string | null;
  acceptAllCertificates: boolean;
  isActive: boolean;
}

const PRESETS: Record<string, { host: string; port: number; security: string }> = {
  Exchange: { host: 'smtp.office365.com', port: 587, security: 'StartTls' },
  Gmail:    { host: 'smtp.gmail.com',     port: 587, security: 'StartTls' },
  Custom:   { host: '',                   port: 587, security: 'StartTls' }
};

@Component({
  selector: 'app-email-accounts',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'admin.emailAccounts.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'admin.emailAccounts.subtitle' | transloco:{ count: accounts().length } }}</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()"><i class="pi pi-plus"></i> {{ 'admin.emailAccounts.newAccount' | transloco }}</button>
      </div>

      <div class="table-wrapper">
        @if (loading()) {
          <div class="loading-row">{{ 'common.loading' | transloco }}</div>
        } @else if (!accounts().length) {
          <div class="loading-row">{{ 'admin.emailAccounts.emptyNone' | transloco }}</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr><th>{{ 'admin.emailAccounts.colName' | transloco }}</th><th>{{ 'admin.emailAccounts.colProvider' | transloco }}</th><th>{{ 'admin.emailAccounts.colServer' | transloco }}</th><th>{{ 'admin.emailAccounts.colSender' | transloco }}</th><th>{{ 'admin.emailAccounts.colStatus' | transloco }}</th><th></th></tr>
            </thead>
            <tbody>
              @for (a of accounts(); track a.id) {
                <tr>
                  <td class="name-cell">{{ a.name }}</td>
                  <td>{{ a.provider }}</td>
                  <td class="mono">{{ a.host }}:{{ a.port }} ({{ a.security }})</td>
                  <td>{{ a.fromName ? a.fromName + ' · ' : '' }}{{ a.fromAddress }}</td>
                  <td>
                    @if (a.isActive) { <span class="badge badge--active">{{ 'admin.emailAccounts.active' | transloco }}</span> }
                    @else { <button class="link-btn" (click)="activate(a)">{{ 'admin.emailAccounts.makeActive' | transloco }}</button> }
                  </td>
                  <td class="actions-cell">
                    <button class="icon-btn" [title]="'admin.emailAccounts.testTitle' | transloco" (click)="test(a)"><i class="pi pi-send"></i></button>
                    <button class="icon-btn" [title]="'admin.emailAccounts.editTitle' | transloco" (click)="openEdit(a)"><i class="pi pi-pencil"></i></button>
                    <button class="icon-btn icon-btn--danger" [title]="'admin.emailAccounts.deleteTitle' | transloco" (click)="remove(a)"><i class="pi pi-trash"></i></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-backdrop" (click)="showModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ (editId() ? 'admin.emailAccounts.editModalTitle' : 'admin.emailAccounts.newModalTitle') | transloco }}</h2>
            <button class="close-btn" (click)="showModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (error()) { <div class="alert-error">{{ error() }}</div> }
            <div class="form-group">
              <label>{{ 'admin.emailAccounts.accountName' | transloco }} <span class="required">*</span></label>
              <input type="text" [(ngModel)]="form.name" [placeholder]="'admin.emailAccounts.accountNamePh' | transloco" />
            </div>
            <div class="form-group">
              <label>{{ 'admin.emailAccounts.provider' | transloco }}</label>
              <select [(ngModel)]="form.provider" (ngModelChange)="applyPreset($event)">
                <option value="Exchange">{{ 'admin.emailAccounts.providerExchange' | transloco }}</option>
                <option value="Gmail">{{ 'admin.emailAccounts.providerGmail' | transloco }}</option>
                <option value="Custom">{{ 'admin.emailAccounts.providerCustom' | transloco }}</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group" style="flex:2">
                <label>{{ 'admin.emailAccounts.smtpServer' | transloco }} <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.host" placeholder="smtp.office365.com" />
              </div>
              <div class="form-group" style="flex:1">
                <label>{{ 'admin.emailAccounts.port' | transloco }}</label>
                <input type="number" [(ngModel)]="form.port" />
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'admin.emailAccounts.security' | transloco }}</label>
              <select [(ngModel)]="form.security">
                <option value="StartTls">{{ 'admin.emailAccounts.securityStartTls' | transloco }}</option>
                <option value="SslOnConnect">{{ 'admin.emailAccounts.securitySsl' | transloco }}</option>
                <option value="None">{{ 'admin.emailAccounts.securityNone' | transloco }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ 'admin.emailAccounts.username' | transloco }} <span class="required">*</span></label>
              <div style="display:flex;gap:0.5rem">
                <input type="text" [(ngModel)]="form.username" placeholder="kullanici@kurum.com" style="flex:1" />
                <button type="button" class="btn-secondary" [disabled]="discovering()" (click)="discover()" [title]="'admin.emailAccounts.findSettingsTitle' | transloco">
                  {{ discovering() ? '...' : ('admin.emailAccounts.findSettings' | transloco) }}
                </button>
              </div>
              @if (discoverHint()) { <span style="display:block;font-size:0.75rem;margin-top:0.25rem;color:var(--success-soft-text)">✓ {{ discoverHint() }}</span> }
            </div>
            <div class="form-group">
              <label>{{ 'admin.emailAccounts.password' | transloco }} @if (!editId()) { <span class="required">*</span> } @else { <span class="hint">{{ 'admin.emailAccounts.passwordEditHint' | transloco }}</span> }</label>
              <input type="password" [(ngModel)]="form.password" placeholder="••••••••" autocomplete="new-password" />
            </div>
            <div class="form-row">
              <div class="form-group" style="flex:1">
                <label>{{ 'admin.emailAccounts.fromAddress' | transloco }} <span class="required">*</span></label>
                <input type="email" [(ngModel)]="form.fromAddress" placeholder="noreply@kurum.com" />
              </div>
              <div class="form-group" style="flex:1">
                <label>{{ 'admin.emailAccounts.fromName' | transloco }}</label>
                <input type="text" [(ngModel)]="form.fromName" placeholder="KYS Platform" />
              </div>
            </div>
            <label class="checkbox-label"><input type="checkbox" [(ngModel)]="form.acceptAllCertificates" /> {{ 'admin.emailAccounts.skipCertValidation' | transloco }}</label>
            @if (!editId()) {
              <label class="checkbox-label"><input type="checkbox" [(ngModel)]="form.makeActive" /> {{ 'admin.emailAccounts.makeActiveToggle' | transloco }}</label>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showModal.set(false)">{{ 'common.cancel' | transloco }}</button>
            <button class="btn btn-primary" [disabled]="saving()" (click)="save()">{{ (saving() ? 'common.saving' : 'common.save') | transloco }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }
    .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; box-shadow: var(--shadow-sm); }
    .loading-row { padding: 2.5rem; text-align: center; color: var(--text-subtle); font-size: 0.875rem; }
    .data-table { width: 100%; border-collapse: collapse;
      th { background: var(--surface-2); padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); }
      td { padding: 0.75rem; font-size: 0.875rem; color: var(--text); border-bottom: 1px solid var(--border-light); }
      tr:last-child td { border-bottom: none; } }
    .name-cell { font-weight: 500; color: var(--text-strong); }
    .mono { font-family: monospace; font-size: 0.8125rem; color: var(--text-muted); }
    .actions-cell { text-align: right; white-space: nowrap; }
    .badge { display: inline-flex; padding: 0.125rem 0.55rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 600; }
    .badge--active { background: var(--success-soft-bg); color: var(--success-soft-text); }
    .link-btn { background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.8125rem; padding: 0; }
    .icon-btn { background: none; border: none; cursor: pointer; padding: 0.375rem; border-radius: 0.375rem; color: var(--text-muted); &:hover { background: var(--hover); color: var(--text); } }
    .icon-btn--danger:hover { background: var(--danger-faint-bg); color: var(--danger); }
    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary); color: var(--primary-contrast); &:not(:disabled):hover { background: var(--primary-hover); } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--hover); } }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 560px; box-shadow: var(--shadow-lg); max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; font-size: 1rem; &:hover { color: var(--text); } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; }
    .form-row { display: flex; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: var(--text); } input, select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; background: var(--surface); color: var(--text-strong); &:focus { outline: none; border-color: var(--primary); } } }
    .required { color: var(--danger); }
    .hint { font-weight: 400; font-size: 0.75rem; color: var(--text-subtle); }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text); cursor: pointer; input { width: auto; } }
    .alert-error { padding: 0.75rem 1rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.5rem; color: var(--danger-soft-text); font-size: 0.875rem; }
  `]
})
export class EmailAccountsComponent implements OnInit {
  private http = inject(HttpClient);
  private notify = inject(NotificationService);
  private transloco = inject(TranslocoService);
  private base = environment.apiUrl + '/admin/email-accounts';

  accounts = signal<EmailAccount[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editId = signal<string | null>(null);
  error = signal('');
  discovering = signal(false);
  discoverHint = signal('');

  form = { name: '', provider: 'Exchange', host: 'smtp.office365.com', port: 587, security: 'StartTls', username: '', password: '', fromAddress: '', fromName: '', acceptAllCertificates: false, makeActive: true };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<EmailAccount[]>(this.base).subscribe({
      next: a => { this.accounts.set(a); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyPreset(provider: string) {
    const p = PRESETS[provider];
    if (p) { this.form.host = p.host; this.form.port = p.port; this.form.security = p.security; }
  }

  discover() {
    const email = (this.form.username || '').trim();
    if (!email.includes('@')) { this.error.set(this.transloco.translate('admin.emailAccounts.discoverNoEmail')); return; }
    this.discovering.set(true);
    this.discoverHint.set('');
    this.error.set('');
    this.http.get<{ provider: string; host: string; port: number; security: string; source: string }>(
      `${this.base}/discover`, { params: { email } }).subscribe({
      next: r => {
        this.form.provider = r.provider;
        this.form.host = r.host;
        this.form.port = r.port;
        this.form.security = r.security;
        if (!this.form.fromAddress) this.form.fromAddress = email;
        this.discovering.set(false);
        this.discoverHint.set(r.source);
      },
      error: e => { this.discovering.set(false); this.error.set(e.error?.detail ?? this.transloco.translate('admin.emailAccounts.settingsNotFound')); }
    });
  }

  openCreate() {
    this.editId.set(null);
    this.form = { name: '', provider: 'Exchange', host: 'smtp.office365.com', port: 587, security: 'StartTls', username: '', password: '', fromAddress: '', fromName: '', acceptAllCertificates: false, makeActive: true };
    this.error.set('');
    this.discoverHint.set('');
    this.showModal.set(true);
  }

  openEdit(a: EmailAccount) {
    this.editId.set(a.id);
    this.form = { name: a.name, provider: a.provider, host: a.host, port: a.port, security: a.security, username: a.username, password: '', fromAddress: a.fromAddress, fromName: a.fromName ?? '', acceptAllCertificates: a.acceptAllCertificates, makeActive: a.isActive };
    this.error.set('');
    this.discoverHint.set('');
    this.showModal.set(true);
  }

  save() {
    if (!this.form.name || !this.form.host || !this.form.username || !this.form.fromAddress) { this.error.set(this.transloco.translate('admin.emailAccounts.requiredFields')); return; }
    if (!this.editId() && !this.form.password) { this.error.set(this.transloco.translate('admin.emailAccounts.passwordRequired')); return; }
    this.saving.set(true);
    const body: Record<string, unknown> = {
      name: this.form.name, provider: this.form.provider, host: this.form.host, port: Number(this.form.port),
      security: this.form.security, username: this.form.username, fromAddress: this.form.fromAddress,
      fromName: this.form.fromName || null, acceptAllCertificates: this.form.acceptAllCertificates
    };
    if (this.editId()) {
      body['password'] = this.form.password || null;
      this.http.put(`${this.base}/${this.editId()}`, body).subscribe({
        next: () => { this.saving.set(false); this.showModal.set(false); this.load(); },
        error: e => { this.saving.set(false); this.error.set(e.error?.detail ?? this.transloco.translate('admin.emailAccounts.saveFailed')); }
      });
    } else {
      body['password'] = this.form.password;
      body['makeActive'] = this.form.makeActive;
      this.http.post(this.base, body).subscribe({
        next: () => { this.saving.set(false); this.showModal.set(false); this.load(); },
        error: e => { this.saving.set(false); this.error.set(e.error?.detail ?? this.transloco.translate('admin.emailAccounts.saveFailed')); }
      });
    }
  }

  activate(a: EmailAccount) {
    this.http.post(`${this.base}/${a.id}/activate`, {}).subscribe(() => this.load());
  }

  remove(a: EmailAccount) {
    if (!confirm(this.transloco.translate('admin.emailAccounts.deleteConfirm', { name: a.name }))) return;
    this.http.delete(`${this.base}/${a.id}`).subscribe(() => this.load());
  }

  test(a: EmailAccount) {
    const to = prompt(this.transloco.translate('admin.emailAccounts.testPrompt'), a.fromAddress);
    if (!to) return;
    this.http.post(`${this.base}/${a.id}/test`, { toEmail: to }).subscribe({
      next: () => this.notify.success(this.transloco.translate('admin.emailAccounts.testSent')),
      error: e => this.notify.error(e.error?.detail ?? this.transloco.translate('admin.emailAccounts.testFailed'))
    });
  }
}
