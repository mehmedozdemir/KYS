import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface WorkspaceCredential {
  id: string;
  fieldKey: string;
}

interface WorkspaceEndpoint {
  name: string;
  endpointType: string;
  baseUrl: string;
  swaggerUrl: string | null;
  healthCheckUrl: string | null;
  authType: string | null;
  credentialCount: number;
  credentials: WorkspaceCredential[];
}

interface WorkspaceResource {
  templateName: string;
  resourceTypeName: string;
  resourceTypeCode: string;
  isShared: boolean;
  sharedResourceName: string | null;
  credentialCount: number;
  credentials: WorkspaceCredential[];
}

interface WorkspaceEnvironment {
  environmentId: string;
  productName: string;
  name: string;
  environmentTypeName: string;
  environmentTypeCode: string;
  environmentTypeColor: string | null;
  endpoints: WorkspaceEndpoint[];
  resources: WorkspaceResource[];
}

interface WorkspaceCustomer {
  customerId: string;
  customerName: string;
  customerCode: string;
  products: string[];
  environments: WorkspaceEnvironment[];
}

@Component({
  selector: 'app-workspace-widget',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule],
  template: `
    <div class="workspace-card">
      <div class="ws-header">
        <div class="ws-title">
          <i class="pi pi-th-large"></i>
          <h2>Çalışma Alanım</h2>
        </div>
        <div class="ws-controls">
          <div class="scope-toggle">
            <button type="button" [class.active]="!allCustomers()" (click)="setScope(false)">
              Benim Müşterilerim
            </button>
            <button type="button" [class.active]="allCustomers()" (click)="setScope(true)">
              Tüm Müşteriler
            </button>
          </div>
          <div class="ws-filter">
            <i class="pi pi-search"></i>
            <input type="text" [ngModel]="filter()" (ngModelChange)="filter.set($event)"
              placeholder="Müşteri, ortam, endpoint, URL ara..." />
            @if (filter()) {
              <button type="button" class="ws-filter-clear" (click)="filter.set('')">
                <i class="pi pi-times"></i>
              </button>
            }
          </div>
        </div>
      </div>

      @if (!loading() && (availableResourceTypes().length || availableEndpointTypes().length)) {
        <div class="ws-typefilters">
          @if (availableResourceTypes().length) {
            <div class="ws-tf-group">
              <span class="ws-tf-label"><i class="pi pi-database"></i> Kaynak Tipi</span>
              @for (t of availableResourceTypes(); track t) {
                <button type="button" class="ws-tf-chip"
                  [class.active]="selectedResourceTypes().has(t)"
                  (click)="toggleResourceType(t)">{{ t }}</button>
              }
            </div>
          }
          @if (availableEndpointTypes().length) {
            <div class="ws-tf-group">
              <span class="ws-tf-label"><i class="pi pi-link"></i> Endpoint Türü</span>
              @for (t of availableEndpointTypes(); track t) {
                <button type="button" class="ws-tf-chip ws-tf-chip--ep"
                  [class.active]="selectedEndpointTypes().has(t)"
                  (click)="toggleEndpointType(t)">{{ epTypeLabel(t) }}</button>
              }
            </div>
          }
          @if (hasActiveTypeFilter()) {
            <button type="button" class="ws-tf-clear" (click)="clearTypeFilters()">
              <i class="pi pi-times"></i> Temizle
            </button>
          }
        </div>
      }

      @if (loading()) {
        <div class="ws-state">Yükleniyor...</div>
      } @else if (!customers().length) {
        <div class="ws-state">
          <i class="pi pi-inbox"></i>
          @if (allCustomers()) {
            <p>Görüntülenecek müşteri/ortam bulunamadı.</p>
          } @else {
            <p>Size atanmış bir ürün/müşteri bulunamadı. "Tüm Müşteriler" ile tümüne bakabilirsiniz.</p>
          }
        </div>
      } @else if (!filteredCustomers().length) {
        <div class="ws-state">
          <i class="pi pi-filter-slash"></i>
          @if (filter() && hasActiveTypeFilter()) {
            <p>Arama ve seçili tip filtreleriyle eşleşen kayıt yok.</p>
          } @else if (hasActiveTypeFilter()) {
            <p>Seçili tip filtreleriyle eşleşen kayıt yok.</p>
          } @else {
            <p>"{{ filter() }}" ile eşleşen kayıt yok.</p>
          }
        </div>
      } @else {
        <div class="ws-list">
          @for (c of filteredCustomers(); track c.customerId) {
            <div class="ws-customer">
              <button type="button" class="ws-customer-head" (click)="toggle(c.customerId)">
                <i class="pi" [ngClass]="isExpanded(c.customerId) ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                <span class="ws-customer-name">{{ c.customerName }}</span>
                <code class="ws-customer-code">{{ c.customerCode }}</code>
                <span class="ws-product-chips">
                  @for (p of c.products; track p) {
                    <span class="ws-chip">{{ p }}</span>
                  }
                </span>
                <span class="ws-customer-meta">{{ c.environments.length }} ortam</span>
              </button>

              @if (isExpanded(c.customerId)) {
                <div class="ws-product-list">
                  @for (pg of getProductGroups(c.environments); track pg.productName) {
                    <div class="ws-product-group">
                      <div class="ws-product-title">
                        <i class="pi pi-box"></i>
                        {{ pg.productName }}
                      </div>

                      <div class="ws-env-grid">
                      @for (e of pg.environments; track e.environmentId) {
                        <div class="ws-env">
                          <div class="ws-env-head">
                            <span class="ws-env-badge"
                              [style.background]="envColor(e, 0.15)"
                              [style.color]="e.environmentTypeColor ?? '#6B7280'">
                              {{ e.environmentTypeName }}
                            </span>
                            <span class="ws-env-name">{{ e.name }}</span>
                            <a class="ws-env-link" [routerLink]="['/environments', e.environmentId]" title="Ortam detayı">
                              Detay <i class="pi pi-arrow-right"></i>
                            </a>
                          </div>

                          @if (!e.endpoints.length && !e.resources.length) {
                            <div class="ws-empty-env">Bu ortamda tanımlı endpoint/kaynak yok.</div>
                          }

                          @for (ep of e.endpoints; track ep.name) {
                            @let epKey = e.environmentId + '|ep|' + ep.name;
                            <div class="ws-row ws-row--endpoint">
                              <i class="pi ws-row-icon" [ngClass]="epTypeIcon(ep.endpointType)"></i>
                              @if (ep.baseUrl) {
                                <a [href]="ep.baseUrl" target="_blank" class="ws-row-name ws-row-name--link" [title]="ep.baseUrl">
                                  {{ ep.name }}<i class="pi pi-external-link"></i>
                                </a>
                                <button type="button" class="ws-copy" (click)="copy(ep.baseUrl)" title="URL kopyala">
                                  <i class="pi pi-copy"></i>
                                </button>
                              } @else {
                                <span class="ws-row-name">{{ ep.name }}</span>
                                <span class="ws-no-url">URL yok</span>
                              }
                              @if (ep.swaggerUrl) {
                                <a [href]="ep.swaggerUrl" target="_blank" class="ws-mini-link" title="Swagger">
                                  <i class="pi pi-book"></i>
                                </a>
                              }
                              @if (ep.healthCheckUrl) {
                                <a [href]="ep.healthCheckUrl" target="_blank" class="ws-mini-link" title="Health Check">
                                  <i class="pi pi-heart"></i>
                                </a>
                              }
                              @if (ep.authType && ep.authType !== 'None') {
                                <span class="ws-auth-badge"><i class="pi pi-lock"></i> {{ authLabel(ep.authType) }}</span>
                              }
                              @if (ep.credentialCount) {
                                <button type="button" class="ws-cred" [class.active]="isPanelOpen(epKey)"
                                  (click)="togglePanel(epKey)" title="Credential'ları göster">
                                  <i class="pi pi-key"></i> {{ ep.credentialCount }}
                                  <i class="pi" [ngClass]="isPanelOpen(epKey) ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                                </button>
                              }
                            </div>
                            @if (isPanelOpen(epKey)) {
                              <div class="ws-cred-panel">
                                @for (cr of ep.credentials; track cr.id) {
                                  <div class="ws-cred-item">
                                    <span class="ws-cred-key">{{ cr.fieldKey }}</span>
                                    <span class="ws-cred-val" [class.revealed]="visibleValues()[cr.id]">
                                      {{ visibleValues()[cr.id] ? (revealedValues()[cr.id] ?? '••••••') : '••••••' }}
                                    </span>
                                    <button type="button" class="ws-cred-btn" [disabled]="revealingIds()[cr.id]"
                                      (click)="toggleReveal(cr.id)" [title]="visibleValues()[cr.id] ? 'Gizle' : 'Göster'">
                                      @if (revealingIds()[cr.id]) { <i class="pi pi-spin pi-spinner"></i> }
                                      @else { <i class="pi" [ngClass]="visibleValues()[cr.id] ? 'pi-eye-slash' : 'pi-eye'"></i> }
                                    </button>
                                    <button type="button" class="ws-cred-btn" [disabled]="revealingIds()[cr.id]"
                                      (click)="copyCredential(cr.id)" [title]="copiedIds()[cr.id] ? 'Kopyalandı' : 'Kopyala'">
                                      <i class="pi" [ngClass]="copiedIds()[cr.id] ? 'pi-check' : 'pi-copy'"></i>
                                    </button>
                                  </div>
                                }
                              </div>
                            }
                          }

                          @for (r of e.resources; track r.templateName) {
                            @let rKey = e.environmentId + '|res|' + r.templateName;
                            <div class="ws-row ws-row--resource">
                              <i class="pi ws-row-icon pi-database"></i>
                              <span class="ws-row-name">{{ r.templateName }}</span>
                              <span class="ws-res-type">{{ r.resourceTypeName }}</span>
                              @if (r.isShared) {
                                <span class="ws-shared"><i class="pi pi-share-alt"></i> {{ r.sharedResourceName ?? 'Paylaşımlı' }}</span>
                              }
                              @if (r.credentialCount) {
                                <button type="button" class="ws-cred" [class.active]="isPanelOpen(rKey)"
                                  (click)="togglePanel(rKey)" title="Bağlantı bilgilerini göster">
                                  <i class="pi pi-key"></i> {{ r.credentialCount }}
                                  <i class="pi" [ngClass]="isPanelOpen(rKey) ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                                </button>
                              }
                            </div>
                            @if (isPanelOpen(rKey)) {
                              <div class="ws-cred-panel">
                                @for (cr of r.credentials; track cr.id) {
                                  <div class="ws-cred-item">
                                    <span class="ws-cred-key">{{ cr.fieldKey }}</span>
                                    <span class="ws-cred-val" [class.revealed]="visibleValues()[cr.id]">
                                      {{ visibleValues()[cr.id] ? (revealedValues()[cr.id] ?? '••••••') : '••••••' }}
                                    </span>
                                    <button type="button" class="ws-cred-btn" [disabled]="revealingIds()[cr.id]"
                                      (click)="toggleReveal(cr.id)" [title]="visibleValues()[cr.id] ? 'Gizle' : 'Göster'">
                                      @if (revealingIds()[cr.id]) { <i class="pi pi-spin pi-spinner"></i> }
                                      @else { <i class="pi" [ngClass]="visibleValues()[cr.id] ? 'pi-eye-slash' : 'pi-eye'"></i> }
                                    </button>
                                    <button type="button" class="ws-cred-btn" [disabled]="revealingIds()[cr.id]"
                                      (click)="copyCredential(cr.id)" [title]="copiedIds()[cr.id] ? 'Kopyalandı' : 'Kopyala'">
                                      <i class="pi" [ngClass]="copiedIds()[cr.id] ? 'pi-check' : 'pi-copy'"></i>
                                    </button>
                                  </div>
                                }
                              </div>
                            }
                          }
                        </div>
                      }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .workspace-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 1.5rem; }
    .ws-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .ws-title { display: flex; align-items: center; gap: 0.5rem; i { color: #3B82F6; } h2 { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; } }
    .ws-controls { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .scope-toggle { display: inline-flex; border: 1px solid #D1D5DB; border-radius: 0.5rem; overflow: hidden;
      button { background: white; border: none; padding: 0.375rem 0.75rem; font-size: 0.8125rem; color: #6B7280; cursor: pointer; &:first-child { border-right: 1px solid #D1D5DB; } &.active { background: #EFF6FF; color: #2563EB; font-weight: 600; } &:hover:not(.active) { background: #F9FAFB; } } }
    .ws-filter { position: relative; display: flex; align-items: center;
      i.pi-search { position: absolute; left: 0.625rem; color: #9CA3AF; font-size: 0.8125rem; }
      input { padding: 0.4rem 1.75rem 0.4rem 1.875rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.8125rem; width: 16rem; color: #111827; &:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); } } }
    .ws-filter-clear { position: absolute; right: 0.375rem; background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 0.25rem; &:hover { color: #374151; } }

    .ws-state { text-align: center; padding: 2.5rem; color: #9CA3AF; i { font-size: 1.75rem; display: block; margin-bottom: 0.5rem; } p { font-size: 0.875rem; } }

    .ws-typefilters { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; padding: 0.75rem; margin-bottom: 1rem; background: #F9FAFB; border: 1px solid #F3F4F6; border-radius: 0.5rem; }
    .ws-tf-group { display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem; }
    .ws-tf-label { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-right: 0.125rem; i { font-size: 0.75rem; } }
    .ws-tf-chip { background: white; border: 1px solid #D1D5DB; color: #374151; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; cursor: pointer; transition: all 0.12s; &:hover { border-color: #93C5FD; background: #EFF6FF; } &.active { background: #2563EB; border-color: #2563EB; color: white; } }
    .ws-tf-chip--ep { &:hover { border-color: #6EE7B7; background: #ECFDF5; } &.active { background: #059669; border-color: #059669; color: white; } }
    .ws-tf-clear { margin-left: auto; background: none; border: none; color: #9CA3AF; font-size: 0.75rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.2rem 0.4rem; border-radius: 0.25rem; &:hover { color: #DC2626; background: #FEF2F2; } i { font-size: 0.7rem; } }

    .ws-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .ws-customer { border: 1px solid #E5E7EB; border-radius: 0.5rem; overflow: hidden; }
    .ws-customer-head { width: 100%; display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem 0.875rem; background: #F9FAFB; border: none; cursor: pointer; text-align: left; &:hover { background: #F3F4F6; } i { color: #9CA3AF; font-size: 0.75rem; flex-shrink: 0; } }
    .ws-customer-name { font-weight: 600; color: #111827; font-size: 0.9375rem; flex-shrink: 0; }
    .ws-customer-code { background: #E5E7EB; color: #6B7280; padding: 0.1rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.7rem; flex-shrink: 0; }
    .ws-product-chips { display: flex; gap: 0.25rem; flex-wrap: wrap; flex: 1; }
    .ws-chip { background: #EDE9FE; color: #5B21B6; padding: 0.1rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; }
    .ws-customer-meta { font-size: 0.75rem; color: #9CA3AF; flex-shrink: 0; }

    .ws-product-list { display: flex; flex-direction: column; }
    .ws-product-group { border-top: 1px solid #E5E7EB; }
    .ws-product-title { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 0.875rem; font-size: 0.9375rem; font-weight: 700; color: #111827; background: #FAFAFA; i { color: #6366F1; font-size: 0.875rem; } }
    .ws-env-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; padding: 0.75rem 0.875rem; align-items: flex-start; }
    .ws-env { flex: 1 1 320px; min-width: 280px; max-width: 520px; border: 1px solid #E5E7EB; border-radius: 0.5rem; padding: 0.625rem 0.75rem; background: #FCFCFD; }
    .ws-env-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #F3F4F6; }
    .ws-env-badge { padding: 0.2rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
    .ws-env-name { font-weight: 500; color: #374151; font-size: 0.8125rem; }
    .ws-env-link { margin-left: auto; font-size: 0.75rem; color: #3B82F6; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem; flex-shrink: 0; &:hover { text-decoration: underline; } i { font-size: 0.65rem; } }
    .ws-empty-env { font-size: 0.75rem; color: #9CA3AF; padding: 0.25rem 0; }

    .ws-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; padding: 0.3rem 0; font-size: 0.8125rem; min-width: 0; }
    .ws-row-name--link { color: #3B82F6; text-decoration: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; &:hover { text-decoration: underline; } i { font-size: 0.6rem; } }
    .ws-no-url { font-size: 0.7rem; color: #9CA3AF; font-style: italic; }
    .ws-row-icon { color: #6B7280; font-size: 0.8125rem; flex-shrink: 0; width: 1rem; text-align: center; }
    .ws-row--resource .ws-row-icon { color: #0891B2; }
    .ws-row-name { font-weight: 500; color: #374151; flex-shrink: 0; }
    .ws-url { color: #3B82F6; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-flex; align-items: center; gap: 0.25rem; max-width: 24rem; &:hover { text-decoration: underline; } i { font-size: 0.65rem; flex-shrink: 0; } }
    .ws-copy { background: none; border: 1px solid #E5E7EB; border-radius: 0.25rem; padding: 0.1rem 0.375rem; cursor: pointer; color: #9CA3AF; font-size: 0.7rem; flex-shrink: 0; &:hover { background: #F3F4F6; color: #374151; } }
    .ws-mini-link { color: #9CA3AF; text-decoration: none; padding: 0.1rem 0.25rem; border-radius: 0.25rem; flex-shrink: 0; &:hover { color: #3B82F6; background: #EFF6FF; } i { font-size: 0.75rem; } }
    .ws-auth-badge { background: #FEF3C7; color: #92400E; padding: 0.1rem 0.4rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; display: inline-flex; align-items: center; gap: 0.25rem; flex-shrink: 0; i { font-size: 0.65rem; } }
    .ws-res-type { font-size: 0.75rem; color: #6B7280; }
    .ws-shared { background: #EDE9FE; color: #5B21B6; padding: 0.1rem 0.4rem; border-radius: 9999px; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 0.25rem; flex-shrink: 0; i { font-size: 0.65rem; } }
    .ws-cred { margin-left: auto; background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; border-radius: 9999px; padding: 0.1rem 0.5rem; font-size: 0.7rem; text-decoration: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; flex-shrink: 0; &:hover { background: #FEF3C7; } &.active { background: #FEF3C7; border-color: #FBBF24; } i { font-size: 0.65rem; } }

    .ws-cred-panel { margin: 0.125rem 0 0.375rem 1.25rem; padding: 0.5rem 0.625rem; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 0.5rem; display: flex; flex-direction: column; gap: 0.3rem; }
    .ws-cred-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; }
    .ws-cred-key { font-weight: 600; color: #92400E; min-width: 7rem; flex-shrink: 0; }
    .ws-cred-val { font-family: monospace; color: #9CA3AF; letter-spacing: 0.08em; flex: 1; min-width: 0; word-break: break-all; &.revealed { color: #065F46; background: #D1FAE5; padding: 0.1rem 0.4rem; border-radius: 0.25rem; letter-spacing: normal; } }
    .ws-cred-btn { background: white; border: 1px solid #FDE68A; border-radius: 0.25rem; padding: 0.15rem 0.4rem; cursor: pointer; color: #B45309; font-size: 0.7rem; flex-shrink: 0; &:hover:not(:disabled) { background: #FEF3C7; } &:disabled { opacity: 0.5; cursor: default; } i { font-size: 0.7rem; } }
  `]
})
export class WorkspaceWidgetComponent implements OnInit {
  private http = inject(HttpClient);

