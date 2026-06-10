import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

const ACTION_LABEL: Record<string, string> = {
  Created: 'Oluşturuldu', Updated: 'Güncellendi', Deleted: 'Silindi',
  Restored: 'Geri Alındı', CredentialRevealed: 'Credential Görüntülendi'
};
const ACTION_CSS: Record<string, string> = {
  Created: 'action--created', Updated: 'action--updated', Deleted: 'action--deleted',
  Restored: 'action--restored', CredentialRevealed: 'action--credential'
};

interface PlatformStats {
  totalPeople: number;
  activePeople: number;
  totalTeams: number;
  totalProducts: number;
  totalCustomers: number;
  totalKbArticles: number;
  auditLogsLast30Days: number;
}

interface AuditLogItem {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  action: string;
  changedBy: string | null;
  changedAt: string;
  ipAddress: string | null;
}

interface AuditLogList {
  items: AuditLogItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, NgClass, FormsModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">Admin Paneli</h1>
          <p class="page-subtitle">Platform yönetimi ve izleme</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab() === 'stats'" (click)="activeTab.set('stats')">
          Platform İstatistikleri
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'audit'" (click)="onAuditTab()">
          Audit Log
        </button>
      </div>

      <!-- Stats Tab -->
      @if (activeTab() === 'stats') {
        @if (!stats()) {
          <div class="loading-state">Yükleniyor...</div>
        } @else {
          <div class="stats-grid">
            <div class="stat-card" routerLink="/people">
              <div class="stat-icon si--blue"><i class="pi pi-users"></i></div>
              <div>
                <div class="stat-val">{{ stats()!.totalPeople }}</div>
                <div class="stat-lbl">Toplam Personel</div>
                <div class="stat-sub">{{ stats()!.activePeople }} aktif</div>
              </div>
            </div>
            <div class="stat-card" routerLink="/teams">
              <div class="stat-icon si--green"><i class="pi pi-sitemap"></i></div>
              <div>
                <div class="stat-val">{{ stats()!.totalTeams }}</div>
                <div class="stat-lbl">Ekip</div>
              </div>
            </div>
            <div class="stat-card" routerLink="/products">
              <div class="stat-icon si--violet"><i class="pi pi-box"></i></div>
              <div>
                <div class="stat-val">{{ stats()!.totalProducts }}</div>
                <div class="stat-lbl">Ürün</div>
              </div>
            </div>
            <div class="stat-card" routerLink="/customers">
              <div class="stat-icon si--orange"><i class="pi pi-building"></i></div>
              <div>
                <div class="stat-val">{{ stats()!.totalCustomers }}</div>
                <div class="stat-lbl">Müşteri</div>
              </div>
            </div>
            <div class="stat-card" routerLink="/knowledge-base">
              <div class="stat-icon si--teal"><i class="pi pi-book"></i></div>
              <div>
                <div class="stat-val">{{ stats()!.totalKbArticles }}</div>
                <div class="stat-lbl">KB Makalesi</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon si--red"><i class="pi pi-history"></i></div>
              <div>
                <div class="stat-val">{{ stats()!.auditLogsLast30Days }}</div>
                <div class="stat-lbl">Audit Log (30 gün)</div>
              </div>
            </div>
          </div>

          <div class="quick-links">
            <h2>Hızlı İşlemler</h2>
            <div class="link-grid">
              <a routerLink="/people" class="link-card">
                <i class="pi pi-user-plus"></i>
                <span>Yeni Personel Ekle</span>
              </a>
              <a routerLink="/teams" class="link-card">
                <i class="pi pi-users"></i>
                <span>Ekip Yönetimi</span>
              </a>
              <a routerLink="/products" class="link-card">
                <i class="pi pi-box"></i>
                <span>Ürün Yönetimi</span>
              </a>
              <a routerLink="/customers" class="link-card">
                <i class="pi pi-building"></i>
                <span>Müşteri Yönetimi</span>
              </a>
              <a routerLink="/admin/platform-users" class="link-card">
                <i class="pi pi-shield"></i>
                <span>Platform Kullanıcıları</span>
              </a>
              <a routerLink="/admin/custom-fields" class="link-card">
                <i class="pi pi-sliders-h"></i>
                <span>Özel Alanlar</span>
              </a>
              <a routerLink="/admin/environment-types" class="link-card">
                <i class="pi pi-server"></i>
                <span>Ortam Tipleri</span>
              </a>
              <a routerLink="/admin/shared-resources" class="link-card">
                <i class="pi pi-share-alt"></i>
                <span>Paylaşımlı Kaynaklar</span>
              </a>
              <a routerLink="/admin/resource-types" class="link-card">
                <i class="pi pi-database"></i>
                <span>Kaynak Tipleri</span>
              </a>
              <a routerLink="/admin/access-grants" class="link-card">
                <i class="pi pi-key"></i>
                <span>Erişim Yetkileri</span>
              </a>
              <a routerLink="/admin/audit-log" class="link-card">
                <i class="pi pi-history"></i>
                <span>Audit Log</span>
              </a>
            </div>
          </div>
        }
      }

