import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface CustomFieldDef {
  id: string;
  fieldKey: string;
  displayName: string;
  fieldType: number;
  isRequired: boolean;
  defaultValue: string | null;
  selectOptions: string[] | null;
}

// 0=SaaS, 1=CustomerBased, 2=Hybrid | 0=Active, 1=Deprecated, 2=Discontinued
const TYPE_LABELS: Record<number, string> = { 0: 'SaaS', 1: 'Müşteriye Özel', 2: 'Hibrit' };
const TYPE_CSS: Record<number, string> = { 0: 'badge--saas', 1: 'badge--custom', 2: 'badge--hybrid' };
const STATUS_LABELS: Record<number, string> = { 0: 'Aktif', 1: 'Kullanımdan Kalkıyor', 2: 'Kapatıldı' };
const STATUS_CSS: Record<number, string> = { 0: 'badge--active', 1: 'badge--deprecated', 2: 'badge--archived' };

interface ProductListItem {
  id: string;
  name: string;
  code: string;
  productType: number;
  status: number;
  poName: string | null;
  teamCount: number;
  assignmentCount: number;
}

interface PagedResult {
  items: ProductListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface CreateProductForm {
  name: string;
  code: string;
  productType: number;
  description: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">Ürünler</h1>
          <p class="page-subtitle">{{ totalCount() }} ürün</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">
          <i class="pi pi-plus"></i> Yeni Ürün
        </button>
      </div>

      <!-- Filters -->
      <div class="toolbar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input type="text" placeholder="Ürün ara..." [(ngModel)]="searchInput" (ngModelChange)="onSearch($event)" />
        </div>
        <select [(ngModel)]="filterType" (ngModelChange)="onFilterChange()">
          <option value="">Tüm tipler</option>
          <option value="0">SaaS</option>
          <option value="1">Müşteriye Özel</option>
          <option value="2">Hibrit</option>
        </select>
        <select [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()">
          <option value="">Tüm durumlar</option>
          <option value="0">Aktif</option>
          <option value="1">Kullanımdan Kalkıyor</option>
          <option value="2">Kapatıldı</option>
        </select>
      </div>

      <div class="table-wrapper">
        @if (loading()) {
          <div class="loading-row">Yükleniyor...</div>
        } @else if (!products().length) {
          <div class="loading-row">Ürün bulunamadı.</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Kod</th>
                <th>Tip</th>
                <th>Durum</th>
                <th>Ürün Sahibi</th>
                <th>Ekip / Kişi</th>
              </tr>
            </thead>
            <tbody>
              @for (p of products(); track p.id) {
                <tr class="clickable-row" [routerLink]="['/products', p.id]">
                  <td class="name-cell">
                    <div class="product-icon"><i class="pi pi-box"></i></div>
                    <span class="product-name">{{ p.name }}</span>
                  </td>
                  <td><code class="code-badge">{{ p.code }}</code></td>
                  <td><span class="badge" [class]="typeCss(p.productType)">{{ typeLabel(p.productType) }}</span></td>
                  <td><span class="badge" [class]="statusCss(p.status)">{{ statusLabel(p.status) }}</span></td>
                  <td class="muted">{{ p.poName ?? '—' }}</td>
                  <td class="muted">{{ p.teamCount }} ekip · {{ p.assignmentCount }} kişi</td>
                </tr>
              }
            </tbody>
          </table>
          @if (totalCount() > pageSize) {
            <div class="pagination">
              <button class="page-btn" [disabled]="page() === 1" (click)="goToPage(page() - 1)">
                <i class="pi pi-chevron-left"></i>
              </button>
              <span class="page-info">{{ page() }} / {{ totalPages() }}</span>
              <button class="page-btn" [disabled]="page() === totalPages()" (click)="goToPage(page() + 1)">
                <i class="pi pi-chevron-right"></i>
              </button>
            </div>
          }
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Yeni Ürün</h2>
            <button class="close-btn" (click)="closeModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (createError()) {
              <div class="alert-error">{{ createError() }}</div>
            }
            <div class="form-row">
              <div class="form-group">
                <label>Ürün Adı <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.name" placeholder="Ödeme Sistemi" />
                @if (submitted() && !form.name.trim()) {
                  <span class="field-error">Zorunlu alan</span>
                }
              </div>
              <div class="form-group">
                <label>Kod <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.code" placeholder="PAY" maxlength="10" style="text-transform:uppercase" (input)="form.code = form.code.toUpperCase()" />
                @if (submitted() && !form.code.trim()) {
                  <span class="field-error">Zorunlu alan</span>
                }
              </div>
            </div>
            <div class="form-group">
              <label>Tip <span class="required">*</span></label>
              <select [(ngModel)]="form.productType">
                <option [value]="0">SaaS — Tüm müşteriler paylaşır</option>
                <option [value]="1">Müşteriye Özel — Her müşteri için ayrı kurulum</option>
                <option [value]="2">Hibrit — SaaS + özel ortam</option>
              </select>
            </div>
            <div class="form-group" style="position:relative">
              <label>Ürün Sahibi</label>
              <input type="text" placeholder="İsim veya e-posta ara..."
                [(ngModel)]="poSearch" (ngModelChange)="searchPo($event)" [disabled]="!!poPersonId" />
              @if (poOptions().length) {
                <div class="dropdown">
                  @for (p of poOptions(); track p.id) {
                    <div class="dropdown-item" (click)="selectPo(p)">
                      <span class="di-name">{{ p.name }}</span>
                      <span class="di-email">{{ p.email }}</span>
                    </div>
                  }
                </div>
              }
              @if (poPersonId) {
                <div class="selected-hint">
                  <i class="pi pi-check-circle"></i> {{ poName }}
                  <button type="button" class="clear-btn" (click)="clearPo()">×</button>
                </div>
              }
            </div>
            <div class="form-group">
              <label>Açıklama</label>
              <textarea [(ngModel)]="form.description" placeholder="Ürün hakkında kısa açıklama" rows="3"></textarea>
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
                    <label style="display:flex;align-items:center;gap:0.5rem;font-weight:400;cursor:pointer">
                      <input type="checkbox" [checked]="cfValues[def.fieldKey] === 'true'" (change)="cfValues[def.fieldKey] = $any($event.target).checked ? 'true' : 'false'" />
                      Evet
                    </label>
                  } @else {
                    <input [type]="cfInputType(def.fieldType)" [(ngModel)]="cfValues[def.fieldKey]" [placeholder]="def.defaultValue ?? ''" />
                  }
                  @if (submitted() && def.isRequired && !cfValues[def.fieldKey]) {
                    <span class="field-error">{{ def.displayName }} zorunludur</span>
                  }
                </div>
              }
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">İptal</button>
            <button class="btn btn-primary" [disabled]="saving()" (click)="create()">
              {{ saving() ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #111827; }
    .page-subtitle { font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem; }

    .toolbar { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
    .search-box {
      position: relative; flex: 1; min-width: 200px; max-width: 320px;
      i { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #9CA3AF; font-size: 0.875rem; }
      input { width: 100%; padding: 0.5rem 0.75rem 0.5rem 2.25rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem; box-sizing: border-box; }
    }
    select { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem; color: #374151; background: white; }

    .table-wrapper { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .loading-row { padding: 3rem; text-align: center; color: #9CA3AF; font-size: 0.875rem; }
    .data-table {
      width: 100%; border-collapse: collapse;
      th { background: #F9FAFB; padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; }
      td { padding: 0.75rem; font-size: 0.875rem; color: #374151; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
    }
    .clickable-row { cursor: pointer; &:hover td { background: #F9FAFB; } &:last-child td { border-bottom: none; } }
    .name-cell { display: flex; align-items: center; gap: 0.625rem; }
    .product-icon { width: 2rem; height: 2rem; border-radius: 0.375rem; background: #F0FDF4; color: #16A34A; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; flex-shrink: 0; }
    .product-name { font-weight: 500; color: #111827; }
    .muted { color: #6B7280; }
    .code-badge { background: #F3F4F6; color: #374151; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8125rem; }

    .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--active { background: #D1FAE5; color: #065F46; }
    .badge--deprecated { background: #FEF3C7; color: #92400E; }
    .badge--archived { background: #F3F4F6; color: #6B7280; }
    .badge--saas { background: #DBEAFE; color: #1E40AF; }
    .badge--custom { background: #F3E8FF; color: #6B21A8; }
    .badge--hybrid { background: #FFEDD5; color: #9A3412; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 0.875rem; border-top: 1px solid #F3F4F6; }
    .page-btn { background: none; border: 1px solid #D1D5DB; border-radius: 0.375rem; padding: 0.375rem 0.625rem; cursor: pointer; color: #374151; &:disabled { opacity: 0.4; cursor: not-allowed; } &:not(:disabled):hover { background: #F3F4F6; } }
    .page-info { font-size: 0.875rem; color: #6B7280; }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: opacity 0.15s; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: #3B82F6; color: white; &:not(:disabled):hover { background: #2563EB; } }
    .btn-secondary { background: white; color: #374151; border: 1px solid #D1D5DB; &:hover { background: #F3F4F6; } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 0.75rem; width: 100%; max-width: 520px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E5E7EB; h2 { font-size: 1.125rem; font-weight: 700; color: #111827; } }
    .close-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 0.25rem; font-size: 1rem; &:hover { color: #374151; } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 0.75rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: #374151; } input, select, textarea { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; resize: vertical; &:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); } } }
    .required { color: #EF4444; }
    .field-error { font-size: 0.75rem; color: #EF4444; }
    .alert-error { padding: 0.75rem 1rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 0.5rem; color: #991B1B; font-size: 0.875rem; }
    .section-title { font-size: 0.8125rem; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid #F3F4F6; padding-top: 0.75rem; margin-top: 0.25rem; }
    .dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #E5E7EB; border-radius: 0.5rem; z-index: 10; box-shadow: 0 4px 16px rgba(0,0,0,0.12); max-height: 180px; overflow-y: auto; margin-top: 2px; }
    .dropdown-item { padding: 0.5rem 0.75rem; cursor: pointer; display: flex; flex-direction: column; gap: 0.125rem; &:hover { background: #F3F4F6; } }
    .di-name { font-size: 0.875rem; font-weight: 500; color: #111827; }
    .di-email { font-size: 0.75rem; color: #9CA3AF; }
    .selected-hint { font-size: 0.8125rem; color: #059669; display: flex; align-items: center; gap: 0.375rem; margin-top: 0.375rem; }
    .clear-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; font-size: 1rem; padding: 0 0.25rem; line-height: 1; &:hover { color: #EF4444; } }
  `]
})
export class ProductListComponent implements OnInit {
  private http = inject(HttpClient);

  products = signal<ProductListItem[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  searchInput = '';
  filterType = '';
  filterStatus = '';
  private searchSubject = new Subject<string>();

  showModal = signal(false);
  saving = signal(false);
  submitted = signal(false);
  createError = signal('');
  form: CreateProductForm = { name: '', code: '', productType: 0, description: '' };

  poSearch = '';
  poPersonId = '';
  poName = '';
  poOptions = signal<{ id: string; name: string; email: string }[]>([]);

  searchPo(query: string): void {
    if (!query.trim()) { this.poOptions.set([]); return; }
    this.http.get<{ items: { id: string; firstName: string; lastName: string; email: string }[] }>(
      `${environment.apiUrl}/people?search=${encodeURIComponent(query)}&pageSize=8`
    ).subscribe({ next: r => this.poOptions.set(r.items.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, email: p.email }))) });
  }

  selectPo(p: { id: string; name: string; email: string }): void {
    this.poPersonId = p.id;
    this.poName = p.name;
    this.poSearch = '';
    this.poOptions.set([]);
  }

  clearPo(): void {
    this.poPersonId = '';
    this.poName = '';
    this.poSearch = '';
    this.poOptions.set([]);
  }

  customFieldDefs = signal<CustomFieldDef[]>([]);
  private cfLoaded = false;
  cfValues: Record<string, string> = {};

  openModal(): void {
    this.showModal.set(true);
    if (!this.cfLoaded) {
      this.http.get<CustomFieldDef[]>(`${environment.apiUrl}/custom-field-definitions?entityType=1`).subscribe({
        next: defs => { this.customFieldDefs.set(defs); this.cfLoaded = true; }
      });
    }
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

  typeLabel(t: number) { return TYPE_LABELS[t] ?? t; }
  typeCss(t: number) { return TYPE_CSS[t] ?? ''; }
  statusLabel(s: number) { return STATUS_LABELS[s] ?? s; }
  statusCss(s: number) { return STATUS_CSS[s] ?? ''; }

  ngOnInit() {
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page.set(1); this.load();
    });
    this.load();
  }

  onSearch(val: string) { this.searchSubject.next(val); }
  onFilterChange() { this.page.set(1); this.load(); }

  load() {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.page()),
      pageSize: String(this.pageSize),
    };
    if (this.searchInput.trim()) params['search'] = this.searchInput.trim();
    if (this.filterType !== '') params['type'] = this.filterType;
    if (this.filterStatus !== '') params['status'] = this.filterStatus;
    const qs = new URLSearchParams(params).toString();
    this.http.get<PagedResult>(`${environment.apiUrl}/products?${qs}`).subscribe({
      next: r => { this.products.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  goToPage(p: number) { this.page.set(p); this.load(); }

  closeModal() {
    this.showModal.set(false);
    this.submitted.set(false);
    this.createError.set('');
    this.cfValues = {};
    this.clearPo();
    this.form = { name: '', code: '', productType: 0, description: '' };
  }

  create() {
    this.submitted.set(true);
    if (!this.form.name.trim() || !this.form.code.trim()) return;
    const requiredMissing = this.customFieldDefs().some(d => d.isRequired && !this.cfValues[d.fieldKey]);
    if (requiredMissing) return;
    this.saving.set(true);
    this.createError.set('');
    const body = {
      name: this.form.name,
      code: this.form.code.toUpperCase(),
      productType: Number(this.form.productType),
      description: this.form.description || null,
      poPersonId: this.poPersonId || null,
      customFields: this.buildCustomFields()
    };
    this.http.post(`${environment.apiUrl}/products`, body).subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.page.set(1); this.load(); },
      error: err => { this.saving.set(false); this.createError.set(err.error?.detail ?? 'Ürün oluşturulamadı'); }
    });
  }
}
