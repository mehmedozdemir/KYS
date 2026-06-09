import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { CustomFieldInputsComponent, CustomFieldDef } from '../../../shared/components/custom-field-inputs/custom-field-inputs.component';

const CUST_STATUS: Record<string, string> = { Prospect: 'Potansiyel', Onboarding: 'Onboarding', Active: 'Aktif', Inactive: 'Pasif', Churned: 'Ayrıldı' };
const CUST_STATUS_CSS: Record<string, string> = { Prospect: 'badge--prospect', Onboarding: 'badge--onboarding', Active: 'badge--active', Inactive: 'badge--inactive', Churned: 'badge--churned' };
const USAGE_MODE: Record<string, string> = { SaaS: 'SaaS', Dedicated: 'Dedicated' };
const USAGE_MODE_CSS: Record<string, string> = { SaaS: 'badge--saas', Dedicated: 'badge--custom' };
const CP_STATUS: Record<string, string> = { Onboarding: 'Onboarding', Active: 'Aktif', Inactive: 'Pasif', Discontinued: 'Kapatıldı' };
const CP_STATUS_CSS: Record<string, string> = { Onboarding: 'badge--onboarding', Active: 'badge--active', Inactive: 'badge--inactive', Discontinued: 'badge--archived' };

interface EnvironmentSummary {
  id: string;
  name: string;
  environmentTypeName: string;
  environmentTypeCode: string;
  environmentTypeColor: string | null;
  isActive: boolean;
  resourceCount: number;
  endpointCount: number;
  notes: string | null;
  hostingPlatformName: string | null;
  hostingPlatformIcon: string | null;
  hostingPlatformColor: string | null;
}

interface EnvironmentType {
  id: string;
  name: string;
  code: string;
  color: string | null;
}

interface HostingPlatformOption {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  code: string;
}

interface CustomerProduct {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  usageMode: string;
  status: string;
  goLiveAt: string | null;
}

