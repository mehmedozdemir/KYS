import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
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
  imports: [FormsModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">Mail Ayarları</h1>
          <p class="page-subtitle">{{ accounts().length }} hesap — giden e-posta (SMTP) yapılandırması</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()"><i class="pi pi-plus"></i> Yeni Hesap</button>
      </div>

      <div class="table-wrapper">
        @if (loading()) {
          <div class="loading-row">Yükleniyor...</div>
        } @else if (!accounts().length) {
          <div class="loading-row">Tanımlı mail hesabı yok. "Yeni Hesap" ile ekleyin.</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr><th>Ad</th><th>Sağlayıcı</th><th>Sunucu</th><th>Gönderen</th><th>Durum</th><th></th></tr>
            </thead>
            <tbody>
              @for (a of accounts(); track a.id) {
                <tr>
                  <td class="name-cell">{{ a.name }}</td>
                  <td>{{ a.provider }}</td>
                  <td class="mono">{{ a.host }}:{{ a.port }} ({{ a.security }})</td>
                  <td>{{ a.fromName ? a.fromName + ' · ' : '' }}{{ a.fromAddress }}</td>
                  <td>
                    @if (a.isActive) { <span class="badge badge--active">Aktif</span> }
                    @else { <button class="link-btn" (click)="activate(a)">Aktif yap</button> }
                  </td>
                  <td class="actions-cell">
                    <button class="icon-btn" title="Test maili" (click)="test(a)"><i class="pi pi-send"></i></button>
                    <button class="icon-btn" title="Düzenle" (click)="openEdit(a)"><i class="pi pi-pencil"></i></button>
                    <button class="icon-btn icon-btn--danger" title="Sil" (click)="remove(a)"><i class="pi pi-trash"></i></button>
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
            <h2>{{ editId() ? 'Hesabı Düzenle' : 'Yeni Mail Hesabı' }}</h2>
            <button class="close-btn" (click)="showModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (error()) { <div class="alert-error">{{ error() }}</div> }
            <div class="form-group">
              <label>Hesap Adı <span class="required">*</span></label>
              <input type="text" [(ngModel)]="form.name" placeholder="ör. Kurumsal Exchange" />
            </div>
            <div class="form-group">
              <label>Sağlayıcı</label>
              <select [(ngModel)]="form.provider" (ngModelChange)="applyPreset($event)">
                <option value="Exchange">Exchange / Office 365</option>
                <option value="Gmail">Gmail</option>
                <option value="Custom">Özel (Custom)</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group" style="flex:2">
                <label>SMTP Sunucusu <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.host" placeholder="smtp.office365.com" />
              </div>
              <div class="form-group" style="flex:1">
                <label>Port</label>
                <input type="number" [(ngModel)]="form.port" />
              </div>
            </div>
            <div class="form-group">
              <label>Güvenlik</label>
              <select [(ngModel)]="form.security">
                <option value="StartTls">STARTTLS (587)</option>
                <option value="SslOnConnect">SSL/TLS (465)</option>
                <option value="None">Yok</option>
              </select>
            </div>
            <div class="form-group">
              <label>Kullanıcı Adı <span class="required">*</span></label>
              <input type="text" [(ngModel)]="form.username" placeholder="kullanici@kurum.com" />
            </div>
            <div class="form-group">
              <label>Parola @if (!editId()) { <span class="required">*</span> } @else { <span class="hint">(değiştirmek için doldurun)</span> }</label>
              <input type="password" [(ngModel)]="form.password" placeholder="••••••••" autocomplete="new-password" />
            </div>
            <div class="form-row">
              <div class="form-group" style="flex:1">
                <label>Gönderen Adresi <span class="required">*</span></label>
                <input type="email" [(ngModel)]="form.fromAddress" placeholder="noreply@kurum.com" />
              </div>
              <div class="form-group" style="flex:1">
                <label>Gönderen Adı</label>
                <input type="text" [(ngModel)]="form.fromName" placeholder="KYS Platform" />
              </div>
            </div>
            @if (!editId()) {
              <label class="checkbox-label"><input type="checkbox" [(ngModel)]="form.makeActive" /> Bu hesabı aktif yap</label>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showModal.set(false)">İptal</button>
            <button class="btn btn-primary" [disabled]="saving()" (click)="save()">{{ saving() ? 'Kaydediliyor...' : 'Kaydet' }}</button>
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
  private base = environment.apiUrl + '/admin/email-accounts';

  accounts = signal<EmailAccount[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editId = signal<string | null>(null);
  error = signal('');

  form = { name: '', provider: 'Exchange', host: 'smtp.office365.com', port: 587, security: 'StartTls', username: '', password: '', fromAddress: '', fromName: '', makeActive: true };

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

  openCreate() {
    this.editId.set(null);
    this.form = { name: '', provider: 'Exchange', host: 'smtp.office365.com', port: 587, security: 'StartTls', username: '', password: '', fromAddress: '', fromName: '', makeActive: true };
    this.error.set('');
    this.showModal.set(true);
  }

  openEdit(a: EmailAccount) {
    this.editId.set(a.id);
    this.form = { name: a.name, provider: a.provider, host: a.host, port: a.port, security: a.security, username: a.username, password: '', fromAddress: a.fromAddress, fromName: a.fromName ?? '', makeActive: a.isActive };
    this.error.set('');
    this.showModal.set(true);
  }

  save() {
    if (!this.form.name || !this.form.host || !this.form.username || !this.form.fromAddress) { this.error.set('Zorunlu alanları doldurun.'); return; }
    if (!this.editId() && !this.form.password) { this.error.set('Parola zorunludur.'); return; }
    this.saving.set(true);
    const body: Record<string, unknown> = {
      name: this.form.name, provider: this.form.provider, host: this.form.host, port: Number(this.form.port),
      security: this.form.security, username: this.form.username, fromAddress: this.form.fromAddress,
      fromName: this.form.fromName || null
    };
    if (this.editId()) {
      body['password'] = this.form.password || null;
      this.http.put(`${this.base}/${this.editId()}`, body).subscribe({
        next: () => { this.saving.set(false); this.showModal.set(false); this.load(); },
        error: e => { this.saving.set(false); this.error.set(e.error?.detail ?? 'Kayıt başarısız.'); }
      });
    } else {
      body['password'] = this.form.password;
      body['makeActive'] = this.form.makeActive;
      this.http.post(this.base, body).subscribe({
        next: () => { this.saving.set(false); this.showModal.set(false); this.load(); },
        error: e => { this.saving.set(false); this.error.set(e.error?.detail ?? 'Kayıt başarısız.'); }
      });
    }
  }

  activate(a: EmailAccount) {
    this.http.post(`${this.base}/${a.id}/activate`, {}).subscribe(() => this.load());
  }

  remove(a: EmailAccount) {
    if (!confirm(`"${a.name}" hesabı silinsin mi?`)) return;
    this.http.delete(`${this.base}/${a.id}`).subscribe(() => this.load());
  }

  test(a: EmailAccount) {
    const to = prompt('Test maili gönderilecek adres:', a.fromAddress);
    if (!to) return;
    this.http.post(`${this.base}/${a.id}/test`, { toEmail: to }).subscribe({
      next: () => this.notify.success('Test maili gönderildi.'),
      error: e => this.notify.error(e.error?.detail ?? 'Test maili gönderilemedi.')
    });
  }
}
