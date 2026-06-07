import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface EnvironmentResource {
  id: string;
  resourceTypeName: string;
  resourceTypeCode: string;
  templateName: string;
  isShared: boolean;
  sharedResourceId: string | null;
  sharedResourceName: string | null;
  isActive: boolean;
  notes: string | null;
}

interface EndpointUrl {
  id: string;
  endpointName: string;
  endpointType: string;
  baseUrl: string;
  swaggerUrl: string | null;
  healthCheckUrl: string | null;
  isActive: boolean;
}

interface EnvironmentDetail {
  id: string;
  customerProductId: string;
  name: string;
  environmentTypeName: string;
  environmentTypeCode: string;
  environmentTypeColor: string | null;
  isActive: boolean;
  notes: string | null;
  resources: EnvironmentResource[];
  endpoints: EndpointUrl[];
}

@Component({
  selector: 'app-environment-detail',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule],
  template: `
    <div class="page-content">
      @if (loading()) {
        <div class="loading-state">Yükleniyor...</div>
      } @else if (!env()) {
        <div class="loading-state">Ortam bulunamadı. <a routerLink="/customers">← Müşterilere dön</a></div>
      } @else {
        <div class="breadcrumb">
          <a routerLink="/customers">Müşteriler</a>
          <span>/</span>
          <span>{{ env()!.name }}</span>
        </div>

        <!-- Header -->
        <div class="header-card">
          <div class="header-left">
            <div class="env-icon" [style.background]="envColor(0.15)" [style.color]="env()!.environmentTypeColor ?? '#6B7280'">
              <i class="pi pi-server"></i>
            </div>
            <div>
              <div class="header-title-row">
                <h1>{{ env()!.name }}</h1>
                <span class="type-badge" [style.background]="envColor(0.15)" [style.color]="env()!.environmentTypeColor ?? '#6B7280'">
                  {{ env()!.environmentTypeName }}
                </span>
                @if (!env()!.isActive) {
                  <span class="badge badge--inactive">Pasif</span>
                }
              </div>
              @if (env()!.notes) {
                <p class="header-notes">{{ env()!.notes }}</p>
              }
            </div>
          </div>
          <div class="header-stats">
            <div class="stat">
              <span class="stat-val">{{ env()!.resources.length }}</span>
              <span class="stat-lbl">Kaynak</span>
            </div>
            <div class="stat">
              <span class="stat-val">{{ env()!.endpoints.length }}</span>
              <span class="stat-lbl">Endpoint</span>
            </div>
          </div>
        </div>

        <!-- Resources -->
        <div class="section">
          <h2 class="section-title">Kaynaklar</h2>
          @if (!env()!.resources.length) {
            <div class="empty-card">
              <i class="pi pi-database"></i>
              <p>Henüz kaynak tanımlanmamış.</p>
            </div>
          } @else {
            <div class="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Tip</th>
                    <th>Şablon</th>
                    <th>Paylaşım</th>
                    <th>Durum</th>
                    <th>Notlar</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of env()!.resources; track r.id) {
                    <tr [class.inactive-row]="!r.isActive">
                      <td>
                        <div class="resource-type">
                          <code class="type-code">{{ r.resourceTypeCode }}</code>
                          <span>{{ r.resourceTypeName }}</span>
                        </div>
                      </td>
                      <td>{{ r.templateName }}</td>
                      <td>
                        @if (r.isShared) {
                          <span class="badge badge--shared">
                            <i class="pi pi-share-alt"></i> Paylaşımlı
                          </span>
                          @if (r.sharedResourceName) {
                            <div class="shared-name">{{ r.sharedResourceName }}</div>
                          }
                        } @else {
                          <span class="text-muted">Özel</span>
                        }
                      </td>
                      <td>
                        <span class="badge" [ngClass]="r.isActive ? 'badge--active' : 'badge--inactive'">
                          {{ r.isActive ? 'Aktif' : 'Pasif' }}
                        </span>
                      </td>
                      <td class="text-muted notes-cell">{{ r.notes ?? '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Endpoint URLs -->
        <div class="section">
          <h2 class="section-title">Endpoint URL'leri</h2>
          @if (!env()!.endpoints.length) {
            <div class="empty-card">
              <i class="pi pi-link"></i>
              <p>Bu ortam için endpoint URL'si tanımlanmamış.</p>
            </div>
          } @else {
            <div class="endpoint-grid">
              @for (ep of env()!.endpoints; track ep.id) {
                <div class="endpoint-card" [class.inactive-card]="!ep.isActive">
                  <div class="ep-header">
                    <div class="ep-icon">
                      <i class="pi" [ngClass]="epTypeIcon(ep.endpointType)"></i>
                    </div>
                    <div>
                      <div class="ep-name">{{ ep.endpointName }}</div>
                      <div class="ep-type">{{ ep.endpointType }}</div>
                    </div>
                    @if (!ep.isActive) {
                      <span class="badge badge--inactive ep-status">Pasif</span>
                    }
                  </div>
                  <div class="ep-urls">
                    <div class="url-row">
                      <span class="url-lbl">Base URL</span>
                      <a [href]="ep.baseUrl" target="_blank" class="url-link" title="{{ ep.baseUrl }}">
                        {{ ep.baseUrl }}
                        <i class="pi pi-external-link"></i>
                      </a>
                      <button class="copy-btn" (click)="copy(ep.baseUrl)" title="Kopyala">
                        <i class="pi pi-copy"></i>
                      </button>
                    </div>
                    @if (ep.swaggerUrl) {
                      <div class="url-row">
                        <span class="url-lbl">Swagger</span>
                        <a [href]="ep.swaggerUrl" target="_blank" class="url-link">
                          {{ ep.swaggerUrl }}
                          <i class="pi pi-external-link"></i>
                        </a>
                        <button class="copy-btn" (click)="copy(ep.swaggerUrl!)" title="Kopyala">
                          <i class="pi pi-copy"></i>
                        </button>
                      </div>
                    }
                    @if (ep.healthCheckUrl) {
                      <div class="url-row">
                        <span class="url-lbl">Health</span>
                        <a [href]="ep.healthCheckUrl" target="_blank" class="url-link">
                          {{ ep.healthCheckUrl }}
                          <i class="pi pi-external-link"></i>
                        </a>
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
  `,
  styles: [`
    .loading-state { text-align: center; padding: 4rem; color: #9CA3AF; a { color: #3B82F6; text-decoration: none; } }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6B7280; margin-bottom: 1.25rem; a { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } } }

    .header-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); flex-wrap: wrap; }
    .header-left { display: flex; align-items: center; gap: 1rem; flex: 1; }
    .env-icon { width: 3rem; height: 3rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
    .header-title-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; h1 { font-size: 1.25rem; font-weight: 700; color: #111827; } }
    .type-badge { display: inline-flex; align-items: center; padding: 0.2rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .header-notes { font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem; }
    .header-stats { display: flex; gap: 1.5rem; flex-shrink: 0; }
    .stat { text-align: center; }
    .stat-val { display: block; font-size: 1.5rem; font-weight: 700; color: #111827; }
    .stat-lbl { font-size: 0.75rem; color: #9CA3AF; }

    .section { margin-bottom: 1.5rem; }
    .section-title { font-size: 1rem; font-weight: 700; color: #374151; margin-bottom: 0.75rem; }
    .empty-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 2.5rem; text-align: center; color: #9CA3AF; i { font-size: 2rem; margin-bottom: 0.5rem; display: block; } p { font-size: 0.875rem; } }

    .table-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    table { width: 100%; border-collapse: collapse; }
    th { background: #F9FAFB; padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #E5E7EB; }
    td { padding: 0.875rem 1rem; border-bottom: 1px solid #F3F4F6; font-size: 0.875rem; color: #374151; }
    tr:last-child td { border-bottom: none; }
    .inactive-row td { opacity: 0.6; }
    .resource-type { display: flex; align-items: center; gap: 0.5rem; }
    .type-code { background: #F3F4F6; color: #6B7280; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem; }
    .text-muted { color: #9CA3AF; }
    .notes-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .shared-name { font-size: 0.75rem; color: #6B7280; margin-top: 0.125rem; }

    .endpoint-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 0.75rem; }
    .endpoint-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .inactive-card { opacity: 0.65; }
    .ep-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .ep-icon { width: 2rem; height: 2rem; background: #EEF2FF; color: #4F46E5; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.875rem; }
    .ep-name { font-weight: 600; color: #111827; font-size: 0.875rem; }
    .ep-type { font-size: 0.75rem; color: #9CA3AF; }
    .ep-status { margin-left: auto; }
    .ep-urls { display: flex; flex-direction: column; gap: 0.5rem; }
    .url-row { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
    .url-lbl { font-size: 0.7rem; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; width: 3.5rem; }
    .url-link { flex: 1; font-size: 0.8125rem; color: #3B82F6; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 0.25rem; &:hover { text-decoration: underline; } i { font-size: 0.7rem; flex-shrink: 0; } }
    .copy-btn { background: none; border: 1px solid #E5E7EB; border-radius: 0.25rem; padding: 0.125rem 0.375rem; cursor: pointer; color: #9CA3AF; font-size: 0.75rem; flex-shrink: 0; &:hover { background: #F3F4F6; color: #374151; } }

    .badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
    .badge--active { background: #D1FAE5; color: #065F46; }
    .badge--inactive { background: #FEF3C7; color: #92400E; }
    .badge--shared { background: #EDE9FE; color: #5B21B6; }
  `]
})
export class EnvironmentDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  env = signal<EnvironmentDetail | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<EnvironmentDetail>(`${environment.apiUrl}/environments/${id}`).subscribe({
      next: d => { this.env.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  envColor(alpha: number): string {
    const c = this.env()?.environmentTypeColor ?? '#6B7280';
    return c + Math.round(alpha * 255).toString(16).padStart(2, '0');
  }

  epTypeIcon(type: string): string {
    const map: Record<string, string> = {
      WebApp: 'pi-desktop', Api: 'pi-server', Database: 'pi-database',
      MessageBroker: 'pi-envelope', Other: 'pi-box'
    };
    return map[type] ?? 'pi-box';
  }

  copy(text: string) {
    navigator.clipboard.writeText(text);
  }
}
