import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface GrantDto {
  id: string;
  personId: string;
  personName: string;
  kind: string;            // Scope | Capability
  scopeType: string | null; // Product | Team | Customer
  scopeId: string | null;
  level: string | null;    // Read | Write
  capability: string | null;
  grantedAt: string;
  expiresAt: string | null;
}

interface Option { id: string; label: string; }

const CAPABILITIES = [
  'customer:create', 'customer:write', 'product:create', 'product:write',
  'product:assign', 'environment:write', 'credential:view', 'credential:write', 'kb:write'
];

@Component({
  selector: 'app-access-grants',
  standalone: true,
  imports: [FormsModule, SlicePipe],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">Erişim Yetkileri (Grant)</h1>
          <p class="page-subtitle">{{ grants().length }} açık yetki — kapsam/yetenek istisnaları</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()"><i class="pi pi-plus"></i> Yeni Yetki</button>
      </div>

      <div class="table-wrapper">
        @if (loading()) {
          <div class="loading-row">Yükleniyor...</div>
        } @else if (!grants().length) {
          <div class="loading-row">Tanımlı açık yetki yok.</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr><th>Kişi</th><th>Tür</th><th>Hedef / Yetenek</th><th>Seviye</th><th>Bitiş</th><th></th></tr>
            </thead>
            <tbody>
              @for (g of grants(); track g.id) {
                <tr>
                  <td>{{ g.personName }}</td>
                  <td><span class="badge" [class]="g.kind === 'Scope' ? 'badge--saas' : 'badge--custom'">{{ g.kind === 'Scope' ? 'Kapsam' : 'Yetenek' }}</span></td>
                  <td>
                    @if (g.kind === 'Capability') { <code class="code-badge">{{ g.capability }}</code> }
                    @else { {{ scopeTypeLabel(g.scopeType) }}: {{ targetName(g) }} }
                  </td>
                  <td>{{ g.level ? (g.level === 'Write' ? 'Yazma' : 'Okuma') : '—' }}</td>
                  <td>{{ g.expiresAt ? (g.expiresAt | slice:0:10) : 'Süresiz' }}</td>
                  <td class="actions-cell">
                    <button class="kebab-btn" title="Kaldır" (click)="revoke(g)"><i class="pi pi-trash"></i></button>
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
        <div class="modal modal--sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Yeni Erişim Yetkisi</h2>
            <button class="close-btn" (click)="showModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (error()) { <div class="alert-error">{{ error() }}</div> }

            <div class="form-group">
              <label>Kişi <span class="required">*</span></label>
              <select [(ngModel)]="form.personId">
                <option value="">Seçiniz...</option>
                @for (p of people(); track p.id) { <option [value]="p.id">{{ p.label }}</option> }
              </select>
            </div>

            <div class="form-group">
              <label>Tür</label>
              <select [(ngModel)]="form.kind">
                <option value="Scope">Kapsam (kayıt erişimi)</option>
                <option value="Capability">Yetenek</option>
              </select>
            </div>

            @if (form.kind === 'Scope') {
              <div class="form-group">
                <label>Kapsam türü</label>
                <select [(ngModel)]="form.scopeType">
                  <option value="Product">Ürün</option>
                  <option value="Customer">Müşteri</option>
                </select>
              </div>
              <div class="form-group">
                <label>Hedef <span class="required">*</span></label>
                <select [(ngModel)]="form.scopeId">
                  <option value="">Seçiniz...</option>
                  @for (o of (form.scopeType === 'Product' ? products() : customers()); track o.id) {
                    <option [value]="o.id">{{ o.label }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Seviye</label>
                <select [(ngModel)]="form.level">
                  <option value="Read">Okuma</option>
                  <option value="Write">Yazma</option>
                </select>
              </div>
            } @else {
              <div class="form-group">
                <label>Yetenek <span class="required">*</span></label>
                <select [(ngModel)]="form.capability">
                  <option value="">Seçiniz...</option>
                  @for (c of capabilities; track c) { <option [value]="c">{{ c }}</option> }
                </select>
              </div>
            }

            <div class="form-group">
              <label>Bitiş tarihi (opsiyonel — süreli yetki)</label>
              <input type="date" [(ngModel)]="form.expiresAt" />
            </div>
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
      tr:last-child td { border-bottom: none; }
    }
    .actions-cell { text-align: right; white-space: nowrap; }
    .kebab-btn { background: none; border: none; cursor: pointer; padding: 0.375rem; border-radius: 0.375rem; color: var(--text-muted); font-size: 0.875rem; &:hover { background: var(--danger-faint-bg); color: var(--danger); } }

    .badge { display: inline-flex; align-items: center; padding: 0.125rem 0.55rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 600; }
    .badge--saas { background: var(--primary-soft-bg); color: var(--primary); }
    .badge--custom { background: var(--surface-3); color: var(--text-muted); }
    .code-badge { font-family: monospace; font-size: 0.8125rem; background: var(--surface-3); color: var(--text-muted); padding: 0.125rem 0.4rem; border-radius: 0.25rem; }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary); color: var(--primary-contrast); &:not(:disabled):hover { background: var(--primary-hover); } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--hover); } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 520px; box-shadow: var(--shadow-lg); }
    .modal--sm { max-width: 420px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; font-size: 1rem; &:hover { color: var(--text); } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; }

    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: var(--text); } input, select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; background: var(--surface); color: var(--text-strong); &:focus { outline: none; border-color: var(--primary); } } }
    .required { color: var(--danger); }
    .alert-error { padding: 0.75rem 1rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.5rem; color: var(--danger-soft-text); font-size: 0.875rem; }
  `]
})
export class AccessGrantsComponent implements OnInit {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  grants = signal<GrantDto[]>([]);
  people = signal<Option[]>([]);
  products = signal<Option[]>([]);
  customers = signal<Option[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal('');
  capabilities = CAPABILITIES;

  form = { personId: '', kind: 'Scope', scopeType: 'Product', scopeId: '', level: 'Write', capability: '', expiresAt: '' };

  ngOnInit() {
    this.load();
    this.http.get<{ items: { id: string; fullName: string }[] }>(`${this.base}/people?pageSize=200`)
      .subscribe(r => this.people.set((r.items ?? []).map(p => ({ id: p.id, label: p.fullName }))));
    this.http.get<{ items: { id: string; name: string; code: string }[] }>(`${this.base}/products?pageSize=200`)
      .subscribe(r => this.products.set((r.items ?? []).map(p => ({ id: p.id, label: `${p.name} (${p.code})` }))));
    this.http.get<{ items: { id: string; name: string; code: string }[] }>(`${this.base}/customers?pageSize=200`)
      .subscribe(r => this.customers.set((r.items ?? []).map(c => ({ id: c.id, label: `${c.name} (${c.code})` }))));
  }

  load() {
    this.loading.set(true);
    this.http.get<GrantDto[]>(`${this.base}/admin/access-grants`).subscribe({
      next: g => { this.grants.set(g); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  scopeTypeLabel(t: string | null) { return t === 'Product' ? 'Ürün' : t === 'Customer' ? 'Müşteri' : t === 'Team' ? 'Ekip' : '—'; }
  targetName(g: GrantDto) {
    const list = g.scopeType === 'Product' ? this.products() : this.customers();
    return list.find(o => o.id === g.scopeId)?.label ?? g.scopeId ?? '—';
  }

  openCreate() {
    this.form = { personId: '', kind: 'Scope', scopeType: 'Product', scopeId: '', level: 'Write', capability: '', expiresAt: '' };
    this.error.set('');
    this.showModal.set(true);
  }

  save() {
    if (!this.form.personId) { this.error.set('Kişi seçiniz.'); return; }
    if (this.form.kind === 'Scope' && !this.form.scopeId) { this.error.set('Hedef seçiniz.'); return; }
    if (this.form.kind === 'Capability' && !this.form.capability) { this.error.set('Yetenek seçiniz.'); return; }

    this.saving.set(true);
    const body = {
      personId: this.form.personId,
      kind: this.form.kind,
      scopeType: this.form.kind === 'Scope' ? this.form.scopeType : null,
      scopeId: this.form.kind === 'Scope' ? this.form.scopeId : null,
      level: this.form.kind === 'Scope' ? this.form.level : null,
      capability: this.form.kind === 'Capability' ? this.form.capability : null,
      expiresAt: this.form.expiresAt || null
    };
    this.http.post(`${this.base}/admin/access-grants`, body).subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.load(); },
      error: err => { this.saving.set(false); this.error.set(err.error?.detail ?? 'Kayıt başarısız.'); }
    });
  }

  revoke(g: GrantDto) {
    if (!confirm(`${g.personName} için bu yetki kaldırılsın mı?`)) return;
    this.http.delete(`${this.base}/admin/access-grants/${g.id}`).subscribe(() => this.load());
  }
}
