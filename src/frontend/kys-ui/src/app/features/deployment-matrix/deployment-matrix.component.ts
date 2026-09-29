import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { environment } from '../../../environments/environment';
import { STAGE_META, STAGE_ORDER, DeploymentStage } from '../../shared/deployment-stage';

interface MatrixCell { customerId: string; productId: string; stage: DeploymentStage; isOverdue: boolean; prodVersion: string | null; }
interface DeploymentMatrix {
  products: { id: string; name: string; code: string }[];
  customers: { id: string; name: string; code: string; status: string }[];
  cells: MatrixCell[];
}

/** Şirket geneli kurulum matrisi: satır = müşteri, sütun = ürün, hücre = kurulum aşaması. */
@Component({
  selector: 'app-deployment-matrix',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslocoModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ 'deployment.matrix.title' | transloco }}</h1>
        <p class="page-subtitle">{{ 'deployment.matrix.subtitle' | transloco }}</p>
      </div>
    </div>

    @if (data(); as d) {
      <div class="toolbar">
        <input type="search" class="search" [(ngModel)]="query" [placeholder]="'deployment.matrix.searchCustomer' | transloco"
               [attr.aria-label]="'deployment.matrix.searchCustomer' | transloco" />
        <label class="check"><input type="checkbox" [(ngModel)]="onlyInProgress" /> {{ 'deployment.matrix.onlyInProgress' | transloco }}</label>
        <span class="spacer"></span>
        <div class="legend" aria-hidden="true">
          @for (s of legend; track s) {
            <span class="legend-item" [attr.data-stage]="s"><i class="pi" [class]="meta[s].icon"></i> {{ 'deployment.stage.' + s | transloco }}</span>
          }
          <span class="legend-item overdue"><i class="pi pi-exclamation-triangle"></i> {{ 'deployment.overdue' | transloco }}</span>
        </div>
      </div>

      <div class="matrix-wrap">
        <table class="matrix">
          <thead>
            <tr>
              <th class="sticky-col">{{ 'deployment.col.customer' | transloco }}</th>
              @for (p of d.products; track p.id) {
                <th><a [routerLink]="['/products', p.id]" [queryParams]="{ tab: 'customers' }" [title]="p.name">{{ p.name }}</a></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (c of visibleCustomers(); track c.id) {
              <tr>
                <th class="sticky-col" scope="row">
                  <a [routerLink]="['/customers', c.id]">{{ c.name }}</a>
                  <span class="sub">{{ c.code }}</span>
                </th>
                @for (p of d.products; track p.id) {
                  @if (cell(c.id, p.id); as x) {
                    <td [attr.data-stage]="x.stage" [class.is-overdue]="x.isOverdue"
                        [title]="c.name + ' · ' + p.name + ': ' + ('deployment.stage.' + x.stage | transloco) + (x.prodVersion ? ' · v' + x.prodVersion : '')">
                      <span class="cell">
                        <i class="pi" [class]="x.isOverdue ? 'pi-exclamation-triangle' : meta[x.stage].icon"></i>
                        <span class="cell-label">{{ 'deployment.stage.' + x.stage | transloco }}</span>
                      </span>
                      @if (x.prodVersion) { <span class="cell-ver">v{{ x.prodVersion }}</span> }
                    </td>
                  } @else {
                    <td class="empty-cell"><span class="sr-only">{{ 'deployment.stage.NotUsed' | transloco }}</span>·</td>
                  }
                }
              </tr>
            } @empty {
              <tr><td [attr.colspan]="d.products.length + 1" class="no-rows">{{ 'deployment.noRows' | transloco }}</td></tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <th class="sticky-col">{{ 'deployment.matrix.liveTotal' | transloco }}</th>
              @for (p of d.products; track p.id) {
                <td class="total">{{ liveCount(p.id) }} / {{ usedCount(p.id) }}</td>
              }
            </tr>
          </tfoot>
        </table>
      </div>
    } @else if (loading()) {
      <p class="note">{{ 'common.loading' | transloco }}</p>
    }
  `,
  styles: [`
    :host { display: block; padding: 1.5rem; }
    .page-header { margin-bottom: 1rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0.25rem 0 0; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem; }
    .search { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.5rem; background: var(--surface);
      color: var(--text); font-size: 0.875rem; min-width: 14rem; }
    .check { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--text); cursor: pointer; }
    .spacer { flex: 1; }
    .legend { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.75rem; color: var(--text-muted); }
    .legend-item { display: inline-flex; align-items: center; gap: 0.25rem; }
    .matrix-wrap { overflow: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; max-height: calc(100vh - 14rem); }
    .matrix { border-collapse: separate; border-spacing: 0; min-width: 100%;
      th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--surface-3); border-right: 1px solid var(--surface-3); font-size: 0.8125rem; }
      thead th { position: sticky; top: 0; z-index: 2; background: var(--surface-2); color: var(--text-muted); font-size: 0.75rem; font-weight: 600;
        text-align: center; white-space: nowrap; a { color: inherit; text-decoration: none; &:hover { color: var(--primary); } } }
      tfoot th, tfoot td { position: sticky; bottom: 0; background: var(--surface-2); font-weight: 600; color: var(--text-muted); }
      a { color: var(--text-strong); text-decoration: none; &:hover { color: var(--primary); } } }
    .sticky-col { position: sticky; left: 0; z-index: 1; background: var(--surface); text-align: left !important; min-width: 12rem; }
    thead .sticky-col, tfoot .sticky-col { z-index: 3; background: var(--surface-2); }
    tbody th { font-weight: 500; }
    .sub { display: block; font-size: 0.7rem; color: var(--text-subtle); font-weight: 400; }
    td { text-align: center; white-space: nowrap; }
    .cell { display: inline-flex; align-items: center; gap: 0.25rem; font-weight: 600; font-size: 0.75rem; }
    .cell-ver { display: block; font-size: 0.7rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
    [data-stage='Live'] .pi, [data-stage='Live'] .cell { color: var(--success-strong, var(--success)); }
    [data-stage='ProdReady'] .pi, [data-stage='ProdReady'] .cell { color: var(--warning-strong, var(--warning)); }
    [data-stage='Installing'] .pi, [data-stage='Installing'] .cell { color: var(--primary); }
    [data-stage='Planned'] .pi, [data-stage='Planned'] .cell { color: var(--text-muted); }
    [data-stage='Inactive'] .cell, [data-stage='Discontinued'] .cell,
    [data-stage='Inactive'] .pi, [data-stage='Discontinued'] .pi { color: var(--text-subtle); font-weight: 500; }
    td.is-overdue { box-shadow: inset 0 0 0 2px var(--danger); .pi { color: var(--danger); } }
    .legend-item.overdue .pi { color: var(--danger); }
    .empty-cell { color: var(--text-subtle); }
    .total { font-variant-numeric: tabular-nums; }
    .no-rows { text-align: center; color: var(--text-subtle); padding: 2rem; }
    .note { color: var(--text-subtle); }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    @media (max-width: 768px) { :host { padding: 1rem; } .cell-label { display: none; } }
  `]
})
export class DeploymentMatrixComponent {
  private http = inject(HttpClient);

  readonly meta = STAGE_META;
  readonly legend = STAGE_ORDER.filter(s => s !== 'NotUsed');
  data = signal<DeploymentMatrix | null>(null);
  loading = signal(true);
  queryText = signal('');
  inProgressOnly = signal(false);

  get query() { return this.queryText(); }
  set query(v: string) { this.queryText.set(v); }
  get onlyInProgress() { return this.inProgressOnly(); }
  set onlyInProgress(v: boolean) { this.inProgressOnly.set(v); }

  private cellMap = computed(() => {
    const m = new Map<string, MatrixCell>();
    for (const c of this.data()?.cells ?? []) m.set(c.customerId + '|' + c.productId, c);
    return m;
  });

  visibleCustomers = computed(() => {
    const d = this.data();
    if (!d) return [];
    const q = this.queryText().trim().toLocaleLowerCase('tr-TR');
    const inProgress = new Set<DeploymentStage>(['Planned', 'Installing', 'ProdReady']);
    return d.customers.filter(c =>
      (!q || c.name.toLocaleLowerCase('tr-TR').includes(q) || c.code.toLocaleLowerCase('tr-TR').includes(q)) &&
      (!this.inProgressOnly() || d.cells.some(x => x.customerId === c.id && (inProgress.has(x.stage) || x.isOverdue))));
  });

  constructor() {
    this.http.get<DeploymentMatrix>(`${environment.apiUrl}/customers/deployment-matrix`).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  cell(customerId: string, productId: string) { return this.cellMap().get(customerId + '|' + productId); }

  liveCount(productId: string) { return (this.data()?.cells ?? []).filter(c => c.productId === productId && c.stage === 'Live').length; }
  usedCount(productId: string) {
    return (this.data()?.cells ?? []).filter(c => c.productId === productId && c.stage !== 'Discontinued' && c.stage !== 'Inactive').length;
  }
}
