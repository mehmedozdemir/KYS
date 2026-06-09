import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass, SlicePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';

interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  action: string;
  changedBy: string | null;
  changedByName: string | null;
  changedAt: string;
  ipAddress: string | null;
}

interface AuditLogsResult {
  items: AuditLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const ACTION_CSS: Record<string, string> = {
  Created: 'action--created',
  Updated: 'action--updated',
  Deleted: 'action--deleted',
  Restored: 'action--restored',
  CredentialRevealed: 'action--credential'
};

const ACTION_LABEL: Record<string, string> = {
  Created: 'Oluşturuldu',
  Updated: 'Güncellendi',
  Deleted: 'Silindi',
  Restored: 'Geri Yüklendi',
  CredentialRevealed: 'Şifre Görüntülendi'
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  Customer: 'Müşteri', Product: 'Ürün', Team: 'Ekip', Person: 'Kişi',
  CustomerEnvironment: 'Ortam', EnvironmentResource: 'Ortam Kaynağı',
  KbArticle: 'KB Makalesi', TeamMembership: 'Ekip Üyeliği',
  CustomerProduct: 'Müşteri Ürünü', SystemRole: 'Sistem Rolü'
};

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, NgClass, SlicePipe],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <div class="breadcrumb"><a routerLink="/admin">Admin</a><span>/</span><span>Audit Log</span></div>
          <h1 class="page-title">Audit Log</h1>
          <p class="page-subtitle">Sistemdeki tüm create / update / delete işlemleri</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select [(ngModel)]="filterEntityType" (ngModelChange)="onFilter()">
          <option value="">Tüm varlıklar</option>
          @for (et of entityTypes; track et.value) {
            <option [value]="et.value">{{ et.label }}</option>
          }
        </select>
        <select [(ngModel)]="filterAction" (ngModelChange)="onFilter()">
          <option value="">Tüm aksiyonlar</option>
          <option value="Created">Oluşturuldu</option>
          <option value="Updated">Güncellendi</option>
          <option value="Deleted">Silindi</option>
          <option value="Restored">Geri Yüklendi</option>
          <option value="CredentialRevealed">Şifre Görüntülendi</option>
        </select>
        <input type="date" [(ngModel)]="filterFrom" (ngModelChange)="onFilter()" class="date-input" />
        <input type="date" [(ngModel)]="filterTo" (ngModelChange)="onFilter()" class="date-input" />
        <button type="button" class="btn-clear" (click)="clearFilters()">
          <i class="pi pi-times"></i> Temizle
        </button>
      </div>

      <div class="table-wrapper">
        @if (loading()) {
          <div class="empty-state">Yükleniyor...</div>
        } @else if (!logs().length) {
          <div class="empty-state">Kayıt bulunamadı.</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Aksiyon</th>
                <th>Varlık Tipi</th>
                <th>Varlık</th>
                <th>Kullanıcı</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs(); track log.id) {
                <tr [class.credential-row]="log.action === 'CredentialRevealed'">
                  <td class="time-cell">{{ log.changedAt | date:'dd.MM.yyyy HH:mm:ss' }}</td>
                  <td>
                    <span class="action-badge" [ngClass]="actionCss(log.action)">
                      {{ actionLabel(log.action) }}
                    </span>
                  </td>
                  <td class="entity-type">{{ entityTypeLabel(log.entityType) }}</td>
                  <td>
                    <span class="entity-name">{{ log.entityName ?? '—' }}</span>
                    <span class="entity-id">{{ log.entityId | slice:0:8 }}...</span>
                  </td>
                  <td>{{ log.changedByName ?? '—' }}</td>
                  <td class="ip-cell">{{ log.ipAddress ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          @if (totalCount() > pageSize) {
            <div class="pagination">
              <button type="button" class="page-btn" [disabled]="page() === 1" (click)="goToPage(page() - 1)">
                <i class="pi pi-chevron-left"></i>
              </button>
              <span class="page-info">{{ page() }} / {{ totalPages() }} ({{ totalCount() }} kayıt)</span>
              <button type="button" class="page-btn" [disabled]="page() === totalPages()" (click)="goToPage(page() + 1)">
                <i class="pi pi-chevron-right"></i>
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.375rem; a { color: var(--primary); text-decoration: none; } span { &:last-child { color: var(--text); } } }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
    select, .date-input { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.5rem; font-size: 0.875rem; color: var(--text); background: var(--surface); }
    .date-input { font-size: 0.8125rem; }
    .btn-clear { background: none; border: 1px solid var(--border-strong); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.8125rem; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.375rem; &:hover { background: var(--surface-2); color: var(--text); } }

    .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-state { padding: 3rem; text-align: center; color: var(--text-subtle); font-size: 0.875rem; }
    .data-table { width: 100%; border-collapse: collapse;
      th { background: var(--surface-2); padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); }
      td { padding: 0.625rem 0.75rem; font-size: 0.8125rem; color: var(--text); border-bottom: 1px solid var(--surface-3); vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
    }
    .credential-row td { background: var(--warning-faint-bg); }
    .time-cell { font-family: monospace; font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }
    .entity-type { color: var(--text-muted); }
    .entity-name { display: block; font-weight: 500; color: var(--text-strong); }
    .entity-id { display: block; font-size: 0.7rem; color: var(--text-subtle); font-family: monospace; }
    .ip-cell { font-family: monospace; font-size: 0.75rem; color: var(--text-subtle); }

    .action-badge { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .action--created { background: var(--success-soft-bg); color: var(--success-soft-text); }
    .action--updated { background: var(--primary-soft-bg-2); color: var(--primary-soft-text); }
    .action--deleted { background: var(--danger-soft-bg); color: var(--danger-soft-text); }
    .action--restored { background: var(--warning-soft-bg); color: var(--warning-soft-text); }
    .action--credential { background: var(--warning-border); color: var(--warning-soft-text); }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 0.875rem; border-top: 1px solid var(--surface-3); }
    .page-btn { background: none; border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.375rem 0.625rem; cursor: pointer; color: var(--text); &:disabled { opacity: 0.4; cursor: not-allowed; } &:not(:disabled):hover { background: var(--surface-3); } }
    .page-info { font-size: 0.8125rem; color: var(--text-muted); }
  `]
})
export class AuditLogComponent implements OnInit {
  private http = inject(HttpClient);

  logs = signal<AuditLogEntry[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 50;
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  filterEntityType = '';
  filterAction = '';
  filterFrom = '';
  filterTo = '';

  readonly entityTypes = Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  ngOnInit() { this.load(); }

  onFilter() { this.page.set(1); this.load(); }
  goToPage(p: number) { this.page.set(p); this.load(); }

  clearFilters() {
    this.filterEntityType = '';
    this.filterAction = '';
    this.filterFrom = '';
    this.filterTo = '';
    this.onFilter();
  }

  private load() {
    this.loading.set(true);
    const params = new URLSearchParams({
      page: String(this.page()),
      pageSize: String(this.pageSize)
    });
    if (this.filterEntityType) params.set('entityType', this.filterEntityType);
    if (this.filterAction) params.set('action', this.filterAction);
    if (this.filterFrom) params.set('from', new Date(this.filterFrom).toISOString());
    if (this.filterTo) {
      const to = new Date(this.filterTo);
      to.setHours(23, 59, 59, 999);
      params.set('to', to.toISOString());
    }

    this.http.get<AuditLogsResult>(`${environment.apiUrl}/admin/audit-logs?${params}`).subscribe({
      next: r => { this.logs.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  actionCss(action: string) { return ACTION_CSS[action] ?? 'action--updated'; }
  actionLabel(action: string) { return ACTION_LABEL[action] ?? action; }
  entityTypeLabel(et: string) { return ENTITY_TYPE_LABELS[et] ?? et; }
}
