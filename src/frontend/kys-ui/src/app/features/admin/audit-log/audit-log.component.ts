import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass, SlicePipe } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
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
  context: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

interface FieldChange { field: string; old: string; new: string; }

// Değişiklik listesinde gösterilmeyecek teknik alanlar
const HIDDEN_FIELDS = new Set(['Id', 'CreatedAt', 'CreatedBy', 'UpdatedAt', 'UpdatedBy', 'DeletedAt', 'DeletedBy', 'IsDeleted']);

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
  CredentialRevealed: 'action--credential',
  VpnPasswordRevealed: 'action--credential',
  PersonalCredentialRevealed: 'action--credential'
};

const ENTITY_TYPE_KEYS = [
  'Customer', 'CustomerProduct', 'CustomerEnvironment', 'EnvironmentResource', 'CustomerEnvironmentEndpoint',
  'ResourceCredential', 'PersonalCredential', 'CustomerVpnConfig', 'SharedResource',
  'Product', 'ProductEndpoint', 'ProductResourceTemplate', 'ProductTeam', 'ProductAssignment',
  'Team', 'TeamMembership', 'Person', 'AccessGrant', 'SystemRole',
  'KbArticle', 'CustomFieldDefinition', 'OrganizationProfile', 'EnvironmentType', 'HostingPlatform', 'ResourceType'
];

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, NgClass, SlicePipe, TranslocoModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <div class="breadcrumb"><a routerLink="/admin">{{ 'admin.auditLog.crumb' | transloco }}</a><span>/</span><span>{{ 'admin.auditLog.title' | transloco }}</span></div>
          <h1 class="page-title">{{ 'admin.auditLog.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'admin.auditLog.subtitle' | transloco }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select [(ngModel)]="filterEntityType" (ngModelChange)="onFilter()">
          <option value="">{{ 'admin.auditLog.allEntities' | transloco }}</option>
          @for (et of entityTypeKeys; track et) {
            <option [value]="et">{{ 'admin.auditLog.entity.' + et | transloco }}</option>
          }
        </select>
        <select [(ngModel)]="filterAction" (ngModelChange)="onFilter()">
          <option value="">{{ 'admin.auditLog.allActions' | transloco }}</option>
          <option value="Created">{{ 'admin.auditLog.action.Created' | transloco }}</option>
          <option value="Updated">{{ 'admin.auditLog.action.Updated' | transloco }}</option>
          <option value="Deleted">{{ 'admin.auditLog.action.Deleted' | transloco }}</option>
          <option value="Restored">{{ 'admin.auditLog.action.Restored' | transloco }}</option>
          <option value="CredentialRevealed">{{ 'admin.auditLog.action.CredentialRevealed' | transloco }}</option>
          <option value="VpnPasswordRevealed">{{ 'admin.auditLog.action.VpnPasswordRevealed' | transloco }}</option>
          <option value="PersonalCredentialRevealed">{{ 'admin.auditLog.action.PersonalCredentialRevealed' | transloco }}</option>
        </select>
        <input type="date" [(ngModel)]="filterFrom" (ngModelChange)="onFilter()" class="date-input" />
        <input type="date" [(ngModel)]="filterTo" (ngModelChange)="onFilter()" class="date-input" />
        <button type="button" class="btn-clear" (click)="clearFilters()">
          <i class="pi pi-times"></i> {{ 'admin.auditLog.clear' | transloco }}
        </button>
      </div>

      <div class="table-wrapper">
        @if (loading()) {
          <div class="empty-state">{{ 'common.loading' | transloco }}</div>
        } @else if (!logs().length) {
          <div class="empty-state">{{ 'common.recordNotFound' | transloco }}</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'admin.auditLog.colTime' | transloco }}</th>
                <th>{{ 'admin.auditLog.colAction' | transloco }}</th>
                <th>{{ 'admin.auditLog.colEntityType' | transloco }}</th>
                <th>{{ 'admin.auditLog.colEntity' | transloco }}</th>
                <th>{{ 'admin.auditLog.colUser' | transloco }}</th>
                <th>{{ 'admin.auditLog.colIp' | transloco }}</th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs(); track log.id) {
                @let changes = fieldChanges(log);
                <tr [class.credential-row]="log.action.endsWith('Revealed')"
                    [class.expandable]="changes.length > 0"
                    [attr.aria-expanded]="changes.length ? expandedId() === log.id : null"
                    (click)="changes.length && toggle(log.id)">
                  <td class="time-cell">
                    @if (changes.length) {
                      <i class="pi expand-icon" [ngClass]="expandedId() === log.id ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                    }
                    {{ log.changedAt | date:'dd.MM.yyyy HH:mm:ss' }}
                  </td>
                  <td>
                    <span class="action-badge" [ngClass]="actionCss(log.action)">
                      {{ actionLabel(log.action) }}
                    </span>
                  </td>
                  <td class="entity-type">{{ entityTypeLabel(log.entityType) }}</td>
                  <td>
                    <span class="entity-name">{{ log.entityName ?? '—' }}</span>
                    @if (log.context) {
                      <span class="entity-context" [title]="log.context">{{ log.context }}</span>
                    } @else {
                      <span class="entity-id">{{ log.entityId | slice:0:8 }}...</span>
                    }
                  </td>
                  <td>{{ log.changedByName ?? '—' }}</td>
                  <td class="ip-cell">{{ log.ipAddress ?? '—' }}</td>
                </tr>
                @if (expandedId() === log.id) {
                  <tr class="changes-row">
                    <td colspan="6">
                      <table class="changes-table">
                        <thead>
                          <tr>
                            <th>{{ 'admin.auditLog.field' | transloco }}</th>
                            @if (log.action !== 'Created') { <th>{{ 'admin.auditLog.oldValue' | transloco }}</th> }
                            @if (log.action !== 'Deleted') { <th>{{ 'admin.auditLog.newValue' | transloco }}</th> }
                          </tr>
                        </thead>
                        <tbody>
                          @for (c of changes; track c.field) {
                            <tr>
                              <td class="field-name">{{ c.field }}</td>
                              @if (log.action !== 'Created') { <td class="old-val">{{ c.old }}</td> }
                              @if (log.action !== 'Deleted') { <td class="new-val">{{ c.new }}</td> }
                            </tr>
                          }
                        </tbody>
                      </table>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          <!-- Pagination -->
          @if (totalCount() > pageSize) {
            <div class="pagination">
              <button type="button" class="page-btn" [disabled]="page() === 1" (click)="goToPage(page() - 1)" [attr.aria-label]="'common.previous' | transloco">
                <i class="pi pi-chevron-left"></i>
              </button>
              <span class="page-info">{{ page() }} / {{ totalPages() }} ({{ 'admin.auditLog.recordCount' | transloco:{ count: totalCount() } }})</span>
              <button type="button" class="page-btn" [disabled]="page() === totalPages()" (click)="goToPage(page() + 1)" [attr.aria-label]="'common.next' | transloco">
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
    .entity-context { display: block; font-size: 0.75rem; color: var(--text-muted); max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    tr.expandable { cursor: pointer; }
    tr.expandable:hover td { background: var(--surface-2); }
    .expand-icon { font-size: 0.7rem; color: var(--text-subtle); margin-right: 0.25rem; }
    .changes-row > td { background: var(--surface-2); padding: 0.75rem 1rem 1rem 2.5rem; }
    .changes-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem;
      th { text-align: left; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-subtle); padding: 0.375rem 0.5rem; border-bottom: 1px solid var(--border); background: transparent; }
      td { padding: 0.375rem 0.5rem; border-bottom: 1px solid var(--border-light); vertical-align: top; word-break: break-word; }
      .field-name { font-family: monospace; color: var(--text-muted); white-space: nowrap; }
      .old-val { color: var(--danger); }
      .new-val { color: var(--success-strong, var(--text-strong)); } }
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
  private transloco = inject(TranslocoService);

  logs = signal<AuditLogEntry[]>([]);
  expandedId = signal<string | null>(null);

  toggle(id: string) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  // Eski/yeni değerleri alan bazında karşılaştırır; teknik alanlar ve değişmeyenler gizlenir.
  fieldChanges(log: AuditLogEntry): FieldChange[] {
    const oldV = log.oldValues ?? {};
    const newV = log.newValues ?? {};
    const keys = [...new Set([...Object.keys(oldV), ...Object.keys(newV)])].filter(k => !HIDDEN_FIELDS.has(k));
    return keys
      .map(field => ({ field, old: this.fmt(oldV[field]), new: this.fmt(newV[field]) }))
      .filter(c => log.action !== 'Updated' || c.old !== c.new)
      .filter(c => log.action === 'Updated' || (log.action === 'Created' ? c.new !== '—' : c.old !== '—'));
  }

  private fmt(v: unknown): string {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 50;
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  filterEntityType = '';
  filterAction = '';
  filterFrom = '';
  filterTo = '';

  readonly entityTypeKeys = ENTITY_TYPE_KEYS;

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
  actionLabel(action: string) {
    const key = `admin.auditLog.action.${action}`;
    const label = this.transloco.translate(key);
    return label === key ? action : label;
  }
  entityTypeLabel(et: string) {
    const key = `admin.auditLog.entity.${et}`;
    const label = this.transloco.translate(key);
    return label === key ? et : label;
  }
}
