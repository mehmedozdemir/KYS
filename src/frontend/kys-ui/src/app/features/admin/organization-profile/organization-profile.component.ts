import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { BrandingService, Branding } from '../../../core/services/branding.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-organization-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">Kurum Profili</h1>
          <p class="page-subtitle">Şirket bilgileri ve logo — login, menü, sayfa başlığı ve maillerde kullanılır</p>
        </div>
      </div>

      <div class="profile-grid">
        <!-- Logo kartı -->
        <div class="card">
          <h3 class="card-title">Logo</h3>
          <div class="logo-box">
            @if (logoUrl()) {
              <img [src]="logoUrl()" alt="logo" class="logo-preview" />
            } @else {
              <div class="logo-empty"><i class="pi pi-image"></i><span>Logo yok</span></div>
            }
          </div>
          <input type="file" #fileInput accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif" (change)="onFile($event)" hidden />
          <div class="logo-actions">
            <button class="btn btn-secondary" [disabled]="uploading()" (click)="fileInput.click()">
              <i class="pi pi-upload"></i> {{ uploading() ? 'Yükleniyor...' : 'Logo Yükle' }}
            </button>
            @if (logoUrl()) {
              <button class="btn btn-secondary" (click)="removeLogo()"><i class="pi pi-trash"></i> Kaldır</button>
            }
          </div>
          <span class="hint">Şeffaf zeminli PNG/SVG önerilir. En fazla 2 MB.</span>
        </div>

        <!-- Bilgi formu -->
        <div class="card">
          <h3 class="card-title">Şirket Bilgileri</h3>
          @if (error()) { <div class="alert-error">{{ error() }}</div> }
          <div class="form-grid">
            <div class="form-group span-2">
              <label>Şirket Adı <span class="req">*</span></label>
              <input type="text" [(ngModel)]="form.companyName" placeholder="Asis Elektronik A.Ş." />
            </div>
            <div class="form-group">
              <label>Kısa / Görünen Ad</label>
              <input type="text" [(ngModel)]="form.shortName" placeholder="Asis" />
            </div>
            <div class="form-group">
              <label>Web Sitesi</label>
              <input type="text" [(ngModel)]="form.website" placeholder="https://www.sirket.com" />
            </div>
            <div class="form-group span-2">
              <label>Slogan</label>
              <input type="text" [(ngModel)]="form.slogan" placeholder="Login ekranında görünür" />
            </div>
            <div class="form-group">
              <label>İletişim E-postası</label>
              <input type="email" [(ngModel)]="form.contactEmail" placeholder="info@sirket.com" />
            </div>
            <div class="form-group">
              <label>Telefon</label>
              <input type="text" [(ngModel)]="form.contactPhone" placeholder="+90 ..." />
            </div>
            <div class="form-group span-2">
              <label>Adres</label>
              <input type="text" [(ngModel)]="form.address" />
            </div>
            <div class="form-group">
              <label>Vergi No / MERSİS</label>
              <input type="text" [(ngModel)]="form.taxNumber" />
            </div>
          </div>
          <div class="form-footer">
            <button class="btn btn-primary" [disabled]="saving()" (click)="save()">{{ saving() ? 'Kaydediliyor...' : 'Kaydet' }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }
    .profile-grid { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; align-items: start; }
    @media (max-width: 820px) { .profile-grid { grid-template-columns: 1fr; } }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; box-shadow: var(--shadow-sm); }
    .card-title { font-size: 0.9375rem; font-weight: 700; color: var(--text-strong); margin: 0 0 1rem; }
    .logo-box { display: flex; align-items: center; justify-content: center; height: 120px; background: var(--surface-2); border-radius: 0.5rem; margin-bottom: 0.875rem; overflow: hidden; }
    .logo-preview { max-height: 100px; max-width: 100%; object-fit: contain; }
    .logo-empty { display: flex; flex-direction: column; align-items: center; gap: 0.375rem; color: var(--text-subtle); font-size: 0.8125rem; i { font-size: 1.5rem; } }
    .logo-actions { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .hint { font-size: 0.75rem; color: var(--text-subtle); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
    .span-2 { grid-column: 1 / -1; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: var(--text); } input { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; background: var(--surface); color: var(--text-strong); &:focus { outline: none; border-color: var(--primary); } } }
    .req { color: var(--danger); }
    .form-footer { margin-top: 1.25rem; display: flex; justify-content: flex-end; }
    .alert-error { padding: 0.75rem 1rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.5rem; color: var(--danger-soft-text); font-size: 0.875rem; margin-bottom: 1rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary); color: var(--primary-contrast); &:not(:disabled):hover { background: var(--primary-hover); } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--hover); } }
  `]
})
export class OrganizationProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private branding = inject(BrandingService);
  private notify = inject(NotificationService);
  private base = environment.apiUrl + '/branding';

  saving = signal(false);
  uploading = signal(false);
  error = signal('');
  private logoVersion = signal(0);
  private hasLogo = signal(false);

  form = { companyName: '', shortName: '', website: '', slogan: '', contactEmail: '', contactPhone: '', address: '', taxNumber: '' };

  logoUrl = () => this.hasLogo() ? `${this.base}/logo?v=${this.logoVersion()}` : null;

  ngOnInit() {
    this.http.get<Branding>(this.base).subscribe(b => {
      this.form = {
        companyName: b.companyName ?? '', shortName: b.shortName ?? '', website: b.website ?? '',
        slogan: b.slogan ?? '', contactEmail: b.contactEmail ?? '', contactPhone: b.contactPhone ?? '',
        address: b.address ?? '', taxNumber: b.taxNumber ?? ''
      };
      this.hasLogo.set(b.hasLogo);
      this.logoVersion.set(b.logoVersion);
    });
  }

  save() {
    if (!this.form.companyName.trim()) { this.error.set('Şirket adı zorunludur.'); return; }
    this.saving.set(true);
    this.error.set('');
    this.http.put(this.base, this.form).subscribe({
      next: () => { this.saving.set(false); this.notify.success('Kurum profili kaydedildi.'); this.branding.load(); },
      error: e => { this.saving.set(false); this.error.set(e.error?.detail ?? 'Kayıt başarısız.'); }
    });
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    this.uploading.set(true);
    this.http.post(`${this.base}/logo`, fd).subscribe({
      next: () => {
        this.uploading.set(false);
        this.hasLogo.set(true);
        this.logoVersion.set(Date.now());
        this.notify.success('Logo yüklendi.');
        this.branding.load();
      },
      error: e => { this.uploading.set(false); this.notify.error(e.error?.detail ?? 'Logo yüklenemedi.'); }
    });
    input.value = '';
  }

  removeLogo() {
    if (!confirm('Logo kaldırılsın mı?')) return;
    this.http.delete(`${this.base}/logo`).subscribe({
      next: () => { this.hasLogo.set(false); this.notify.success('Logo kaldırıldı.'); this.branding.load(); }
    });
  }
}