interface CustomerDetail {
  id: string;
  name: string;
  code: string;
  shortName: string | null;
  description: string | null;
  sector: string | null;
  country: string | null;
  city: string | null;
  status: string;
  isArchived: boolean;
  archivedAt: string | null;
  onboardingStartedAt: string | null;
  testEnvReadyAt: string | null;
  prodEnvReadyAt: string | null;
  productionLiveAt: string | null;
  serviceEndedAt: string | null;
  churnReason: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  products: CustomerProduct[];
  customFields: Record<string, unknown>;
}

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [RouterLink, NgClass, DatePipe, FormsModule, CustomFieldInputsComponent],
  template: `
    <div class="page-content">
      @if (loading()) {
        <div class="loading-state">Yükleniyor...</div>
      } @else if (!customer()) {
        <div class="loading-state">Müşteri bulunamadı. <a routerLink="/customers">← Geri dön</a></div>
      } @else {
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a routerLink="/customers">Müşteriler</a>
          <span>/</span>
          <span>{{ customer()!.name }}</span>
        </div>

        <!-- Header -->
        <div class="header-card">
          <div class="header-main">
            <div class="cust-avatar">{{ customer()!.name[0] }}</div>
            <div>
              <div class="header-top">
                <h1>{{ customer()!.name }}</h1>
                @if (customer()!.shortName) {
                  <span class="short-name">{{ customer()!.shortName }}</span>
                }
                <code class="code-badge">{{ customer()!.code }}</code>
              </div>
              @if (customer()!.description) {
                <p class="header-desc">{{ customer()!.description }}</p>
              }
              @if (customer()!.sector || customer()!.country) {
                <p class="header-meta">
                  @if (customer()!.sector) { <span>{{ customer()!.sector }}</span> }
                  @if (customer()!.sector && customer()!.country) { <span>·</span> }
                  @if (customer()!.country) { <span>{{ customer()!.city ? customer()!.city + ', ' : '' }}{{ customer()!.country }}</span> }
                </p>
              }
            </div>
          </div>
          <div class="header-right">
            <span class="badge" [ngClass]="statusCss(customer()!.status)">{{ statusLabel(customer()!.status) }}</span>
            @if (customer()!.isArchived) {
              <span class="badge badge--archived">Arşivlendi</span>
            }
            <button type="button" class="btn-edit" (click)="openStatusChange()">
              <i class="pi pi-sync"></i> Durum
            </button>
            <button type="button" class="btn-edit" (click)="openEdit()">
              <i class="pi pi-pencil"></i> Düzenle
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn" [class.active]="activeTab() === 'info'" (click)="activeTab.set('info')">
            Genel Bilgiler
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'products'" (click)="activeTab.set('products')">
            Ürünler
            <span class="tab-count">{{ customer()!.products.length }}</span>
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'lifecycle'" (click)="activeTab.set('lifecycle')">
            Lifecycle
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'environments'" (click)="onEnvironmentsTab()">
            Ortamlar
          </button>
        </div>

        <!-- Tab: Genel Bilgiler -->
        @if (activeTab() === 'info') {
          <div class="tab-content">
            <div class="info-grid">
              <div class="info-item">
                <label>Sektör</label>
                <span>{{ customer()!.sector ?? '—' }}</span>
              </div>
              <div class="info-item">
                <label>Ülke / Şehir</label>
                <span>{{ location(customer()!) }}</span>
              </div>
              <div class="info-item">
                <label>Go-Live Tarihi</label>
                <span>{{ customer()!.productionLiveAt ? (customer()!.productionLiveAt | date:'dd.MM.yyyy') : '—' }}</span>
              </div>
              @if (customer()!.isArchived) {
                <div class="info-item">
                  <label>Arşivlenme</label>
                  <span>{{ customer()!.archivedAt ? (customer()!.archivedAt | date:'dd.MM.yyyy') : '—' }}</span>
                </div>
                @if (customer()!.churnReason) {
                  <div class="info-item span-full">
                    <label>Ayrılma Nedeni</label>
                    <span>{{ customer()!.churnReason }}</span>
                  </div>
                }
              }
            </div>

            <app-custom-field-inputs
              [defs]="customFieldDefs()"
              [values]="customer()!.customFields ?? {}"
              mode="view" />

            @if (customer()!.primaryContactName) {
              <div class="contact-card">
                <h3>Birincil İletişim</h3>
                <div class="contact-info">
                  <div class="contact-avatar">{{ customer()!.primaryContactName![0] }}</div>
                  <div>
                    <p class="contact-name">{{ customer()!.primaryContactName }}</p>
                    @if (customer()!.primaryContactEmail) {
                      <a [href]="'mailto:' + customer()!.primaryContactEmail" class="contact-link">
                        <i class="pi pi-envelope"></i> {{ customer()!.primaryContactEmail }}
                      </a>
                    }
                    @if (customer()!.primaryContactPhone) {
                      <p class="contact-phone"><i class="pi pi-phone"></i> {{ customer()!.primaryContactPhone }}</p>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Tab: Ürünler -->
        @if (activeTab() === 'products') {
          <div class="tab-content">
            <div class="section-action-row">
              <span class="section-count">{{ customer()!.products.length }} ürün</span>
              <button class="btn-sm" (click)="openAddProduct()">
                <i class="pi pi-plus"></i> Ürün Ekle
              </button>
            </div>
            @if (!customer()!.products.length) {
              <p class="empty-text">Ürün atanmamış.</p>
            } @else {
              <div class="product-grid">
                @for (cp of customer()!.products; track cp.id) {
                  <div class="product-card" [id]="'cp-' + cp.id">
                    <div class="pc-header">
                      <div class="pc-icon"><i class="pi pi-box"></i></div>
                      <div style="flex:1">
                        <a [routerLink]="['/products', cp.productId]" class="link">{{ cp.productName }}</a>
                        <code class="code-sm">{{ cp.productCode }}</code>
                      </div>
                      <button type="button" class="btn-icon-danger-sm" title="Ürünü kaldır"
                        [disabled]="removingProductId() === cp.id"
                        (click)="removeProduct(cp.id, cp.productName)">
                        @if (removingProductId() === cp.id) { <i class="pi pi-spin pi-spinner"></i> }
                        @else { <i class="pi pi-trash"></i> }
                      </button>
                    </div>
                    <div class="pc-badges">
                      <span class="badge" [ngClass]="usageModeCss(cp.usageMode)">{{ usageModeLabel(cp.usageMode) }}</span>
                      <span class="badge" [ngClass]="cpStatusCss(cp.status)">{{ cpStatusLabel(cp.status) }}</span>
                    </div>
                    @if (cp.goLiveAt) {
                      <p class="pc-date">Go-live: {{ cp.goLiveAt | date:'dd.MM.yyyy' }}</p>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab: Lifecycle -->
        @if (activeTab() === 'lifecycle') {
          <div class="tab-content">
            <div class="timeline">
              @for (step of lifecycleSteps(); track step.label) {
                <div class="timeline-step" [class.done]="!!step.date" [class.active]="step.active">
                  <div class="step-dot"></div>
                  <div class="step-content">
                    <span class="step-label">{{ step.label }}</span>
                    @if (step.date) {
                      <span class="step-date">{{ step.date | date:'dd.MM.yyyy' }}</span>
                    } @else {
                      <span class="step-pending">Henüz gerçekleşmedi</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Tab: Ortamlar -->
        @if (activeTab() === 'environments') {
          <div class="tab-content">
            @if (envLoading()) {
              <p class="empty-text">Yükleniyor...</p>
            } @else {
              @for (cp of nonSaasProducts(); track cp.id) {
                <div class="env-product-section">
                  <div class="env-section-header">
                    <div class="env-section-title">
                      <i class="pi pi-box"></i>
                      <a [routerLink]="['/products', cp.productId]" class="link">{{ cp.productName }}</a>
                      <code class="code-sm">{{ cp.productCode }}</code>
                      <span class="badge" [ngClass]="usageModeCss(cp.usageMode)">{{ usageModeLabel(cp.usageMode) }}</span>
                    </div>
                    <button class="btn-sm" (click)="openCreateEnv(cp.id)">
                      <i class="pi pi-plus"></i> Ortam Ekle
                    </button>
                  </div>
                  @let envs = envsForProduct(cp.id);
                  @if (!envs.length) {
                    <p class="env-empty">Bu ürün için ortam tanımlanmamış.</p>
                  } @else {
                    <div class="env-card-row">
                      @for (e of envs; track e.id) {
                        <div class="env-card" [style.border-left-color]="e.environmentTypeColor ?? '#6B7280'">
                          <div class="env-card-top">
                            <span class="env-type-badge"
                              [style.background]="hexAlpha(e.environmentTypeColor ?? '#6B7280', 0.12)"
                              [style.color]="e.environmentTypeColor ?? '#6B7280'">
                              {{ e.environmentTypeName }}
                            </span>
                            @if (e.hostingPlatformName) {
                              <span class="plat-badge-sm"
                                [style.background]="hexAlpha(e.hostingPlatformColor ?? '#6B7280', 0.14)"
                                [style.color]="e.hostingPlatformColor ?? '#6B7280'">
                                <i class="pi" [ngClass]="e.hostingPlatformIcon ?? 'pi-server'"></i> {{ e.hostingPlatformName }}
                              </span>
                            }
                            @if (!e.isActive) {
                              <span class="badge badge--inactive">Pasif</span>
                            }
                          </div>
                          <h4 class="env-name">{{ e.name }}</h4>
                          <div class="env-stats">
                            <span><i class="pi pi-database"></i> {{ e.resourceCount }} kaynak</span>
                            <span><i class="pi pi-link"></i> {{ e.endpointCount }} endpoint</span>
                          </div>
                          <div class="env-card-footer">
                            <a [routerLink]="['/environments', e.id]" class="env-detail-link">
                              Detay <i class="pi pi-arrow-right"></i>
                            </a>
                            <button type="button" class="btn-icon-danger-sm" title="Ortamı kaldır"
                              [disabled]="removingEnvId() === e.id"
                              (click)="removeEnvironment(e.id, e.name)">
                              @if (removingEnvId() === e.id) { <i class="pi pi-spin pi-spinner"></i> }
                              @else { <i class="pi pi-trash"></i> }
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
              @if (!nonSaasProducts().length) {
                <p class="empty-text">Bu müşterinin tüm ürünleri SaaS modunda olduğundan ortam tanımlanamaz.</p>
              }
            }
          </div>
        }
      }
    </div>

    <!-- Add Product Modal -->
    @if (showAddProductModal()) {
      <div class="modal-backdrop" (click)="showAddProductModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Ürün Ekle</h2>
            <button class="modal-close" (click)="showAddProductModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Ürün <span class="required">*</span></label>
              <select [(ngModel)]="addProductForm.productId" [class.input-error]="addProductSubmitted() && !addProductForm.productId">
                <option value="">Ürün seçin...</option>
                @for (p of availableProducts(); track p.id) {
                  <option [value]="p.id">{{ p.name }} ({{ p.code }})</option>
                }
              </select>
              @if (addProductSubmitted() && !addProductForm.productId) {
                <span class="error-msg">Ürün seçimi zorunludur</span>
              }
            </div>
            <div class="form-group">
              <label>Kullanım Modu <span class="required">*</span></label>
              <select [(ngModel)]="addProductForm.usageMode">
                <option value="0">SaaS — Paylaşımlı (ortam tanımlanamaz)</option>
                <option value="1">Dedicated — Müşteriye özel (ortam tanımlanabilir)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Notlar</label>
              <textarea [(ngModel)]="addProductForm.notes" rows="2" placeholder="İsteğe bağlı not..."></textarea>
            </div>
            @if (addProductError()) {
              <div class="alert-error">{{ addProductError() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showAddProductModal.set(false)">İptal</button>
            <button class="btn-save" [disabled]="addProductSaving()" (click)="saveAddProduct()">
              {{ addProductSaving() ? 'Ekleniyor...' : 'Ekle' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Edit Customer Modal -->
    @if (showEditModal()) {
      <div class="modal-backdrop" (click)="showEditModal.set(false)">
        <div class="modal modal--wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Müşteriyi Düzenle</h2>
            <button type="button" class="modal-close" (click)="showEditModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (editError()) {
              <div class="alert-error">{{ editError() }}</div>
            }
            <div class="form-row">
              <div class="form-group">
                <label>Müşteri Adı <span class="required">*</span></label>
                <input type="text" [(ngModel)]="editForm.name" [class.input-error]="editSubmitted() && !editForm.name.trim()" />
                @if (editSubmitted() && !editForm.name.trim()) {
                  <span class="error-msg">Zorunlu alan</span>
                }
              </div>
              <div class="form-group">
                <label>Kısa Ad</label>
                <input type="text" [(ngModel)]="editForm.shortName" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Sektör</label>
                <input type="text" [(ngModel)]="editForm.sector" />
              </div>
              <div class="form-group">
                <label>Ülke</label>
                <input type="text" [(ngModel)]="editForm.country" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Şehir</label>
                <input type="text" [(ngModel)]="editForm.city" />
              </div>
              <div class="form-group"></div>
            </div>
            <div class="form-group">
              <label>Açıklama</label>
              <textarea [(ngModel)]="editForm.description" rows="2"></textarea>
            </div>
            <div class="section-title" style="margin-top:0.5rem">Birincil İletişim</div>
            <div class="form-row">
              <div class="form-group">
                <label>Ad Soyad</label>
                <input type="text" [(ngModel)]="editForm.primaryContactName" />
              </div>
              <div class="form-group">
                <label>E-posta</label>
                <input type="email" [(ngModel)]="editForm.primaryContactEmail" />
              </div>
            </div>
            <div class="form-group">
              <label>Telefon</label>
              <input type="tel" [(ngModel)]="editForm.primaryContactPhone" />
            </div>
            <app-custom-field-inputs
              [defs]="customFieldDefs()"
              [editValues]="editCfValues"
              [submitted]="editSubmitted()"
              mode="edit" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="showEditModal.set(false)">İptal</button>
            <button type="button" class="btn-save" [disabled]="editSaving()" (click)="saveEdit()">
              {{ editSaving() ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Status Change Modal -->
    @if (showStatusModal()) {
      <div class="modal-backdrop" (click)="showStatusModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Durum Değiştir</h2>
            <button type="button" class="modal-close" (click)="showStatusModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (statusChangeError()) {
              <div class="alert-error">{{ statusChangeError() }}</div>
            }
            <div class="form-group">
              <label>Yeni Durum <span class="required">*</span></label>
              <select [(ngModel)]="statusForm.newStatus">
                <option value="Prospect">Potansiyel</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Active">Aktif</option>
                <option value="Inactive">Pasif</option>
                <option value="Churned">Ayrıldı (Churned)</option>
              </select>
            </div>
            @if (statusForm.newStatus === 'Churned') {
              <div class="form-group">
                <label>Hizmet Bitiş Tarihi</label>
                <input type="date" [(ngModel)]="statusForm.serviceEndedAt" />
              </div>
              <div class="form-group">
                <label>Ayrılma Nedeni</label>
                <textarea [(ngModel)]="statusForm.churnReason" rows="3" placeholder="İsteğe bağlı neden..."></textarea>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="showStatusModal.set(false)">İptal</button>
            <button type="button" class="btn-save" [disabled]="statusChangeSaving()" (click)="saveStatusChange()">
              {{ statusChangeSaving() ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Create Environment Modal -->
    @if (showEnvModal()) {
      <div class="modal-backdrop" (click)="showEnvModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Yeni Ortam</h2>
            <button class="modal-close" (click)="showEnvModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Ortam Tipi <span class="required">*</span></label>
              <select [(ngModel)]="envForm.environmentTypeId" [class.input-error]="envFormSubmitted() && !envForm.environmentTypeId">
                <option value="">Tip seçin...</option>
                @for (t of envTypes(); track t.id) {
                  <option [value]="t.id">{{ t.name }}</option>
                }
              </select>
              @if (envFormSubmitted() && !envForm.environmentTypeId) {
                <span class="error-msg">Tip zorunludur</span>
              }
            </div>
            <div class="form-group">
              <label>Barındırma Platformu</label>
              <select [(ngModel)]="envForm.hostingPlatformId">
                <option value="">— (belirtilmedi)</option>
                @for (p of hostingPlatforms(); track p.id) {
                  <option [value]="p.id">{{ p.name }}</option>
                }
              </select>
            </div>
            @if (envFormError()) {
              <div class="alert-error">{{ envFormError() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showEnvModal.set(false)">İptal</button>
            <button class="btn-save" [disabled]="envFormSaving()" (click)="saveEnv()">
              {{ envFormSaving() ? 'Kaydediliyor...' : 'Oluştur' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-state { text-align: center; padding: 4rem; color: var(--text-subtle); }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.25rem; a { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } } }

    .header-card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.5rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); flex-wrap: wrap; }
    .header-main { display: flex; align-items: flex-start; gap: 1rem; }
    .cust-avatar { width: 3rem; height: 3rem; border-radius: 0.5rem; background: var(--warning-soft-bg); color: var(--warning-soft-text); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; flex-shrink: 0; }
    .header-top { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; h1 { font-size: 1.25rem; font-weight: 700; color: var(--text-strong); } }
    .short-name { font-size: 0.875rem; color: var(--text-muted); }
    .code-badge { background: var(--surface-3); color: var(--text); padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8125rem; }
    .header-desc { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }
    .header-meta { display: flex; gap: 0.5rem; font-size: 0.8125rem; color: var(--text-subtle); margin-top: 0.25rem; }
    .header-right { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.25rem; align-items: center; }
    .btn-edit { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; &:hover { background: var(--surface-2); border-color: var(--primary); color: var(--primary); } }

    .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 1.25rem; }
    .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: none; border: none; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color 0.15s; &:hover { color: var(--text); } &.active { color: var(--primary); border-bottom-color: var(--primary); } }
    .tab-count { background: var(--surface-3); color: var(--text-muted); border-radius: 9999px; padding: 0 0.375rem; font-size: 0.75rem; }
    .tab-btn.active .tab-count { background: var(--primary-soft-bg-2); color: var(--primary-strong); }

    .tab-content { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-text { color: var(--text-subtle); font-size: 0.875rem; text-align: center; padding: 2rem; }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.25rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.75rem; font-weight: 600; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; } span { font-size: 0.875rem; color: var(--text-strong); } }
    .span-full { grid-column: 1 / -1; }
    .link { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } }

    .custom-fields-section { margin-top: 1rem; h3 { font-size: 0.875rem; font-weight: 600; color: var(--text); margin-bottom: 0.75rem; } }
    .contact-card { margin-top: 0.5rem; background: var(--surface-2); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; h3 { font-size: 0.875rem; font-weight: 600; color: var(--text); margin-bottom: 0.75rem; } }
    .contact-info { display: flex; align-items: flex-start; gap: 0.75rem; }
    .contact-avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--primary-soft-bg-2); color: var(--primary-strong); display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; flex-shrink: 0; }
    .contact-name { font-weight: 500; color: var(--text-strong); font-size: 0.875rem; }
    .contact-link { font-size: 0.8125rem; color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 0.375rem; margin-top: 0.25rem; &:hover { text-decoration: underline; } i { font-size: 0.75rem; } }
    .contact-phone { font-size: 0.8125rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.375rem; margin-top: 0.125rem; i { font-size: 0.75rem; } }

    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; }
    .product-card { background: var(--surface-2); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; }
    .pc-header { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.625rem; }
    .pc-icon { width: 2rem; height: 2rem; border-radius: 0.375rem; background: var(--success-soft-bg); color: var(--success-strong); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .code-sm { background: var(--border); color: var(--text-muted); padding: 0 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem; margin-left: 0.25rem; }
    .pc-badges { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-bottom: 0.375rem; }
    .pc-date { font-size: 0.75rem; color: var(--text-subtle); margin-top: 0.375rem; }

    .timeline { display: flex; flex-direction: column; gap: 0; }
    .timeline-step { display: flex; align-items: flex-start; gap: 1rem; padding: 0.875rem 0; position: relative; &:not(:last-child)::before { content: ''; position: absolute; left: 0.5625rem; top: 2.25rem; bottom: 0; width: 2px; background: var(--border); } }
    .step-dot { width: 1.25rem; height: 1.25rem; border-radius: 50%; border: 2px solid var(--border-strong); background: var(--surface); flex-shrink: 0; margin-top: 0.125rem; }
    .timeline-step.done .step-dot { border-color: var(--success); background: var(--success); }
    .timeline-step.active .step-dot { border-color: var(--primary); background: var(--primary); box-shadow: 0 0 0 4px rgba(59,130,246,0.2); }
    .step-content { display: flex; flex-direction: column; gap: 0.125rem; }
    .step-label { font-size: 0.875rem; font-weight: 500; color: var(--text); }
    .step-date { font-size: 0.8125rem; color: var(--success-strong); }
    .step-pending { font-size: 0.8125rem; color: var(--text-subtle); }

    .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--prospect { background: var(--surface-3); color: var(--text-muted); }
    .badge--onboarding { background: var(--primary-soft-bg-2); color: var(--primary-soft-text); }
    .badge--active { background: var(--success-soft-bg); color: var(--success-soft-text); }
    .badge--inactive { background: var(--warning-soft-bg); color: var(--warning-soft-text); }
    .badge--churned { background: var(--danger-soft-bg); color: var(--danger-soft-text); }
    .badge--archived { background: var(--surface-3); color: var(--text-muted); }
    .badge--saas { background: var(--primary-soft-bg-2); color: var(--primary-soft-text); }
    .badge--custom { background: var(--violet-soft-bg); color: var(--violet-soft-text); }

    /* Ortamlar tab */
    .section-action-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .section-count { font-size: 0.875rem; color: var(--text-muted); }
    .env-product-section { margin-bottom: 1.5rem; &:last-child { margin-bottom: 0; } }
    .env-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
    .env-section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; font-weight: 600; color: var(--text); i { color: var(--text-muted); font-size: 0.875rem; } }
    .code-sm { background: var(--border); color: var(--text-muted); padding: 0 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem; }
    .btn-sm { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.375rem 0.75rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; &:hover { background: var(--surface-2); border-color: var(--primary); color: var(--primary); } }
    .env-empty { font-size: 0.875rem; color: var(--text-subtle); padding: 0.75rem 0; }
    .env-card-row { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .env-card { background: var(--surface-2); border: 1px solid var(--border); border-left: 4px solid var(--text-muted); border-radius: 0.5rem; padding: 0.875rem 1rem; min-width: 200px; flex: 1; max-width: 280px; display: flex; flex-direction: column; gap: 0.5rem; }
    .env-card-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .env-type-badge { display: inline-flex; align-items: center; padding: 0.15rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
    .plat-badge-sm { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.5rem; border-radius: 9999px; font-size: 0.68rem; font-weight: 600; i { font-size: 0.65rem; } }
    .env-name { font-size: 0.9375rem; font-weight: 600; color: var(--text-strong); }
    .env-stats { display: flex; gap: 0.75rem; font-size: 0.75rem; color: var(--text-muted); i { font-size: 0.7rem; margin-right: 0.25rem; } }
    .env-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem; }
    .env-detail-link { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; color: var(--primary); text-decoration: none; font-weight: 500; &:hover { text-decoration: underline; } i { font-size: 0.7rem; } }
    .btn-icon-danger-sm { background: none; border: none; cursor: pointer; color: var(--border-strong); padding: 0.2rem 0.3rem; border-radius: 0.25rem; font-size: 0.75rem; display: inline-flex; align-items: center; flex-shrink: 0; &:hover:not(:disabled) { color: var(--danger); background: var(--danger-faint-bg); } &:disabled { opacity: 0.5; cursor: not-allowed; } }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
    .modal--wide { max-width: 560px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 1.25rem; padding: 0.25rem; border-radius: 0.375rem; &:hover { background: var(--surface-3); } }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; flex: 1; min-height: 0; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0; }
    .section-title { font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid var(--surface-3); padding-top: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.8125rem; font-weight: 600; color: var(--text); } input, select, textarea { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; resize: vertical; background: var(--surface); &:focus { outline: none; border-color: var(--primary); } } }
    .input-error { border-color: var(--danger) !important; }
    .error-msg { font-size: 0.75rem; color: var(--danger); }
    .required { color: var(--danger); }
    .alert-error { padding: 0.75rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.375rem; color: var(--danger-soft-text); font-size: 0.8125rem; }
    .btn-cancel { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 0.5rem; padding: 0.5rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; &:hover { background: var(--surface-3); } }
    .btn-save { background: var(--primary); color: white; border: none; border-radius: 0.5rem; padding: 0.5rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; &:not(:disabled):hover { background: var(--primary-hover); } &:disabled { opacity: 0.6; cursor: not-allowed; } }
  `]
})
export class CustomerDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  customer = signal<CustomerDetail | null>(null);
  loading = signal(true);
  activeTab = signal('info');

  // Environments tab state
  private envMap = new Map<string, EnvironmentSummary[]>();
  envsByProduct = signal<Map<string, EnvironmentSummary[]>>(new Map());
  envLoading = signal(false);
  envTypes = signal<EnvironmentType[]>([]);
  private envTypesLoaded = false;
  hostingPlatforms = signal<HostingPlatformOption[]>([]);
  private hostingPlatformsLoaded = false;

  // Status change state
  showStatusModal = signal(false);
  statusChangeSaving = signal(false);
  statusChangeError = signal('');
  statusForm = { newStatus: 'Active', serviceEndedAt: '', churnReason: '' };

  openStatusChange() {
    const c = this.customer()!;
    this.statusForm = { newStatus: String(c.status), serviceEndedAt: '', churnReason: c.churnReason ?? '' };
    this.statusChangeError.set('');
    this.showStatusModal.set(true);
  }

  saveStatusChange() {
    this.statusChangeSaving.set(true);
    this.statusChangeError.set('');
    const id = this.customer()!.id;
    const newStatus = this.statusForm.newStatus;
    this.http.patch(`${environment.apiUrl}/customers/${id}/status`, {
      newStatus,
      serviceEndedAt: newStatus === 'Churned' && this.statusForm.serviceEndedAt ? this.statusForm.serviceEndedAt : null,
      churnReason: newStatus === 'Churned' && this.statusForm.churnReason.trim() ? this.statusForm.churnReason.trim() : null
    }).subscribe({
      next: () => {
        this.statusChangeSaving.set(false);
        this.showStatusModal.set(false);
        this.http.get<CustomerDetail>(`${environment.apiUrl}/customers/${id}`).subscribe(c => this.customer.set(c));
      },
      error: err => {
        this.statusChangeSaving.set(false);
        this.statusChangeError.set(err.error?.detail ?? 'Durum güncellenemedi');
      }
    });
  }

  // Add product state
  showAddProductModal = signal(false);
  private allProducts = signal<ProductOption[]>([]);
  addProductForm = { productId: '', usageMode: '1', notes: '' };
  addProductSubmitted = signal(false);
  addProductSaving = signal(false);
  addProductError = signal('');

  availableProducts() {
    const existing = new Set(this.customer()?.products.map(p => p.productId) ?? []);
    return this.allProducts().filter(p => !existing.has(p.id));
  }

  openAddProduct() {
    this.addProductForm = { productId: '', usageMode: '1', notes: '' };
    this.addProductSubmitted.set(false);
    this.addProductError.set('');
    this.showAddProductModal.set(true);
    if (!this.allProducts().length) {
      this.http.get<{ items: ProductOption[] }>(`${environment.apiUrl}/products?pageSize=200`).subscribe({
        next: r => this.allProducts.set(r.items)
      });
    }
  }

  saveAddProduct() {
    this.addProductSubmitted.set(true);
    if (!this.addProductForm.productId) return;
    this.addProductSaving.set(true);
    this.addProductError.set('');
    const customerId = this.customer()!.id;
    this.http.post(`${environment.apiUrl}/customers/${customerId}/products`, {
      productId: this.addProductForm.productId,
      usageMode: Number(this.addProductForm.usageMode),
      notes: this.addProductForm.notes.trim() || null
    }).subscribe({
      next: () => {
        this.addProductSaving.set(false);
        this.showAddProductModal.set(false);
        this.http.get<CustomerDetail>(`${environment.apiUrl}/customers/${customerId}`).subscribe({
          next: c => this.customer.set(c)
        });
      },
      error: err => {
        this.addProductSaving.set(false);
        this.addProductError.set(err.error?.detail ?? 'Ürün eklenemedi');
      }
    });
  }

  // Custom fields
  customFieldDefs = signal<CustomFieldDef[]>([]);
  private cfDefsLoaded = false;
  editCfValues: Record<string, string> = {};

  private loadCustomFieldDefs(onDone?: () => void): void {
    if (this.cfDefsLoaded) { onDone?.(); return; }
    this.http.get<CustomFieldDef[]>(`${environment.apiUrl}/custom-field-definitions?entityType=0`).subscribe({
      next: defs => {
        this.customFieldDefs.set(defs);
        this.cfDefsLoaded = true;
        onDone?.();
      }
    });
  }

  private buildCustomFields(defs: CustomFieldDef[], values: Record<string, string>): Record<string, unknown> | null {
    const result: Record<string, unknown> = {};
    let hasAny = false;
    for (const def of defs) {
      const raw = values[def.fieldKey];
      if (!raw && raw !== 'false') continue;
      hasAny = true;
      if (def.fieldType === 1) result[def.fieldKey] = Number(raw);
      else if (def.fieldType === 3) result[def.fieldKey] = raw === 'true';
      else result[def.fieldKey] = raw;
    }
    return hasAny ? result : null;
  }

  // Edit state
  showEditModal = signal(false);
  editSaving = signal(false);
  editSubmitted = signal(false);
  editError = signal('');
  editForm = { name: '', shortName: '', description: '', sector: '', country: '', city: '', primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '' };

  openEdit() {
    const c = this.customer()!;
    this.editForm = {
      name: c.name,
      shortName: c.shortName ?? '',
      description: c.description ?? '',
      sector: c.sector ?? '',
      country: c.country ?? '',
      city: c.city ?? '',
      primaryContactName: c.primaryContactName ?? '',
      primaryContactEmail: c.primaryContactEmail ?? '',
      primaryContactPhone: c.primaryContactPhone ?? ''
    };
    this.editCfValues = {};
    this.editSubmitted.set(false);
    this.editError.set('');
    this.loadCustomFieldDefs(() => {
      const existing = c.customFields ?? {};
      for (const def of this.customFieldDefs()) {
        const val = existing[def.fieldKey];
        if (val !== undefined && val !== null) {
          this.editCfValues[def.fieldKey] = def.fieldType === 3 ? (val ? 'true' : 'false') : String(val);
        }
      }
    });
    this.showEditModal.set(true);
  }

  saveEdit() {
    this.editSubmitted.set(true);
    if (!this.editForm.name.trim()) return;
    const requiredMissing = this.customFieldDefs().some(d => d.isRequired && !this.editCfValues[d.fieldKey]);
    if (requiredMissing) return;
    this.editSaving.set(true);
    this.editError.set('');
    const id = this.customer()!.id;
    this.http.put(`${environment.apiUrl}/customers/${id}`, {
      name: this.editForm.name.trim(),
      shortName: this.editForm.shortName.trim() || null,
      description: this.editForm.description.trim() || null,
      sector: this.editForm.sector.trim() || null,
      country: this.editForm.country.trim() || null,
      city: this.editForm.city.trim() || null,
      primaryContactName: this.editForm.primaryContactName.trim() || null,
      primaryContactEmail: this.editForm.primaryContactEmail.trim() || null,
      primaryContactPhone: this.editForm.primaryContactPhone.trim() || null,
      customFields: this.buildCustomFields(this.customFieldDefs(), this.editCfValues)
    }).subscribe({
      next: () => {
        this.editSaving.set(false);
        this.showEditModal.set(false);
        this.http.get<CustomerDetail>(`${environment.apiUrl}/customers/${id}`).subscribe(c => this.customer.set(c));
      },
      error: err => {
        this.editSaving.set(false);
        this.editError.set(err.error?.detail ?? 'Güncelleme başarısız');
      }
    });
  }

  removingProductId = signal<string | null>(null);
  removingEnvId = signal<string | null>(null);

  removeProduct(customerProductId: string, productName: string) {
    if (!confirm(`"${productName}" ürününü bu müşteriden kaldırmak istediğinizden emin misiniz?\n\nBu işlem için önce tüm ortamların kaldırılmış olması gerekir.`)) return;
    this.removingProductId.set(customerProductId);
    const customerId = this.route.snapshot.paramMap.get('id');
    this.http.delete(`${environment.apiUrl}/customers/${customerId}/customer-products/${customerProductId}`).subscribe({
      next: () => { this.removingProductId.set(null); this.loadCustomer(); },
      error: (err) => {
        this.removingProductId.set(null);
        alert(err.error?.detail ?? 'Ürün kaldırılamadı.');
      }
    });
  }

  removeEnvironment(envId: string, envName: string) {
    if (!confirm(`"${envName}" ortamını kaldırmak istediğinizden emin misiniz?\n\nBu işlem için önce tüm kaynakların kaldırılmış olması gerekir.`)) return;
    this.removingEnvId.set(envId);
    this.http.delete(`${environment.apiUrl}/environments/${envId}`).subscribe({
      next: () => {
        this.removingEnvId.set(null);
        this.envMap.clear();
        this.loadCustomer();
        this.onEnvironmentsTab();
      },
      error: (err) => {
        this.removingEnvId.set(null);
        alert(err.error?.detail ?? 'Ortam kaldırılamadı.');
      }
    });
  }

  showEnvModal = signal(false);
  private createEnvCpId = '';
  envForm = { name: '', environmentTypeId: '', hostingPlatformId: '' };
  envFormSubmitted = signal(false);
  envFormSaving = signal(false);
  envFormError = signal('');

  location(c: CustomerDetail) {
    return [c.city, c.country].filter(v => v).join(', ') || '—';
  }

  statusLabel(s: string) { return CUST_STATUS[s] ?? s; }
  statusCss(s: string) { return CUST_STATUS_CSS[s] ?? ''; }
  usageModeLabel(m: string) { return USAGE_MODE[m] ?? m; }
  usageModeCss(m: string) { return USAGE_MODE_CSS[m] ?? ''; }
  cpStatusLabel(s: string) { return CP_STATUS[s] ?? s; }
  cpStatusCss(s: string) { return CP_STATUS_CSS[s] ?? ''; }

  lifecycleSteps() {
    const c = this.customer()!;
    const currentStatus = c.status;
    const steps = [
      { label: 'Onboarding Başladı', date: c.onboardingStartedAt, active: currentStatus === 'Onboarding' },
      { label: 'Test Ortamı Hazır', date: c.testEnvReadyAt, active: false },
      { label: 'Prod Ortamı Hazır', date: c.prodEnvReadyAt, active: false },
      { label: 'Canlıya Geçildi', date: c.productionLiveAt, active: currentStatus === 'Active' || currentStatus === 'Inactive' },
      { label: 'Hizmet Sonlandırıldı', date: c.serviceEndedAt, active: currentStatus === 'Churned' },
    ];
    return steps;
  }

  nonSaasProducts() {
    return this.customer()?.products.filter(p => p.usageMode !== 'SaaS') ?? [];
  }

  envsForProduct(cpId: string): EnvironmentSummary[] {
    return this.envsByProduct().get(cpId) ?? [];
  }

  hexAlpha(hex: string, alpha: number): string {
    return hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
  }

  onEnvironmentsTab() {
    this.activeTab.set('environments');
    if (this.envsByProduct().size === 0 && !this.envLoading()) {
      this.loadEnvironments();
    }
  }

  private loadEnvironments() {
    const products = this.nonSaasProducts();
    if (!products.length) return;

    this.envLoading.set(true);
    this.envMap.clear();
    let remaining = products.length;

    products.forEach(cp => {
      this.http.get<EnvironmentSummary[]>(`${environment.apiUrl}/environments/customer-products/${cp.id}`).subscribe({
        next: envs => {
          this.envMap.set(cp.id, envs);
          remaining--;
          if (remaining === 0) { this.envsByProduct.set(new Map(this.envMap)); this.envLoading.set(false); }
        },
        error: () => {
          remaining--;
          if (remaining === 0) { this.envsByProduct.set(new Map(this.envMap)); this.envLoading.set(false); }
        }
      });
    });

    if (!this.envTypesLoaded) {
      this.http.get<EnvironmentType[]>(`${environment.apiUrl}/environments/types`).subscribe({
        next: t => { this.envTypes.set(t); this.envTypesLoaded = true; }
      });
    }
  }

  openCreateEnv(cpId: string) {
    this.createEnvCpId = cpId;
    this.envForm = { name: '', environmentTypeId: '', hostingPlatformId: '' };
    this.envFormSubmitted.set(false);
    this.envFormError.set('');
    this.showEnvModal.set(true);
    if (!this.envTypesLoaded) {
      this.http.get<EnvironmentType[]>(`${environment.apiUrl}/environments/types`).subscribe({
        next: t => { this.envTypes.set(t); this.envTypesLoaded = true; }
      });
    }
    if (!this.hostingPlatformsLoaded) {
      this.http.get<HostingPlatformOption[]>(`${environment.apiUrl}/environments/hosting-platforms`).subscribe({
        next: p => { this.hostingPlatforms.set(p); this.hostingPlatformsLoaded = true; }
      });
    }
  }

  saveEnv() {
    this.envFormSubmitted.set(true);
    if (!this.envForm.environmentTypeId) return;
    this.envFormSaving.set(true);
    this.envFormError.set('');

    this.http.post<{ id: string }>(`${environment.apiUrl}/environments`, {
      customerProductId: this.createEnvCpId,
      environmentTypeId: this.envForm.environmentTypeId,
      name: this.envForm.name?.trim() || null,
      notes: null,
      hostingPlatformId: this.envForm.hostingPlatformId || null
    }).subscribe({
      next: () => {
        this.envFormSaving.set(false);
        this.showEnvModal.set(false);
        this.envsByProduct.set(new Map());
        this.loadEnvironments();
      },
      error: err => {
        this.envFormSaving.set(false);
        this.envFormError.set(err.error?.detail ?? 'Ortam oluşturulamadı');
      }
    });
  }

  private loadCustomer() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<CustomerDetail>(`${environment.apiUrl}/customers/${id}`).subscribe({
      next: c => { this.customer.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  ngOnInit() {
    const cpId = this.route.snapshot.queryParamMap.get('cp');
    this.loadCustomFieldDefs();
    this.loadCustomer();
    if (cpId) {
      this.activeTab.set('products');
      setTimeout(() => {
        document.getElementById('cp-' + cpId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }
}
