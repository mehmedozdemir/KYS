import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

// CustomerStatus: 0=Prospect,1=Onboarding,2=Active,3=Inactive,4=Churned
// UsageMode: 0=SaaS,1=Dedicated
// CustomerProductStatus: 0=Onboarding,1=Active,2=Inactive,3=Discontinued
const CUST_STATUS: Record<number, string> = { 0: 'Potansiyel', 1: 'Onboarding', 2: 'Aktif', 3: 'Pasif', 4: 'Ayrıldı' };
const CUST_STATUS_CSS: Record<number, string> = { 0: 'badge--prospect', 1: 'badge--onboarding', 2: 'badge--active', 3: 'badge--inactive', 4: 'badge--churned' };
const USAGE_MODE: Record<number, string> = { 0: 'SaaS', 1: 'Dedicated' };
const USAGE_MODE_CSS: Record<number, string> = { 0: 'badge--saas', 1: 'badge--custom' };
const CP_STATUS: Record<number, string> = { 0: 'Onboarding', 1: 'Aktif', 2: 'Pasif', 3: 'Kapatıldı' };
const CP_STATUS_CSS: Record<number, string> = { 0: 'badge--onboarding', 1: 'badge--active', 2: 'badge--inactive', 3: 'badge--archived' };

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
}

interface EnvironmentType {
  id: string;
  name: string;
  code: string;
  color: string | null;
}