      <!-- Audit Log Tab -->
      @if (activeTab() === 'audit') {
        <div class="audit-toolbar">
          <select [(ngModel)]="auditEntityType" (ngModelChange)="loadAudit()">
            <option value="">Tüm entity'ler</option>
            <option value="Person">Person</option>
            <option value="Team">Team</option>
            <option value="Product">Product</option>
            <option value="Customer">Customer</option>
            <option value="ResourceCredential">Credential</option>
          </select>
          <select [(ngModel)]="auditAction" (ngModelChange)="loadAudit()">
            <option value="">Tüm aksiyonlar</option>
            <option value="Created">Oluşturuldu</option>
            <option value="Updated">Güncellendi</option>
            <option value="Deleted">Silindi</option>
            <option value="CredentialRevealed">Credential Görüntülendi</option>
          </select>
        </div>

        <div class="table-wrapper">
          @if (auditLoading()) {
            <div class="loading-row">Yükleniyor...</div>
          } @else if (!auditItems().length) {
            <div class="loading-row">Kayıt bulunamadı.</div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Zaman</th>
                  <th>Aksiyon</th>
                  <th>Entity</th>
                  <th>Kayıt</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                @for (log of auditItems(); track log.id) {
                  <tr [ngClass]="{'credential-row': log.action === 'CredentialRevealed'}">
                    <td class="muted-sm">{{ log.changedAt | date:'dd.MM.yyyy HH:mm:ss' }}</td>
                    <td>
                      <span class="action-badge" [ngClass]="actionCss(log.action)">
                        {{ actionLabel(log.action) }}
                      </span>
                    </td>
                    <td class="muted">{{ log.entityType }}</td>
                    <td class="entity-name">{{ log.entityName ?? log.entityId }}</td>
                    <td class="muted-sm">{{ log.ipAddress ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
            @if (auditTotalCount() > auditPageSize) {
              <div class="pagination">
                <button class="page-btn" [disabled]="auditPage() === 1" (click)="goAuditPage(auditPage() - 1)">
                  <i class="pi pi-chevron-left"></i>
                </button>
                <span class="page-info">{{ auditPage() }} / {{ auditTotalPages() }}</span>
                <button class="page-btn" [disabled]="auditPage() === auditTotalPages()" (click)="goAuditPage(auditPage() + 1)">
                  <i class="pi pi-chevron-right"></i>
                </button>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 1.25rem; }
    .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: none; border: none; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color 0.15s; &:hover { color: var(--text); } &.active { color: var(--primary); border-bottom-color: var(--primary); } }

    .loading-state { text-align: center; padding: 4rem; color: var(--text-subtle); }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); cursor: pointer; transition: box-shadow 0.15s; text-decoration: none; &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-color: var(--border-strong); } }
    .stat-icon { width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; font-size: 1.125rem; flex-shrink: 0; }
    .si--blue   { background: var(--primary-soft-bg-2); color: var(--primary-hover); }
    .si--green  { background: var(--success-soft-bg); color: var(--success-strong); }
    .si--violet { background: var(--violet-soft-bg); color: var(--violet); }
    .si--orange { background: var(--warning-soft-bg); color: var(--warning-strong); }
    .si--teal   { background: var(--success-soft-bg); color: var(--info); }
    .si--red    { background: var(--danger-soft-bg); color: var(--danger-strong); }
    .stat-val { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .stat-lbl { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.125rem; }
    .stat-sub { font-size: 0.7rem; color: var(--text-subtle); }

    .quick-links { h2 { font-size: 1rem; font-weight: 600; color: var(--text); margin-bottom: 0.75rem; } }
    .link-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
    .link-card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: var(--text); font-size: 0.875rem; font-weight: 500; transition: all 0.15s; &:hover { background: var(--indigo-soft-bg); border-color: var(--indigo-soft-border); color: var(--indigo-strong); } i { font-size: 1.125rem; color: var(--indigo); } }

    .audit-toolbar { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.5rem; font-size: 0.875rem; color: var(--text); background: var(--surface); } }

