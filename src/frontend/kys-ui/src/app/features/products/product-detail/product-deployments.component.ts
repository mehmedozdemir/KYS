import { Component, Input, OnChanges, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { STAGE_META, STAGE_ORDER, DeploymentStage } from '../../../shared/deployment-stage';

interface DeploymentEnv {
  id: string; name: string; typeCode: string; typeName: string; typeColor: string | null;
  platformName: string | null; deployedVersion: string | null; isActive: boolean;
}
interface DeploymentRow {
  customerId: string; customerName: string; customerCode: string; customerStatus: string; customerArchived: boolean;
  customerProductId: string | null; stage: DeploymentStage; stageSince: string | null;
  isOverdue: boolean; overdueDays: number | null; usageMode: string | null;
  installationStartedAt: string | null; goLiveAt: string | null; targetGoLiveAt: string | null; discontinuedAt: string | null;
  prodVersion: string | null; isOutdated: boolean; environments: DeploymentEnv[];
}
interface ProductDeployments {
  productId: string; productName: string; currentVersion: string | null;
  stageCounts: Record<DeploymentStage, number>; overdueCount: number; includesNonUsers: boolean;
  versionDistribution: { version: string; customerCount: number; isCurrent: boolean }[];
  rows: DeploymentRow[];
}

/** Ürünün müşterilerdeki kurulum durumu: aşama, ortamlar, sürüm, hedef tarih, gecikme. */
@Component({
  selector: 'app-product-deployments',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslocoModule],
  template: `
    @if (data(); as d) {
      <!-- Özet: aşama başına sayaç (tıklanınca filtre) -->
      <div class="summary">
        @for (s of visibleStages(); track s) {
          <button type="button" class="chip" [class.chip--active]="filter() === s" [attr.data-stage]="s"
                  [attr.aria-pressed]="filter() === s" (click)="toggleFilter(s)">
            <i class="pi" [class]="meta[s].icon"></i>
            <span class="chip-count">{{ d.stageCounts[s] }}</span>
            <span>{{ 'deployment.stage.' + s | transloco }}</span>
          </button>
        }
        @if (d.overdueCount) {
          <button type="button" class="chip chip--overdue" [class.chip--active]="filter() === 'overdue'"
                  [attr.aria-pressed]="filter() === 'overdue'" (click)="toggleFilter('overdue')">
            <i class="pi pi-exclamation-triangle"></i>
            <span class="chip-count">{{ d.overdueCount }}</span>
            <span>{{ 'deployment.overdue' | transloco }}</span>
          </button>
        }
        <span class="spacer"></span>
        <button type="button" class="btn-export" (click)="exportCsv()"><i class="pi pi-download"></i> CSV</button>
      </div>

      <!-- Sürüm dağılımı (müşterilerin Prod ortamındaki sürümler) -->
      @if (d.versionDistribution.length) {
        <div class="versions">
          <span class="versions-label">{{ 'deployment.prodVersions' | transloco }}</span>
          @for (v of d.versionDistribution; track v.version) {
            <span class="version" [class.version--current]="v.isCurrent" [title]="v.isCurrent ? ('deployment.currentVersion' | transloco) : ''">
              @if (v.isCurrent) { <i class="pi pi-check"></i> } v{{ v.version }} · {{ v.customerCount }}
            </span>
          }
          @if (d.currentVersion) { <span class="versions-note">{{ 'deployment.productVersion' | transloco:{ version: d.currentVersion } }}</span> }
        </div>
      }

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>{{ 'deployment.col.customer' | transloco }}</th>
              <th>{{ 'deployment.col.stage' | transloco }}</th>
              <th>{{ 'deployment.col.environments' | transloco }}</th>
              <th>{{ 'deployment.col.prodVersion' | transloco }}</th>
              <th>{{ 'deployment.col.target' | transloco }}</th>
              <th>{{ 'deployment.col.goLive' | transloco }}</th>
            </tr>
          </thead>
          <tbody>
            @for (r of filteredRows(); track r.customerId) {
              <tr [class.row--muted]="r.stage === 'NotUsed' || r.stage === 'Discontinued'">
                <td>
                  <a [routerLink]="['/customers', r.customerId]" class="customer">{{ r.customerName }}</a>
                  <span class="sub">{{ r.customerCode }}@if (r.usageMode) { · {{ 'status.usageMode.' + r.usageMode | transloco }} }</span>
                </td>
                <td>
                  <span class="stage" [attr.data-stage]="r.stage">
                    <i class="pi" [class]="meta[r.stage].icon"></i> {{ 'deployment.stage.' + r.stage | transloco }}
                  </span>
                  @if (r.isOverdue) {
                    <span class="overdue"><i class="pi pi-exclamation-triangle"></i> {{ 'deployment.overdueDays' | transloco:{ days: r.overdueDays } }}</span>
                  } @else if (r.stageSince && inProgress(r.stage)) {
                    <span class="sub">{{ 'deployment.daysInStage' | transloco:{ days: daysSince(r.stageSince) } }}</span>
                  }
                </td>
                <td>
                  <div class="envs">
                    @for (e of r.environments; track e.id) {
                      <a class="env" [routerLink]="['/environments', e.id]" [class.env--inactive]="!e.isActive"
                         [title]="e.typeName + (e.platformName ? ' · ' + e.platformName : '') + (e.deployedVersion ? ' · v' + e.deployedVersion : '')">
                        <span class="env-dot" [style.background]="e.typeColor ?? 'var(--text-subtle)'"></span>{{ e.typeCode }}
                        @if (e.deployedVersion) { <span class="env-ver">{{ e.deployedVersion }}</span> }
                      </a>
                    } @empty {
                      <span class="sub">—</span>
                    }
                  </div>
                  @if (platformOf(r); as p) { <span class="sub">{{ p }}</span> }
                </td>
                <td>
                  @if (r.prodVersion) {
                    <span class="ver" [class.ver--old]="r.isOutdated" [title]="r.isOutdated ? ('deployment.outdated' | transloco) : ''">
                      v{{ r.prodVersion }} @if (r.isOutdated) { <i class="pi pi-arrow-up"></i> }
                    </span>
                  } @else { <span class="sub">—</span> }
                </td>
                <td class="date">{{ r.targetGoLiveAt ? (r.targetGoLiveAt | date:'dd.MM.yyyy') : '—' }}</td>
                <td class="date">
                  @if (r.stage === 'Discontinued' && r.discontinuedAt) { <span class="sub">{{ 'deployment.endedOn' | transloco }}</span> {{ r.discontinuedAt | date:'dd.MM.yyyy' }} }
                  @else { {{ r.goLiveAt ? (r.goLiveAt | date:'dd.MM.yyyy') : '—' }} }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">{{ 'deployment.noRows' | transloco }}</td></tr>
            }
          </tbody>
        </table>
      </div>
      @if (!d.includesNonUsers) {
        <p class="note"><i class="pi pi-info-circle"></i> {{ 'deployment.scopedNote' | transloco }}</p>
      }
    } @else if (loading()) {
      <p class="note">{{ 'common.loading' | transloco }}</p>
    }
  `,
  styles: [`
    .summary { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; }
    .spacer { flex: 1; }
    .chip { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 9999px; cursor: pointer;
      border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 0.8125rem;
      &:hover { border-color: var(--border-strong); } }
    .chip--active { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-soft-bg); }
    .chip-count { font-weight: 700; color: var(--text-strong); }
    .chip--overdue { color: var(--danger); border-color: var(--danger-border, var(--danger)); }
    .btn-export { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 0.5rem; cursor: pointer;
      border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); font-size: 0.8125rem; }
    .versions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.8125rem; }
    .versions-label { color: var(--text-muted); }
    .versions-note { color: var(--text-subtle); font-size: 0.75rem; }
    .version { padding: 0.125rem 0.5rem; border-radius: 0.375rem; background: var(--surface-3); color: var(--text); font-variant-numeric: tabular-nums; }
    .version--current { background: var(--success-soft-bg, var(--surface-3)); color: var(--success-strong, var(--text)); }
    .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden;
      table { width: 100%; border-collapse: collapse; }
      th { background: var(--surface-2); padding: 0.625rem 0.75rem; text-align: left; font-size: 0.7rem; font-weight: 600; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--border); white-space: nowrap; }
      td { padding: 0.625rem 0.75rem; font-size: 0.875rem; color: var(--text); border-bottom: 1px solid var(--surface-3); vertical-align: top; }
      tr:last-child td { border-bottom: none; } }
    .row--muted td { color: var(--text-muted); }
    .customer { font-weight: 500; color: var(--text-strong); text-decoration: none; display: block; &:hover { color: var(--primary); } }
    .sub { display: block; font-size: 0.75rem; color: var(--text-subtle); }
    .stage { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; font-weight: 600; white-space: nowrap; }
    [data-stage='Live'] .pi, .stage[data-stage='Live'] { color: var(--success-strong, var(--success)); }
    [data-stage='ProdReady'] .pi, .stage[data-stage='ProdReady'] { color: var(--warning-strong, var(--warning)); }
    [data-stage='Installing'] .pi, .stage[data-stage='Installing'] { color: var(--primary); }
    [data-stage='Planned'] .pi, .stage[data-stage='Planned'] { color: var(--text-muted); }
    .stage[data-stage='Inactive'], .stage[data-stage='Discontinued'], .stage[data-stage='NotUsed'] { color: var(--text-subtle); font-weight: 500; }
    .overdue { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 600; color: var(--danger); margin-top: 0.125rem; }
    .envs { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .env { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.0625rem 0.4375rem; border-radius: 0.375rem; border: 1px solid var(--border);
      font-size: 0.7rem; font-weight: 600; color: var(--text); text-decoration: none; &:hover { border-color: var(--primary); } }
    .env--inactive { opacity: 0.5; text-decoration: line-through; }
    .env-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; }
    .env-ver { font-weight: 400; color: var(--text-muted); }
    .ver { font-variant-numeric: tabular-nums; }
    .ver--old { color: var(--warning-strong, var(--warning)); font-weight: 600; }
    .date { white-space: nowrap; font-variant-numeric: tabular-nums; }
    .empty { text-align: center; color: var(--text-subtle); padding: 2rem !important; }
    .note { font-size: 0.8125rem; color: var(--text-subtle); margin-top: 0.75rem; display: flex; gap: 0.375rem; align-items: center; }
  `]
})
export class ProductDeploymentsComponent implements OnChanges {
  private http = inject(HttpClient);
  private transloco = inject(TranslocoService);

