import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
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
  imports: [RouterLink, NgClass, DatePipe],
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
      }
    </div>
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
  `]
})
export class CustomerDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  customer = signal<CustomerDetail | null>(null);
  loading = signal(true);
  activeTab = signal('info');

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

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<CustomerDetail>(`${environment.apiUrl}/customers/${id}`).subscribe({
      next: c => { this.customer.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
