import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, DatePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';

const STATUS_LABEL: Record<string, string> = { Prospect: 'Potansiyel', Onboarding: 'Onboarding', Active: 'Aktif', Inactive: 'Pasif', Churned: 'Ayrıldı' };
const STATUS_CSS: Record<string, string> = { Prospect: 'badge--prospect', Onboarding: 'badge--onboarding', Active: 'badge--active', Inactive: 'badge--inactive', Churned: 'badge--churned' };

interface CustomFieldDef {
  id: string;
  fieldKey: string;
  displayName: string;
  fieldType: number; // 0=Text,1=Number,2=Date,3=Boolean,4=Select,5=Url,6=Email
  isRequired: boolean;
  defaultValue: string | null;
  selectOptions: string[] | null;
  groupName: string | null;
}

interface CustomerProductBadge {
  customerProductId: string;
  productId: string;
  productCode: string;
  productName: string;
}

interface Customer {
  id: string;
  name: string;
  code: string;
  shortName: string | null;
  status: string;
  productionLiveAt: string | null;
  productCount: number;
  isArchived: boolean;
  products: CustomerProductBadge[];
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [RouterLink, FormsModule, NgClass, DatePipe],
  template: `
    <div class="page-content">
      <div class="flex-between" style="margin-bottom:1.5rem">
        <h1 style="font-size:1.5rem;font-weight:700;color:var(--text-strong)">Müşteriler</h1>
        <button class="btn-primary-sm" (click)="openModal()">
          <i class="pi pi-plus"></i> Yeni Müşteri
        </button>
      </div>

      <div class="filter-bar">
        <input
          type="text" placeholder="Müşteri ara..."
          [(ngModel)]="search" (ngModelChange)="onSearch()"
          class="search-input" />
        <select [(ngModel)]="statusFilter" (ngModelChange)="onSearch()" class="select-input">
          <option value="">Tüm Durumlar</option>
          <option value="Prospect">Potansiyel</option>
          <option value="Onboarding">Onboarding</option>
          <option value="Active">Aktif</option>
          <option value="Inactive">Pasif</option>
          <option value="Churned">Ayrıldı</option>
        </select>
        <label class="checkbox-label">
          <input type="checkbox" [(ngModel)]="includeArchived" (ngModelChange)="onSearch()" />
          Arşivlenenleri göster
        </label>
      </div>

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Müşteri</th>
              <th>Durum</th>
              <th>Go-Live</th>
              <th>Ürünler</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of customers; track c.id) {
              <tr [routerLink]="['/customers', c.id]" class="table-row">
                <td>
                  <div style="font-weight:500;color:var(--text-strong)">{{ c.name }}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted)">{{ c.code }}{{ c.shortName ? ' · ' + c.shortName : '' }}</div>
                </td>
                <td>
                  <span class="badge" [ngClass]="statusCss(c.status)">{{ statusLabel(c.status) }}</span>
                </td>
                <td>{{ c.productionLiveAt ? (c.productionLiveAt | date:'dd.MM.yyyy') : '—' }}</td>
                <td (click)="$event.stopPropagation()">
                  @if (!c.products.length) {
                    <span class="muted-text">—</span>
                  } @else {
                    <div class="product-badges">
                      @for (p of c.products; track p.customerProductId) {
                        <button type="button" class="product-badge"
                          [title]="p.productName"
                          (click)="goToProduct(c.id, p.customerProductId)">
                          {{ p.productCode }}
                        </button>
                      }
                    </div>
                  }
                </td>
                <td class="actions-cell" (click)="$event.stopPropagation()">
                  <div class="kebab-wrap">
                    <button class="kebab-btn" (click)="toggleMenu(c.id)"><i class="pi pi-ellipsis-v"></i></button>
                    @if (openMenuId === c.id) {
                      <div class="kebab-menu">
                        <button class="km-item km-danger" (click)="confirmDelete(c)">
                          <i class="pi pi-trash"></i> Sil
                        </button>
                      </div>
                    }
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="5" style="text-align:center;color:var(--text-subtle);padding:2rem">Müşteri bulunamadı.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (deleteTarget) {
      <div class="modal-backdrop" (click)="cancelDelete()">
        <div class="modal modal--sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Müşteriyi Sil</h2>
            <button type="button" class="modal-close" (click)="cancelDelete()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <p style="margin:0;color:var(--text)"><strong>{{ deleteTarget!.name }}</strong> müşterisini silmek istediğinize emin misiniz?</p>
            <p style="margin:0.5rem 0 0;font-size:0.8125rem;color:var(--text-muted)">Bu işlem geri alınamaz.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cancelDelete()">İptal</button>
            <button type="button" class="btn btn-danger" [disabled]="deleting()" (click)="deleteCustomer()">
              {{ deleting() ? 'Siliniyor...' : 'Sil' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Yeni Müşteri Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Yeni Müşteri</h2>
            <button type="button" class="modal-close" (click)="closeModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Müşteri Adı <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.name" placeholder="ör. Acme Yazılım A.Ş." [class.input-error]="submitted() && !form.name.trim()" />
                @if (submitted() && !form.name.trim()) {
                  <span class="error-msg">Ad zorunludur</span>
                }
              </div>
              <div class="form-group">
                <label>Kod <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.code" placeholder="ör. ACME" (input)="form.code = form.code.toUpperCase()" [class.input-error]="submitted() && !form.code.trim()" />
                @if (submitted() && !form.code.trim()) {
                  <span class="error-msg">Kod zorunludur</span>
                }
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Kısa Ad</label>
                <input type="text" [(ngModel)]="form.shortName" placeholder="ör. Acme" />
              </div>
              <div class="form-group">
                <label>Sektör</label>
                <input type="text" [(ngModel)]="form.sector" placeholder="ör. Fintech, Sağlık..." />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Ülke</label>
                <input type="text" [(ngModel)]="form.country" placeholder="ör. Türkiye" />
              </div>
              <div class="form-group">
                <label>Şehir</label>
                <input type="text" [(ngModel)]="form.city" placeholder="ör. İstanbul" />
              </div>
            </div>
            <div class="form-group">
              <label>Açıklama</label>
              <textarea [(ngModel)]="form.description" rows="2" placeholder="Kısa açıklama..."></textarea>
            </div>
            <div class="section-title">Birincil İletişim (isteğe bağlı)</div>
            <div class="form-row">
              <div class="form-group">
                <label>Ad Soyad</label>
                <input type="text" [(ngModel)]="form.primaryContactName" />
              </div>
              <div class="form-group">
                <label>E-posta</label>
                <input type="email" [(ngModel)]="form.primaryContactEmail" />
              </div>
            </div>
            @if (customFieldDefs().length) {
              <div class="section-title">Özel Alanlar</div>
              @for (def of customFieldDefs(); track def.id) {
                <div class="form-group">
                  <label>{{ def.displayName }} @if (def.isRequired) { <span class="required">*</span> }</label>
                  @if (def.fieldType === 4) {
                    <select [(ngModel)]="cfValues[def.fieldKey]">
                      <option value="">Seçiniz...</option>
                      @for (opt of def.selectOptions ?? []; track opt) {
                        <option [value]="opt">{{ opt }}</option>
                      }
                    </select>
                  } @else if (def.fieldType === 3) {
                    <label class="checkbox-label" style="font-weight:400">
                      <input type="checkbox" [checked]="cfValues[def.fieldKey] === 'true'" (change)="cfValues[def.fieldKey] = $any($event.target).checked ? 'true' : 'false'" />
                      Evet
                    </label>
                  } @else {
                    <input
                      [type]="cfInputType(def.fieldType)"
                      [(ngModel)]="cfValues[def.fieldKey]"
                      [placeholder]="def.defaultValue ?? ''" />
                  }
                  @if (submitted() && def.isRequired && !cfValues[def.fieldKey]) {
                    <span class="error-msg">{{ def.displayName }} zorunludur</span>
                  }
                </div>
              }
            }
            @if (saveError()) {
              <div class="alert-error">{{ saveError() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">İptal</button>
            <button type="button" class="btn btn-primary" [disabled]="saving()" (click)="save()">
              {{ saving() ? 'Kaydediliyor...' : 'Oluştur' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .search-input, .select-input {
      border: 1px solid var(--border-strong);
      border-radius: 0.5rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      outline: none;
      &:focus { border-color: var(--primary); }
    }
    .search-input { width: 280px; }
    .checkbox-label { font-size: 0.875rem; color: var(--text); display: flex; align-items: center; gap: 0.375rem; cursor: pointer; }
    .table-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      overflow: hidden;
      table { width: 100%; border-collapse: collapse; }
      th {
        background: var(--surface-2);
        padding: 0.75rem 1rem;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border);
      }
      td { padding: 0.875rem 1rem; border-bottom: 1px solid var(--surface-3); font-size: 0.875rem; }
    }
    .table-row { cursor: pointer; &:hover td { background: var(--surface-2); } }
    .btn-primary-sm {
      background: var(--primary); color: white; border: none;
      border-radius: 0.5rem; padding: 0.5rem 1rem;
      font-size: 0.875rem; font-weight: 500; cursor: pointer;
      display: flex; align-items: center; gap: 0.375rem;
      &:hover { background: var(--primary-hover); }
    }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal {
      background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 560px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column;
      max-height: 90vh; overflow: hidden;
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
      h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); }
    }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 1.25rem; padding: 0.25rem; border-radius: 0.375rem; &:hover { background: var(--surface-3); } }
    .modal-body { padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; flex: 1; min-height: 0; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group {
      display: flex; flex-direction: column; gap: 0.375rem;
      label { font-size: 0.8125rem; font-weight: 600; color: var(--text); }
      input, textarea, select {
        padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem;
        font-size: 0.875rem; color: var(--text-strong);
        &:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      }
      textarea { resize: vertical; font-family: inherit; }
    }
    .input-error { border-color: var(--danger) !important; }
    .error-msg { font-size: 0.75rem; color: var(--danger); }
    .required { color: var(--danger); }
    .section-title { font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid var(--surface-3); padding-top: 0.75rem; }
    .alert-error { padding: 0.75rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.375rem; color: var(--danger-soft-text); font-size: 0.8125rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; line-height: 1.5; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary) !important; color: var(--surface) !important; &:not(:disabled):hover { background: var(--primary-hover) !important; } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--surface-3); } }
    .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--prospect { background: var(--surface-3); color: var(--text-muted); }
    .badge--onboarding { background: var(--primary-soft-bg-2); color: var(--primary-soft-text); }
    .badge--active { background: var(--success-soft-bg); color: var(--success-soft-text); }
    .badge--inactive { background: var(--warning-soft-bg); color: var(--warning-soft-text); }
    .badge--churned { background: var(--danger-soft-bg); color: var(--danger-soft-text); }

    .muted-text { color: var(--border-strong); font-size: 0.875rem; }
    .product-badges { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .product-badge { display: inline-flex; align-items: center; padding: 0.15rem 0.5rem; background: var(--primary-soft-bg); color: var(--primary-strong); border: 1px solid var(--primary-soft-bg-2); border-radius: 0.25rem; font-size: 0.7rem; font-weight: 600; font-family: monospace; cursor: pointer; white-space: nowrap; &:hover { background: var(--primary-soft-bg-2); border-color: var(--primary-strong); color: var(--primary-soft-text); } }
    .actions-cell { width: 2.5rem; text-align: center; }
    .kebab-wrap { position: relative; display: inline-block; }
    .kebab-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 1rem; line-height: 1; &:hover { background: var(--surface-3); color: var(--text); } }
    .kebab-menu { position: absolute; right: 0; top: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 0.5rem; box-shadow: 0 4px 16px rgba(0,0,0,0.12); min-width: 120px; z-index: 50; padding: 0.25rem; }
    .km-item { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem 0.75rem; border: none; background: none; cursor: pointer; font-size: 0.875rem; border-radius: 0.375rem; &:hover { background: var(--surface-3); } }
    .km-danger { color: var(--danger-strong); &:hover { background: var(--danger-faint-bg) !important; } }
    .btn-danger { background: var(--danger-strong) !important; color: white !important; &:not(:disabled):hover { background: var(--danger-strong) !important; } }
    .modal--sm { max-width: 400px; }
  `]
})
export class CustomerListComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  customers: Customer[] = [];
  search = '';
  statusFilter = '';
  includeArchived = false;
  totalCount = 0;

  openMenuId: string | null = null;
  deleteTarget: Customer | null = null;
  deleting = signal(false);

  toggleMenu(id: string): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  confirmDelete(c: Customer): void {
    this.openMenuId = null;
    this.deleteTarget = c;
  }

  cancelDelete(): void { this.deleteTarget = null; }

  deleteCustomer(): void {
    if (!this.deleteTarget) return;
    this.deleting.set(true);
    this.http.delete(`${environment.apiUrl}/customers/${this.deleteTarget.id}`).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget = null;
        this.load();
      },
      error: () => this.deleting.set(false)
    });
  }

  showModal = signal(false);
  submitted = signal(false);
  saving = signal(false);
  saveError = signal('');

  customFieldDefs = signal<CustomFieldDef[]>([]);
  private cfLoaded = false;
  cfValues: Record<string, string> = {};

  form = {
    name: '',
    code: '',
    shortName: '',
    sector: '',
    country: '',
    city: '',
    description: '',
    primaryContactName: '',
    primaryContactEmail: '',
  };

  ngOnInit(): void {
    this.load();
  }

  onSearch(): void {
    this.load();
  }

  private load(): void {
    const params = new URLSearchParams();
    if (this.search) params.set('search', this.search);
    if (this.statusFilter) params.set('status', this.statusFilter);
    params.set('includeArchived', String(this.includeArchived));
    params.set('page', '1');
    params.set('pageSize', '50');

    this.http.get<{ items: Customer[]; totalCount: number }>(
      `${environment.apiUrl}/customers?${params}`
    ).subscribe(r => {
      this.customers = r.items;
      this.totalCount = r.totalCount;
    });
  }

  openModal(): void {
    this.showModal.set(true);
    if (!this.cfLoaded) {
      this.http.get<CustomFieldDef[]>(`${environment.apiUrl}/custom-field-definitions?entityType=0`).subscribe({
        next: defs => { this.customFieldDefs.set(defs); this.cfLoaded = true; }
      });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.submitted.set(false);
    this.saveError.set('');
    this.cfValues = {};
    this.form = {
      name: '', code: '', shortName: '', sector: '',
      country: '', city: '', description: '',
      primaryContactName: '', primaryContactEmail: '',
    };
  }

  cfInputType(fieldType: number): string {
    switch (fieldType) {
      case 1: return 'number';
      case 2: return 'date';
      case 5: return 'url';
      case 6: return 'email';
      default: return 'text';
    }
  }

  private buildCustomFields(): Record<string, unknown> | null {
    const defs = this.customFieldDefs();
    if (!defs.length) return null;
    const result: Record<string, unknown> = {};
    let hasAny = false;
    for (const def of defs) {
      const raw = this.cfValues[def.fieldKey];
      if (!raw && raw !== 'false') continue;
      hasAny = true;
      if (def.fieldType === 1) result[def.fieldKey] = Number(raw);
      else if (def.fieldType === 3) result[def.fieldKey] = raw === 'true';
      else result[def.fieldKey] = raw;
    }
    return hasAny ? result : null;
  }

  save(): void {
    this.submitted.set(true);
    if (!this.form.name.trim() || !this.form.code.trim()) return;
    const requiredMissing = this.customFieldDefs().some(d => d.isRequired && !this.cfValues[d.fieldKey]);
    if (requiredMissing) return;

    this.saving.set(true);
    this.saveError.set('');

    const body = {
      name: this.form.name.trim(),
      code: this.form.code.trim(),
      shortName: this.form.shortName.trim() || null,
      sector: this.form.sector.trim() || null,
      country: this.form.country.trim() || null,
      city: this.form.city.trim() || null,
      description: this.form.description.trim() || null,
      primaryContactName: this.form.primaryContactName.trim() || null,
      primaryContactEmail: this.form.primaryContactEmail.trim() || null,
      primaryContactPhone: null,
      customFields: this.buildCustomFields(),
    };

    this.http.post<{ id: string }>(`${environment.apiUrl}/customers`, body).subscribe({
      next: res => {
        this.saving.set(false);
        this.closeModal();
        this.router.navigate(['/customers', res.id]);
      },
      error: err => {
        this.saving.set(false);
        this.saveError.set(err.error?.detail ?? 'Müşteri oluşturulamadı');
      }
    });
  }

  statusLabel(s: string) { return STATUS_LABEL[s] ?? s; }
  statusCss(s: string) { return STATUS_CSS[s] ?? ''; }

  goToProduct(customerId: string, customerProductId: string) {
    this.router.navigate(['/customers', customerId], { queryParams: { cp: customerProductId } });
  }
}