interface CustomerProduct {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  usageMode: number;
  status: number;
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
  status: number;
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
  imports: [RouterLink, NgClass, DatePipe, FormsModule],
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
            @if (!customer()!.products.length) {
              <p class="empty-text">Ürün atanmamış.</p>
            } @else {
              <div class="product-grid">
                @for (cp of customer()!.products; track cp.id) {
                  <div class="product-card">
                    <div class="pc-header">
                      <div class="pc-icon"><i class="pi pi-box"></i></div>
                      <div>
                        <a [routerLink]="['/products', cp.productId]" class="link">{{ cp.productName }}</a>
                        <code class="code-sm">{{ cp.productCode }}</code>
                      </div>
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
                            @if (!e.isActive) {
                              <span class="badge badge--inactive">Pasif</span>
                            }
                          </div>
                          <h4 class="env-name">{{ e.name }}</h4>
                          <div class="env-stats">
                            <span><i class="pi pi-database"></i> {{ e.resourceCount }} kaynak</span>
                            <span><i class="pi pi-link"></i> {{ e.endpointCount }} endpoint</span>
                          </div>
                          <a [routerLink]="['/environments', e.id]" class="env-detail-link">
                            Detay <i class="pi pi-arrow-right"></i>
                          </a>
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
              <label>Ortam Adı <span class="required">*</span></label>
              <input type="text" [(ngModel)]="envForm.name" placeholder="ör. Prod, Test, UAT..." [class.input-error]="envFormSubmitted() && !envForm.name.trim()" />
              @if (envFormSubmitted() && !envForm.name.trim()) {
                <span class="error-msg">Ad zorunludur</span>
              }
            </div>
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
    .loading-state { text-align: center; padding: 4rem; color: #9CA3AF; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6B7280; margin-bottom: 1.25rem; a { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } } }

    .header-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1.5rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); flex-wrap: wrap; }
    .header-main { display: flex; align-items: flex-start; gap: 1rem; }
    .cust-avatar { width: 3rem; height: 3rem; border-radius: 0.5rem; background: #FEF3C7; color: #B45309; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; flex-shrink: 0; }
    .header-top { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; h1 { font-size: 1.25rem; font-weight: 700; color: #111827; } }
    .short-name { font-size: 0.875rem; color: #6B7280; }
    .code-badge { background: #F3F4F6; color: #374151; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8125rem; }
    .header-desc { font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem; }
    .header-meta { display: flex; gap: 0.5rem; font-size: 0.8125rem; color: #9CA3AF; margin-top: 0.25rem; }
    .header-right { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.25rem; }

    .tabs { display: flex; gap: 0; border-bottom: 2px solid #E5E7EB; margin-bottom: 1.25rem; }
    .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: none; border: none; font-size: 0.875rem; font-weight: 500; color: #6B7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color 0.15s; &:hover { color: #374151; } &.active { color: #3B82F6; border-bottom-color: #3B82F6; } }
    .tab-count { background: #F3F4F6; color: #6B7280; border-radius: 9999px; padding: 0 0.375rem; font-size: 0.75rem; }
    .tab-btn.active .tab-count { background: #DBEAFE; color: #1D4ED8; }

    .tab-content { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-text { color: #9CA3AF; font-size: 0.875rem; text-align: center; padding: 2rem; }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.25rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.75rem; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; } span { font-size: 0.875rem; color: #111827; } }
    .span-full { grid-column: 1 / -1; }
    .link { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } }

    .contact-card { margin-top: 0.5rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.5rem; padding: 1rem; h3 { font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.75rem; } }
    .contact-info { display: flex; align-items: flex-start; gap: 0.75rem; }
    .contact-avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; background: #DBEAFE; color: #1D4ED8; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; flex-shrink: 0; }
    .contact-name { font-weight: 500; color: #111827; font-size: 0.875rem; }
    .contact-link { font-size: 0.8125rem; color: #3B82F6; text-decoration: none; display: flex; align-items: center; gap: 0.375rem; margin-top: 0.25rem; &:hover { text-decoration: underline; } i { font-size: 0.75rem; } }
    .contact-phone { font-size: 0.8125rem; color: #6B7280; display: flex; align-items: center; gap: 0.375rem; margin-top: 0.125rem; i { font-size: 0.75rem; } }

    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; }
    .product-card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.5rem; padding: 1rem; }
    .pc-header { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.625rem; }
    .pc-icon { width: 2rem; height: 2rem; border-radius: 0.375rem; background: #F0FDF4; color: #16A34A; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .code-sm { background: #E5E7EB; color: #6B7280; padding: 0 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem; margin-left: 0.25rem; }
    .pc-badges { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-bottom: 0.375rem; }
    .pc-date { font-size: 0.75rem; color: #9CA3AF; margin-top: 0.375rem; }

    .timeline { display: flex; flex-direction: column; gap: 0; }
    .timeline-step { display: flex; align-items: flex-start; gap: 1rem; padding: 0.875rem 0; position: relative; &:not(:last-child)::before { content: ''; position: absolute; left: 0.5625rem; top: 2.25rem; bottom: 0; width: 2px; background: #E5E7EB; } }
    .step-dot { width: 1.25rem; height: 1.25rem; border-radius: 50%; border: 2px solid #D1D5DB; background: white; flex-shrink: 0; margin-top: 0.125rem; }
    .timeline-step.done .step-dot { border-color: #10B981; background: #10B981; }
    .timeline-step.active .step-dot { border-color: #3B82F6; background: #3B82F6; box-shadow: 0 0 0 4px rgba(59,130,246,0.2); }
    .step-content { display: flex; flex-direction: column; gap: 0.125rem; }
    .step-label { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .step-date { font-size: 0.8125rem; color: #059669; }
    .step-pending { font-size: 0.8125rem; color: #9CA3AF; }

    .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--prospect { background: #F3F4F6; color: #6B7280; }
    .badge--onboarding { background: #DBEAFE; color: #1E40AF; }
    .badge--active { background: #D1FAE5; color: #065F46; }
    .badge--inactive { background: #FEF3C7; color: #92400E; }
    .badge--churned { background: #FEE2E2; color: #991B1B; }
    .badge--archived { background: #F3F4F6; color: #6B7280; }
    .badge--saas { background: #DBEAFE; color: #1E40AF; }
    .badge--custom { background: #F3E8FF; color: #6B21A8; }

    /* Ortamlar tab */
    .env-product-section { margin-bottom: 1.5rem; &:last-child { margin-bottom: 0; } }
    .env-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
    .env-section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; font-weight: 600; color: #374151; i { color: #6B7280; font-size: 0.875rem; } }
    .code-sm { background: #E5E7EB; color: #6B7280; padding: 0 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem; }
    .btn-sm { background: white; color: #374151; border: 1px solid #D1D5DB; border-radius: 0.375rem; padding: 0.375rem 0.75rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; &:hover { background: #F9FAFB; border-color: #3B82F6; color: #3B82F6; } }
    .env-empty { font-size: 0.875rem; color: #9CA3AF; padding: 0.75rem 0; }
    .env-card-row { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .env-card { background: #F9FAFB; border: 1px solid #E5E7EB; border-left: 4px solid #6B7280; border-radius: 0.5rem; padding: 0.875rem 1rem; min-width: 200px; flex: 1; max-width: 280px; display: flex; flex-direction: column; gap: 0.5rem; }
    .env-card-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .env-type-badge { display: inline-flex; align-items: center; padding: 0.15rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
    .env-name { font-size: 0.9375rem; font-weight: 600; color: #111827; }
    .env-stats { display: flex; gap: 0.75rem; font-size: 0.75rem; color: #6B7280; i { font-size: 0.7rem; margin-right: 0.25rem; } }
    .env-detail-link { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; color: #3B82F6; text-decoration: none; margin-top: 0.25rem; font-weight: 500; &:hover { text-decoration: underline; } i { font-size: 0.7rem; } }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 0.75rem; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E5E7EB; h2 { font-size: 1.125rem; font-weight: 700; color: #111827; } }
    .modal-close { background: none; border: none; cursor: pointer; color: #6B7280; font-size: 1.25rem; padding: 0.25rem; border-radius: 0.375rem; &:hover { background: #F3F4F6; } }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.8125rem; font-weight: 600; color: #374151; } input, select { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; font-size: 0.875rem; &:focus { outline: none; border-color: #3B82F6; } } }
    .input-error { border-color: #EF4444 !important; }
    .error-msg { font-size: 0.75rem; color: #EF4444; }
    .required { color: #EF4444; }
    .alert-error { padding: 0.75rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 0.375rem; color: #991B1B; font-size: 0.8125rem; }
    .btn-cancel { background: white; color: #374151; border: 1px solid #D1D5DB; border-radius: 0.5rem; padding: 0.5rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; &:hover { background: #F3F4F6; } }
    .btn-save { background: #3B82F6; color: white; border: none; border-radius: 0.5rem; padding: 0.5rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; &:not(:disabled):hover { background: #2563EB; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
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

  showEnvModal = signal(false);
  private createEnvCpId = '';
  envForm = { name: '', environmentTypeId: '' };
  envFormSubmitted = signal(false);
  envFormSaving = signal(false);
  envFormError = signal('');

  location(c: CustomerDetail) {
    return [c.city, c.country].filter(v => v).join(', ') || '—';
  }

  statusLabel(s: number) { return CUST_STATUS[s] ?? s; }
  statusCss(s: number) { return CUST_STATUS_CSS[s] ?? ''; }
  usageModeLabel(m: number) { return USAGE_MODE[m] ?? m; }
  usageModeCss(m: number) { return USAGE_MODE_CSS[m] ?? ''; }
  cpStatusLabel(s: number) { return CP_STATUS[s] ?? s; }
  cpStatusCss(s: number) { return CP_STATUS_CSS[s] ?? ''; }

  lifecycleSteps() {
    const c = this.customer()!;
    const currentStatus = c.status;
    const steps = [
      { label: 'Onboarding Başladı', date: c.onboardingStartedAt, active: currentStatus === 1 },
      { label: 'Test Ortamı Hazır', date: c.testEnvReadyAt, active: false },
      { label: 'Prod Ortamı Hazır', date: c.prodEnvReadyAt, active: false },
      { label: 'Canlıya Geçildi', date: c.productionLiveAt, active: currentStatus === 2 || currentStatus === 3 },
      { label: 'Hizmet Sonlandırıldı', date: c.serviceEndedAt, active: currentStatus === 4 },
    ];
    return steps;
  }

  nonSaasProducts() {
    return this.customer()?.products.filter(p => p.usageMode !== 0) ?? [];
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
    this.envForm = { name: '', environmentTypeId: '' };
    this.envFormSubmitted.set(false);
    this.envFormError.set('');
    this.showEnvModal.set(true);
    if (!this.envTypesLoaded) {
      this.http.get<EnvironmentType[]>(`${environment.apiUrl}/environments/types`).subscribe({
        next: t => { this.envTypes.set(t); this.envTypesLoaded = true; }
      });
    }
  }

  saveEnv() {
    this.envFormSubmitted.set(true);
    if (!this.envForm.name.trim() || !this.envForm.environmentTypeId) return;
    this.envFormSaving.set(true);
    this.envFormError.set('');

    this.http.post<{ id: string }>(`${environment.apiUrl}/environments`, {
      customerProductId: this.createEnvCpId,
      environmentTypeId: this.envForm.environmentTypeId,
      name: this.envForm.name.trim(),
      notes: null
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

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<CustomerDetail>(`${environment.apiUrl}/customers/${id}`).subscribe({
      next: c => { this.customer.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