  @Input({ required: true }) productId!: string;

  readonly meta = STAGE_META;
  data = signal<ProductDeployments | null>(null);
  loading = signal(true);
  filter = signal<DeploymentStage | 'overdue' | null>(null);

  // "Kullanmıyor" yalnızca global yetkide gelir; sayacı olmayan aşamalar gizlenir (Canlı/Kurulum her zaman görünür)
  visibleStages = computed(() => {
    const d = this.data();
    if (!d) return [];
    return STAGE_ORDER.filter(s => (d.stageCounts[s] ?? 0) > 0 || s === 'Live' || s === 'Installing');
  });

  filteredRows = computed(() => {
    const rows = this.data()?.rows ?? [];
    const f = this.filter();
    if (!f) return rows;
    return f === 'overdue' ? rows.filter(r => r.isOverdue) : rows.filter(r => r.stage === f);
  });

  ngOnChanges() {
    this.loading.set(true);
    this.http.get<ProductDeployments>(`${environment.apiUrl}/products/${this.productId}/deployments`).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  toggleFilter(f: DeploymentStage | 'overdue') { this.filter.set(this.filter() === f ? null : f); }

  inProgress(s: DeploymentStage) { return s === 'Planned' || s === 'Installing' || s === 'ProdReady'; }

  // Aktif ortamların barındırma platformları (tekrarsız)
  platformOf(r: DeploymentRow): string | null {
    const p = [...new Set(r.environments.filter(e => e.isActive && e.platformName).map(e => e.platformName!))];
    return p.length ? p.join(', ') : null;
  }

  daysSince(iso: string): number {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((today.getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000));
  }

  exportCsv() {
    const d = this.data();
    if (!d) return;
    const t = (k: string) => this.transloco.translate(k);
    const header = ['customer', 'stage', 'environments', 'prodVersion', 'target', 'goLive'].map(k => t('deployment.col.' + k));
    const lines = this.filteredRows().map(r => [
      r.customerName,
      t('deployment.stage.' + r.stage) + (r.isOverdue ? ` (${t('deployment.overdue')} ${r.overdueDays})` : ''),
      r.environments.filter(e => e.isActive).map(e => e.typeCode + (e.deployedVersion ? ' ' + e.deployedVersion : '')).join(' | '),
      r.prodVersion ?? '', r.targetGoLiveAt ?? '', r.goLiveAt ?? ''
    ]);
    const esc = (v: string) => /[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    // Excel'in Türkçe karakterleri doğru okuması için BOM; ayırıcı Excel TR varsayılanı ";"
    const csv = '﻿' + [header, ...lines].map(l => l.map(esc).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d.productName} - kurulum durumu.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