  customers = signal<WorkspaceCustomer[]>([]);
  loading = signal(true);
  allCustomers = signal(false);
  filter = signal('');
  selectedResourceTypes = signal<Set<string>>(new Set());
  selectedEndpointTypes = signal<Set<string>>(new Set());
  private collapsed = signal<Set<string>>(new Set());

  // Yüklü veriden türetilen mevcut tipler (boş filtre gösterilmez)
  availableResourceTypes = computed(() => {
    const set = new Set<string>();
    for (const c of this.customers())
      for (const e of c.environments)
        for (const r of e.resources) set.add(r.resourceTypeName);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  });

  availableEndpointTypes = computed(() => {
    const set = new Set<string>();
    for (const c of this.customers())
      for (const e of c.environments)
        for (const ep of e.endpoints) set.add(ep.endpointType);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  });

  hasActiveTypeFilter = computed(() =>
    this.selectedResourceTypes().size > 0 || this.selectedEndpointTypes().size > 0);

  filteredCustomers = computed(() => {
    const term = this.filter().trim().toLowerCase();
    const selRes = this.selectedResourceTypes();
    const selEp = this.selectedEndpointTypes();
    const resActive = selRes.size > 0;
    const epActive = selEp.size > 0;
    const anyType = resActive || epActive;

    if (!term && !anyType) return this.customers();

    const result: WorkspaceCustomer[] = [];
    for (const c of this.customers()) {
      const customerMatches = !!term && (
        c.customerName.toLowerCase().includes(term) ||
        c.customerCode.toLowerCase().includes(term) ||
        c.products.some(p => p.toLowerCase().includes(term)));

      const envs: WorkspaceEnvironment[] = [];
      for (const e of c.environments) {
        const envTextMatch = !term || customerMatches ||
          e.name.toLowerCase().includes(term) ||
          e.productName.toLowerCase().includes(term) ||
          e.environmentTypeName.toLowerCase().includes(term);

        let endpoints = e.endpoints;
        let resources = e.resources;

        // Metin filtresi: ortam adı eşleşmiyorsa satırları süz
        if (term && !envTextMatch) {
          endpoints = endpoints.filter(ep =>
            ep.name.toLowerCase().includes(term) || ep.baseUrl.toLowerCase().includes(term));
          resources = resources.filter(r =>
            r.templateName.toLowerCase().includes(term) ||
            r.resourceTypeName.toLowerCase().includes(term));
          if (!endpoints.length && !resources.length) continue;
        }

        // Tip filtresi (odak modu)
        if (anyType) {
          endpoints = epActive ? endpoints.filter(ep => selEp.has(ep.endpointType)) : [];
          resources = resActive ? resources.filter(r => selRes.has(r.resourceTypeName)) : [];
          if (!endpoints.length && !resources.length) continue;
        }

        envs.push(endpoints === e.endpoints && resources === e.resources
          ? e
          : { ...e, endpoints, resources });
      }

      if (envs.length) result.push({ ...c, environments: envs });
    }
    return result;
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.http.get<WorkspaceCustomer[]>(
      `${environment.apiUrl}/dashboard/my-workspace?allCustomers=${this.allCustomers()}`)
      .subscribe({
        next: data => { this.customers.set(data); this.loading.set(false); },
        error: () => { this.customers.set([]); this.loading.set(false); }
      });
  }

  setScope(all: boolean): void {
    if (this.allCustomers() === all) return;
    this.allCustomers.set(all);
    this.load();
  }

  isExpanded(customerId: string): boolean {
    if (this.filter().trim() || this.hasActiveTypeFilter()) return true;
    return !this.collapsed().has(customerId);
  }

  toggleResourceType(type: string): void {
    this.selectedResourceTypes.update(set => {
      const next = new Set(set);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  toggleEndpointType(type: string): void {
    this.selectedEndpointTypes.update(set => {
      const next = new Set(set);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  clearTypeFilters(): void {
    this.selectedResourceTypes.set(new Set());
    this.selectedEndpointTypes.set(new Set());
  }

  epTypeLabel(type: string): string {
    const map: Record<string, string> = {
      RestAPI: 'REST API', Grpc: 'gRPC', Soap: 'SOAP', GraphQL: 'GraphQL', Frontend: 'Frontend'
    };
    return map[type] ?? type;
  }

  toggle(customerId: string): void {
    this.collapsed.update(set => {
      const next = new Set(set);
      next.has(customerId) ? next.delete(customerId) : next.add(customerId);
      return next;
    });
  }

  envColor(e: WorkspaceEnvironment, alpha: number): string {
    const c = e.environmentTypeColor ?? '#6B7280';
    return c + Math.round(alpha * 255).toString(16).padStart(2, '0');
  }

  epTypeIcon(type: string): string {
    const map: Record<string, string> = {
      Frontend: 'pi-desktop', RestAPI: 'pi-server', Grpc: 'pi-bolt',
      Soap: 'pi-code', GraphQL: 'pi-share-alt'
    };
    return map[type] ?? 'pi-link';
  }

  authLabel(name: string): string {
    const map: Record<string, string> = {
      BasicAuth: 'Basic', BearerToken: 'Bearer', ApiKey: 'API Key', OAuth2: 'OAuth2'
    };
    return map[name] ?? name;
  }

  getProductGroups(environments: WorkspaceEnvironment[]): { productName: string; environments: WorkspaceEnvironment[] }[] {
    const map = new Map<string, WorkspaceEnvironment[]>();
    for (const e of environments) {
      const list = map.get(e.productName) ?? [];
      list.push(e);
      map.set(e.productName, list);
    }
    return Array.from(map.entries()).map(([productName, envs]) => ({ productName, environments: envs }));
  }

  copy(text: string): void {
    navigator.clipboard.writeText(text);
  }

  // --- Credential peek state ---
  private expandedPanels = signal<Set<string>>(new Set());
  revealedValues = signal<Record<string, string>>({});
  visibleValues = signal<Record<string, boolean>>({});
  revealingIds = signal<Record<string, boolean>>({});
  copiedIds = signal<Record<string, boolean>>({});

  isPanelOpen(key: string): boolean {
    return this.expandedPanels().has(key);
  }

  togglePanel(key: string): void {
    this.expandedPanels.update(set => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  toggleReveal(credId: string): void {
    if (this.visibleValues()[credId]) {
      this.visibleValues.update(v => ({ ...v, [credId]: false }));
      return;
    }
    if (this.revealedValues()[credId] !== undefined) {
      this.visibleValues.update(v => ({ ...v, [credId]: true }));
      return;
    }
    this.revealingIds.update(v => ({ ...v, [credId]: true }));
    this.http.get<{ value: string }>(`${environment.apiUrl}/credentials/${credId}/reveal`).subscribe({
      next: res => {
        this.revealedValues.update(v => ({ ...v, [credId]: res.value }));
        this.visibleValues.update(v => ({ ...v, [credId]: true }));
        this.revealingIds.update(v => ({ ...v, [credId]: false }));
      },
      error: () => this.revealingIds.update(v => ({ ...v, [credId]: false }))
    });
  }

  copyCredential(credId: string): void {
    const cached = this.revealedValues()[credId];
    if (cached !== undefined) {
      navigator.clipboard.writeText(cached);
      this.flashCopied(credId);
      return;
    }
    this.revealingIds.update(v => ({ ...v, [credId]: true }));
    this.http.get<{ value: string }>(`${environment.apiUrl}/credentials/${credId}/reveal`).subscribe({
      next: res => {
        this.revealedValues.update(v => ({ ...v, [credId]: res.value }));
        this.revealingIds.update(v => ({ ...v, [credId]: false }));
        navigator.clipboard.writeText(res.value);
        this.flashCopied(credId);
      },
      error: () => this.revealingIds.update(v => ({ ...v, [credId]: false }))
    });
  }

  private flashCopied(credId: string): void {
    this.copiedIds.update(v => ({ ...v, [credId]: true }));
    setTimeout(() => this.copiedIds.update(v => ({ ...v, [credId]: false })), 1500);
  }
}