    .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .loading-row { padding: 3rem; text-align: center; color: var(--text-subtle); font-size: 0.875rem; }
    .data-table { width: 100%; border-collapse: collapse; th { background: var(--surface-2); padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); } td { padding: 0.625rem 0.75rem; font-size: 0.8125rem; color: var(--text); border-bottom: 1px solid var(--surface-3); } tr:last-child td { border-bottom: none; } }
    .credential-row td { background: var(--danger-faint-bg); }
    .muted { color: var(--text-muted); }
    .muted-sm { color: var(--text-subtle); font-size: 0.75rem; }
    .entity-name { font-weight: 500; color: var(--text-strong); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .action-badge { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
    .action--created { background: var(--success-soft-bg); color: var(--success-soft-text); }
    .action--updated { background: var(--primary-soft-bg-2); color: var(--primary-soft-text); }
    .action--deleted { background: var(--danger-soft-bg); color: var(--danger-soft-text); }
    .action--restored { background: var(--warning-soft-bg); color: var(--warning-soft-text); }
    .action--credential { background: var(--danger-soft-bg); color: var(--danger-soft-text); font-weight: 700; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 0.875rem; border-top: 1px solid var(--surface-3); }
    .page-btn { background: none; border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.375rem 0.625rem; cursor: pointer; color: var(--text); &:disabled { opacity: 0.4; cursor: not-allowed; } &:not(:disabled):hover { background: var(--surface-3); } }
    .page-info { font-size: 0.875rem; color: var(--text-muted); }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);

  activeTab = signal<'stats' | 'audit'>('stats');
  stats = signal<PlatformStats | null>(null);

  auditItems = signal<AuditLogItem[]>([]);
  auditLoading = signal(false);
  auditTotalCount = signal(0);
  auditPage = signal(1);
  readonly auditPageSize = 50;
  auditTotalPages = computed(() => Math.max(1, Math.ceil(this.auditTotalCount() / this.auditPageSize)));
  auditEntityType = '';
  auditAction = '';

  actionLabel(a: string) { return ACTION_LABEL[a] ?? a; }
  actionCss(a: string) { return ACTION_CSS[a] ?? ''; }

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get<PlatformStats>(`${environment.apiUrl}/admin/stats`).subscribe({
      next: s => this.stats.set(s)
    });
  }

  onAuditTab() {
    this.activeTab.set('audit');
    if (!this.auditItems().length) this.loadAudit();
  }

  loadAudit() {
    this.auditLoading.set(true);
    const params: Record<string, string> = { page: String(this.auditPage()), pageSize: String(this.auditPageSize) };
    if (this.auditEntityType) params['entityType'] = this.auditEntityType;
    if (this.auditAction) params['action'] = this.auditAction;
    const qs = new URLSearchParams(params).toString();
    this.http.get<AuditLogList>(`${environment.apiUrl}/admin/audit-logs?${qs}`).subscribe({
      next: r => { this.auditItems.set(r.items); this.auditTotalCount.set(r.totalCount); this.auditLoading.set(false); },
      error: () => this.auditLoading.set(false)
    });
  }

  goAuditPage(p: number) { this.auditPage.set(p); this.loadAudit(); }
}
