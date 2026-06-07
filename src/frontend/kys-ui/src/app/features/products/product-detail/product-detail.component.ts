import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

const PRODUCT_TYPE: Record<number, string> = { 0: 'SaaS', 1: 'Müşteriye Özel', 2: 'Hibrit' };
const PRODUCT_TYPE_CSS: Record<number, string> = { 0: 'badge--saas', 1: 'badge--custom', 2: 'badge--hybrid' };
const STATUS_LABEL: Record<number, string> = { 0: 'Aktif', 1: 'Kullanımdan Kalkıyor', 2: 'Kapatıldı' };
const STATUS_CSS: Record<number, string> = { 0: 'badge--active', 1: 'badge--deprecated', 2: 'badge--archived' };
const ENDPOINT_TYPE: Record<number, string> = { 0: 'Frontend', 1: 'REST API', 2: 'gRPC', 3: 'SOAP', 4: 'GraphQL' };
const ENDPOINT_ICON: Record<number, string> = { 0: 'pi-desktop', 1: 'pi-server', 2: 'pi-server', 3: 'pi-server', 4: 'pi-code' };

interface ProductDetail {
  id: string;
  name: string;
  code: string;
  description: string | null;
  version: string | null;
  productType: number;
  status: number;
  poPersonId: string | null;
  poName: string | null;
  techStack: string[];
  repositoryUrl: string | null;
  documentationUrl: string | null;
  teams: { teamId: string; teamName: string; role: string | null; since: string | null }[];
  assignments: { personId: string; fullName: string; responsibility: string | null; startedAt: string | null; isActive: boolean }[];
  endpoints: { id: string; name: string; endpointType: number; defaultBaseUrl: string | null; swaggerUrl: string | null; sortOrder: number }[];
  resourceTemplates: { id: string; name: string; resourceTypeId: string; resourceTypeName: string; isRequired: boolean; canBeShared: boolean; sortOrder: number }[];
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, NgClass, DatePipe, FormsModule],
  template: `
    <div class="page-content">
      @if (loading()) {
        <div class="loading-state">Yükleniyor...</div>
      } @else if (!product()) {
        <div class="loading-state">Ürün bulunamadı. <a routerLink="/products">← Geri dön</a></div>
      } @else {
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a routerLink="/products">Ürünler</a>
          <span>/</span>
          <span>{{ product()!.name }}</span>
        </div>

        <!-- Header -->
        <div class="header-card">
          <div class="header-main">
            <div class="product-icon"><i class="pi pi-box"></i></div>
            <div>
              <div class="header-top">
                <h1>{{ product()!.name }}</h1>
                <code class="code-badge">{{ product()!.code }}</code>
              </div>
              <p class="header-desc">{{ product()!.description ?? 'Açıklama eklenmemiş' }}</p>
              @if (product()!.version) {
                <span class="version-tag">v{{ product()!.version }}</span>
              }
            </div>
          </div>
          <div class="header-right">
            <span class="badge" [ngClass]="typeCss(product()!.productType)">{{ typeLabel(product()!.productType) }}</span>
            <span class="badge" [ngClass]="statusCss(product()!.status)">{{ statusLabel(product()!.status) }}</span>
          </div>
        </div>

        <!-- Quick stats bar -->
        <div class="stats-bar">
          <div class="stat">
            <span class="stat-val">{{ product()!.poName ?? '—' }}</span>
            <span class="stat-lbl">Ürün Sahibi</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <span class="stat-val">{{ activeAssignments() }}</span>
            <span class="stat-lbl">Aktif Çalışan</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <span class="stat-val">{{ product()!.teams.length }}</span>
            <span class="stat-lbl">Ekip</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <span class="stat-val">{{ product()!.endpoints.length }}</span>
            <span class="stat-lbl">Endpoint</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          @for (tab of tabs; track tab.key) {
            <button class="tab-btn" [class.active]="activeTab() === tab.key" (click)="activeTab.set(tab.key)">
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Tab: Genel Bilgiler -->
        @if (activeTab() === 'info') {
          <div class="tab-content">
            <div class="info-grid">
              <div class="info-item">
                <label>Ürün Tipi</label>
                <span><span class="badge" [ngClass]="typeCss(product()!.productType)">{{ typeLabel(product()!.productType) }}</span></span>
              </div>
              <div class="info-item">
                <label>Durum</label>
                <span><span class="badge" [ngClass]="statusCss(product()!.status)">{{ statusLabel(product()!.status) }}</span></span>
              </div>
              <div class="info-item">
                <label>Sürüm</label>
                <span>{{ product()!.version ?? '—' }}</span>
              </div>
              <div class="info-item">
                <label>Ürün Sahibi</label>
                @if (product()!.poPersonId) {
                  <a [routerLink]="['/people', product()!.poPersonId]" class="link">{{ product()!.poName }}</a>
                } @else {
                  <span>—</span>
                }
              </div>
              <div class="info-item">
                <label>Kaynak Kod</label>
                @if (product()!.repositoryUrl) {
                  <a [href]="product()!.repositoryUrl" target="_blank" class="link ext-link">
                    <i class="pi pi-external-link"></i> Repo
                  </a>
                } @else {
                  <span>—</span>
                }
              </div>
              <div class="info-item">
                <label>Dokümantasyon</label>
                @if (product()!.documentationUrl) {
                  <a [href]="product()!.documentationUrl" target="_blank" class="link ext-link">
                    <i class="pi pi-external-link"></i> Döküman
                  </a>
                } @else {
                  <span>—</span>
                }
              </div>
            </div>
            @if (product()!.techStack.length) {
              <div class="tech-stack-section">
                <label>Teknoloji Stack'i</label>
                <div class="tech-tags">
                  @for (tech of product()!.techStack; track tech) {
                    <span class="tech-tag">{{ tech }}</span>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Tab: Endpoint'ler -->
        @if (activeTab() === 'endpoints') {
          <div class="tab-content">
            @if (!product()!.endpoints.length) {
              <p class="empty-text">Endpoint tanımlanmamış.</p>
            } @else {
              <div class="endpoint-list">
                @for (ep of sortedEndpoints(); track ep.id) {
                  <div class="endpoint-card">
                    <div class="ep-header">
                      <div class="ep-icon">
                        <i class="pi" [ngClass]="endpointIcon(ep.endpointType)"></i>
                      </div>
                      <div class="ep-info">
                        <span class="ep-name">{{ ep.name }}</span>
                        <span class="badge badge--ep">{{ endpointTypeLabel(ep.endpointType) }}</span>
                      </div>
                    </div>
                    @if (ep.defaultBaseUrl) {
                      <div class="ep-url">
                        <i class="pi pi-link"></i>
                        <code>{{ ep.defaultBaseUrl }}</code>
                        <button class="copy-btn" (click)="copy(ep.defaultBaseUrl!)" title="Kopyala">
                          <i class="pi pi-copy"></i>
                        </button>
                      </div>
                    }
                    @if (ep.swaggerUrl) {
                      <div class="ep-url ep-swagger">
                        <i class="pi pi-file-o"></i>
                        <a [href]="ep.swaggerUrl" target="_blank">Swagger / OpenAPI</a>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab: Ekipler -->
        @if (activeTab() === 'teams') {
          <div class="tab-content">
            @if (!product()!.teams.length) {
              <p class="empty-text">Ekip atanmamış.</p>
            } @else {
              <div class="team-list">
                @for (t of product()!.teams; track t.teamId) {
                  <div class="team-card">
                    <div class="team-avatar">{{ t.teamName[0] }}</div>
                    <div>
                      <a [routerLink]="['/teams', t.teamId]" class="link">{{ t.teamName }}</a>
                      <p class="muted-sm">{{ t.role ?? 'Rol belirtilmemiş' }} @if (t.since) { · {{ t.since | date:'dd.MM.yyyy' }}'den beri }</p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab: Çalışanlar -->
        @if (activeTab() === 'assignments') {
          <div class="tab-content">
            @if (!product()!.assignments.length) {
              <p class="empty-text">Atama yapılmamış.</p>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Kişi</th>
                    <th>Sorumluluk</th>
                    <th>Başlangıç</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of product()!.assignments; track a.personId) {
                    <tr [class.inactive-row]="!a.isActive">
                      <td>
                        <a [routerLink]="['/people', a.personId]" class="link">{{ a.fullName }}</a>
                      </td>
                      <td class="muted">{{ a.responsibility ?? '—' }}</td>
                      <td class="muted">{{ a.startedAt ? (a.startedAt | date:'dd.MM.yyyy') : '—' }}</td>
                      <td>
                        <span class="badge" [class]="a.isActive ? 'badge--active' : 'badge--archived'">
                          {{ a.isActive ? 'Aktif' : 'Pasif' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .loading-state { text-align: center; padding: 4rem; color: #9CA3AF; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6B7280; margin-bottom: 1.25rem; a { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } } }

    .header-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1.5rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); flex-wrap: wrap; }
    .header-main { display: flex; align-items: flex-start; gap: 1rem; }
    .product-icon { width: 3rem; height: 3rem; border-radius: 0.5rem; background: #F0FDF4; color: #16A34A; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
    .header-top { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; h1 { font-size: 1.25rem; font-weight: 700; color: #111827; } }
    .code-badge { background: #F3F4F6; color: #374151; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8125rem; }
    .header-desc { font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem; }
    .version-tag { margin-top: 0.375rem; display: inline-block; font-size: 0.75rem; background: #EEF2FF; color: #4338CA; padding: 0.125rem 0.5rem; border-radius: 9999px; }
    .header-right { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.25rem; }

    .stats-bar { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.875rem 1.5rem; display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .stat { display: flex; flex-direction: column; gap: 0.125rem; }
    .stat-val { font-size: 1rem; font-weight: 700; color: #111827; }
    .stat-lbl { font-size: 0.75rem; color: #9CA3AF; }
    .stat-sep { width: 1px; height: 2.5rem; background: #E5E7EB; }

    .tabs { display: flex; gap: 0; border-bottom: 2px solid #E5E7EB; margin-bottom: 1.25rem; }
    .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: none; border: none; font-size: 0.875rem; font-weight: 500; color: #6B7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color 0.15s; &:hover { color: #374151; } &.active { color: #3B82F6; border-bottom-color: #3B82F6; } }

    .tab-content { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-text { color: #9CA3AF; font-size: 0.875rem; text-align: center; padding: 2rem; }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.25rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.75rem; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; } span, a { font-size: 0.875rem; color: #111827; } }
    .link { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } }
    .ext-link { display: flex; align-items: center; gap: 0.375rem; i { font-size: 0.75rem; } }
    .tech-stack-section { label { font-size: 0.75rem; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.5rem; } }
    .tech-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .tech-tag { background: #EEF2FF; color: #3730A3; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }

    .endpoint-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .endpoint-card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.5rem; padding: 0.875rem 1rem; }
    .ep-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .ep-icon { width: 2rem; height: 2rem; border-radius: 0.375rem; background: #EEF2FF; color: #4F46E5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ep-info { display: flex; align-items: center; gap: 0.75rem; }
    .ep-name { font-weight: 500; color: #111827; font-size: 0.875rem; }
    .badge--ep { background: #E0F2FE; color: #0369A1; }
    .ep-url { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #6B7280; margin-top: 0.375rem; code { background: white; border: 1px solid #E5E7EB; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-family: monospace; color: #374151; } a { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } } }
    .ep-swagger { i { color: #059669; } }
    .copy-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 0.125rem; &:hover { color: #374151; } }

    .team-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .team-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.5rem; }
    .team-avatar { width: 2rem; height: 2rem; border-radius: 0.375rem; background: #E0E7FF; color: #4F46E5; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; flex-shrink: 0; }
    .muted-sm { font-size: 0.75rem; color: #9CA3AF; margin-top: 0.125rem; }

    .data-table { width: 100%; border-collapse: collapse; th { background: #F9FAFB; padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; } td { padding: 0.75rem; font-size: 0.875rem; color: #374151; border-bottom: 1px solid #F3F4F6; } tr:last-child td { border-bottom: none; } }
    .inactive-row td { opacity: 0.55; }
    .muted { color: #6B7280; }

    .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--active { background: #D1FAE5; color: #065F46; }
    .badge--deprecated { background: #FEF3C7; color: #92400E; }
    .badge--archived { background: #F3F4F6; color: #6B7280; }
    .badge--saas { background: #DBEAFE; color: #1E40AF; }
    .badge--custom { background: #F3E8FF; color: #6B21A8; }
    .badge--hybrid { background: #FFEDD5; color: #9A3412; }
  `]
})
export class ProductDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  product = signal<ProductDetail | null>(null);
  loading = signal(true);
  activeTab = signal('info');
  readonly tabs = [
    { key: 'info', label: 'Genel Bilgiler' },
    { key: 'endpoints', label: 'Endpoint\'ler' },
    { key: 'teams', label: 'Ekipler' },
    { key: 'assignments', label: 'Çalışanlar' },
  ];

  activeAssignments() { return (this.product()?.assignments ?? []).filter(a => a.isActive).length; }
  sortedEndpoints() { return [...(this.product()?.endpoints ?? [])].sort((a, b) => a.sortOrder - b.sortOrder); }

  typeLabel(t: number) { return PRODUCT_TYPE[t] ?? t; }
  typeCss(t: number) { return PRODUCT_TYPE_CSS[t] ?? ''; }
  statusLabel(s: number) { return STATUS_LABEL[s] ?? s; }
  statusCss(s: number) { return STATUS_CSS[s] ?? ''; }
  endpointTypeLabel(t: number) { return ENDPOINT_TYPE[t] ?? t; }
  endpointIcon(t: number) { return ENDPOINT_ICON[t] ?? 'pi-server'; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<ProductDetail>(`${environment.apiUrl}/products/${id}`).subscribe({
      next: p => { this.product.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  copy(text: string) {
    navigator.clipboard.writeText(text);
  }
}
