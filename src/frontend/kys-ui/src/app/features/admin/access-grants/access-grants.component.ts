import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
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
  imports: [FormsModule, SlicePipe, TranslocoModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'admin.accessGrants.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'admin.accessGrants.subtitle' | transloco:{ count: grants().length } }}</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()"><i class="pi pi-plus"></i> {{ 'admin.accessGrants.newGrant' | transloco }}</button>
      </div>

      <div class="table-wrapper">
        @if (loading()) {
          <div class="loading-row">{{ 'common.loading' | transloco }}</div>
        } @else if (!grants().length) {
          <div class="loading-row">{{ 'admin.accessGrants.emptyNone' | transloco }}</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr><th>{{ 'admin.accessGrants.colPerson' | transloco }}</th><th>{{ 'admin.accessGrants.colKind' | transloco }}</th><th>{{ 'admin.accessGrants.colTargetCap' | transloco }}</th><th>{{ 'admin.accessGrants.colLevel' | transloco }}</th><th>{{ 'admin.accessGrants.colExpiry' | transloco }}</th><th></th></tr>
            </thead>
            <tbody>
              @for (g of grants(); track g.id) {
                <tr>
                  <td>{{ g.personName }}</td>
                  <td><span class="badge" [class]="g.kind === 'Scope' ? 'badge--saas' : 'badge--custom'">{{ (g.kind === 'Scope' ? 'admin.accessGrants.kindScope' : 'admin.accessGrants.kindCapability') | transloco }}</span></td>
                  <td>
                    @if (g.kind === 'Capability') { <code class="code-badge">{{ g.capability }}</code> }
                    @else { {{ scopeTypeLabel(g.scopeType) }}: {{ targetName(g) }} }
                  </td>
                  <td>{{ g.level ? ((g.level === 'Write' ? 'admin.accessGrants.levelWrite' : 'admin.accessGrants.levelRead') | transloco) : '—' }}</td>
                  <td>{{ g.expiresAt ? (g.expiresAt | slice:0:10) : ('admin.accessGrants.noExpiry' | transloco) }}</td>
                  <td class="actions-cell">
                    <button class="kebab-btn" [title]="'admin.accessGrants.removeTitle' | transloco" (click)="revoke(g)"><i class="pi pi-trash"></i></button>
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
            <h2>{{ 'admin.accessGrants.modalTitle' | transloco }}</h2>
            <button class="close-btn" (click)="showModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (error()) { <div class="alert-error">{{ error() }}</div> }

            <div class="form-group">
              <label>{{ 'admin.accessGrants.person' | transloco }} <span class="required">*</span></label>
              <select [(ngModel)]="form.personId">
                <option value="">{{ 'common.select' | transloco }}</option>
                @for (p of people(); track p.id) { <option [value]="p.id">{{ p.label }}</option> }
              </select>
            </div>

            <div class="form-group">
              <label>{{ 'admin.accessGrants.kind' | transloco }}</label>
              <select [(ngModel)]="form.kind">
                <option value="Scope">{{ 'admin.accessGrants.kindScopeOpt' | transloco }}</option>
                <option value="Capability">{{ 'admin.accessGrants.kindCapabilityOpt' | transloco }}</option>
              </select>
            </div>

            @if (form.kind === 'Scope') {
              <div class="form-group">
                <label>{{ 'admin.accessGrants.scopeTypeField' | transloco }}</label>
                <select [(ngModel)]="form.scopeType">
                  <option value="Product">{{ 'admin.accessGrants.scopeProduct' | transloco }}</option>
                  <option value="Customer">{{ 'admin.accessGrants.scopeCustomer' | transloco }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ 'admin.accessGrants.target' | transloco }} <span class="required">*</span></label>
                <select [(ngModel)]="form.scopeId">
                  <option value="">{{ 'common.select' | transloco }}</option>
                  @for (o of (form.scopeType === 'Product' ? products() : customers()); track o.id) {
                    <option [value]="o.id">{{ o.label }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>{{ 'admin.accessGrants.level' | transloco }}</label>
                <select [(ngModel)]="form.level">
                  <option value="Read">{{ 'admin.accessGrants.levelRead' | transloco }}</option>
                  <option value="Write">{{ 'admin.accessGrants.levelWrite' | transloco }}</option>
                </select>
              </div>
            } @else {
              <div class="form-group">
                <label>{{ 'admin.accessGrants.capability' | transloco }} <span class="required">*</span></label>
                <select [(ngModel)]="form.capability">
                  <option value="">{{ 'common.select' | transloco }}</option>
                  @for (c of capabilities; track c) { <option [value]="c">{{ c }}</option> }
                </select>
              </div>
            }

            <div class="form-group">
              <label>{{ 'admin.accessGrants.expiryLabel' | transloco }}</label>
              <input type="date" [(ngModel)]="form.expiresAt" />
            </div>
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
  private transloco = inject(TranslocoService);
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
    this.http.get<{ items: { id: string; firstName: string; lastName: string; email: string }[] }>(`${this.base}/people?pageSize=200`)
      .subscribe(r => this.people.set((r.items ?? []).map(p => ({ id: p.id, label: `${p.firstName} ${p.lastName}` }))));
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

  scopeTypeLabel(t: string | null) {
    if (t === 'Product') return this.transloco.translate('admin.accessGrants.scopeProduct');
    if (t === 'Customer') return this.transloco.translate('admin.accessGrants.scopeCustomer');
    if (t === 'Team') return this.transloco.translate('admin.accessGrants.scopeTeam');
    return '—';
  }
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
    if (!this.form.personId) { this.error.set(this.transloco.translate('admin.accessGrants.selectPerson')); return; }
    if (this.form.kind === 'Scope' && !this.form.scopeId) { this.error.set(this.transloco.translate('admin.accessGrants.selectTarget')); return; }
    if (this.form.kind === 'Capability' && !this.form.capability) { this.error.set(this.transloco.translate('admin.accessGrants.selectCapability')); return; }

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
      error: err => { this.saving.set(false); this.error.set(err.error?.detail ?? this.transloco.translate('admin.accessGrants.saveFailed')); }
    });
  }

  revoke(g: GrantDto) {
    if (!confirm(this.transloco.translate('admin.accessGrants.revokeConfirm', { name: g.personName }))) return;
    this.http.delete(`${this.base}/admin/access-grants/${g.id}`).subscribe(() => this.load());
  }
}
