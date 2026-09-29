import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../environments/environment';

interface ExecutiveSummary {
  customerPipeline: { status: string; count: number }[];
  onboarding: { id: string; name: string; code: string; onboardingStartedAt: string | null; testEnvReadyAt: string | null; prodEnvReadyAt: string | null }[];
  recentGoLives: { customerId: string; customerName: string; productName: string; goLiveAt: string }[];
  productAdoption: { productId: string; name: string; code: string; customerCount: number; liveCount: number }[];
  upcomingDates: { customerId: string; customerName: string; fieldName: string; date: string }[];
  numberTotals: { fieldName: string; total: number; customerCount: number }[];
  credentialRevealsLast30Days: number;
  changesLast7Days: number;
}

// Müşteri hattının iş akışı sırası (sayılar API'den bu sıraya yerleştirilir).
const PIPELINE_ORDER = ['Prospect', 'Onboarding', 'Active', 'Inactive', 'Churned'];

/**
 * Yönetici özeti — şirket geneli; yalnızca scope:global yetkisiyle görünür (sözleşme bedelleri içerir).
 * Form seçimi: az sayıda büyüklük → sayaç kartı; tek seri karşılaştırma → tek renkli yatay çubuk;
 * tarih/olay listeleri → liste. Çok renkli kategorik palet kullanılmaz.
 */
@Component({
  selector: 'app-executive-summary',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslocoModule],
  template: `
    @if (data(); as d) {
      <section class="exec" [attr.aria-label]="'dashboard.exec.title' | transloco">
        <h2 class="exec-title">{{ 'dashboard.exec.title' | transloco }}</h2>

        <!-- Müşteri hattı + sözleşme toplamı -->
        <div class="row">
          <div class="card pipeline">
            <h3>{{ 'dashboard.exec.pipeline' | transloco }}</h3>
            <div class="pipeline-steps">
              @for (s of pipeline(); track s.status) {
                <a class="step" [routerLink]="['/customers']" [queryParams]="{ status: s.status }"
                   [class.step--muted]="s.status === 'Churned' || s.status === 'Inactive'">
                  <span class="step-value">{{ s.count }}</span>
                  <span class="step-label">{{ 'status.customer.' + s.status | transloco }}</span>
                </a>
              }
            </div>
          </div>
          @for (t of d.numberTotals; track t.fieldName) {
            <div class="card hero">
              <h3>{{ t.fieldName }}</h3>
              <div class="hero-value">{{ formatNumber(t.total) }}</div>
              <div class="hero-sub">{{ 'dashboard.exec.acrossCustomers' | transloco:{ count: t.customerCount } }}</div>
            </div>
          }
          <div class="card hero">
            <h3>{{ 'dashboard.exec.security' | transloco }}</h3>
            <div class="hero-value">{{ d.credentialRevealsLast30Days }}</div>
            <div class="hero-sub">{{ 'dashboard.exec.revealsLast30' | transloco }} · {{ 'dashboard.exec.changesLast7' | transloco:{ count: d.changesLast7Days } }}</div>
          </div>
        </div>

        <div class="row">
          <!-- Yaklaşan tarihler (ör. sözleşme bitişleri) -->
          <div class="card">
            <h3>{{ 'dashboard.exec.upcoming' | transloco }}</h3>
            @if (!d.upcomingDates.length) {
              <p class="muted">{{ 'dashboard.exec.noUpcoming' | transloco }}</p>
            } @else {
              <ul class="list">
                @for (u of d.upcomingDates; track u.customerId + u.fieldName) {
                  <li>
                    <a [routerLink]="['/customers', u.customerId]">{{ u.customerName }}</a>
                    <span class="list-meta">{{ u.fieldName }}</span>
                    <span class="list-date" [class.soon]="daysUntil(u.date) <= 90">
                      {{ u.date | date:'dd.MM.yyyy' }} · {{ 'dashboard.exec.inDays' | transloco:{ days: daysUntil(u.date) } }}
                    </span>
                  </li>
                }
              </ul>
            }
          </div>

          <!-- Devreye alınan müşteriler -->
          <div class="card">
            <h3>{{ 'dashboard.exec.onboarding' | transloco }}</h3>
            @if (!d.onboarding.length) {
              <p class="muted">{{ 'dashboard.exec.noOnboarding' | transloco }}</p>
            } @else {
              <ul class="list">
                @for (o of d.onboarding; track o.id) {
                  <li>
                    <a [routerLink]="['/customers', o.id]">{{ o.name }}</a>
                    <span class="list-meta">
                      @if (o.onboardingStartedAt) { {{ 'dashboard.exec.dayCount' | transloco:{ days: daysSince(o.onboardingStartedAt) } }} }
                    </span>
                    <span class="checks">
                      <span [class.ok]="!!o.testEnvReadyAt"><i class="pi" [class]="o.testEnvReadyAt ? 'pi-check-circle' : 'pi-circle'"></i> {{ 'dashboard.exec.testEnv' | transloco }}</span>
                      <span [class.ok]="!!o.prodEnvReadyAt"><i class="pi" [class]="o.prodEnvReadyAt ? 'pi-check-circle' : 'pi-circle'"></i> {{ 'dashboard.exec.prodEnv' | transloco }}</span>
                    </span>
                  </li>
                }
              </ul>
            }
          </div>

          <!-- Son canlıya geçişler -->
          <div class="card">
            <h3>{{ 'dashboard.exec.goLives' | transloco }}</h3>
            @if (!d.recentGoLives.length) {
              <p class="muted">{{ 'dashboard.exec.noGoLives' | transloco }}</p>
            } @else {
              <ul class="list">
                @for (g of d.recentGoLives; track g.customerId + g.productName) {
                  <li>
                    <a [routerLink]="['/customers', g.customerId]">{{ g.customerName }}</a>
                    <span class="list-meta">{{ g.productName }}</span>
                    <span class="list-date">{{ g.goLiveAt | date:'dd.MM.yyyy' }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>

        <!-- Ürün yaygınlığı: tek seri, tek renk, değer etiketi çubuğun yanında -->
        <div class="card">
          <h3>{{ 'dashboard.exec.adoption' | transloco }}</h3>
          <div class="bars" role="table" [attr.aria-label]="'dashboard.exec.adoption' | transloco">
            @for (p of d.productAdoption; track p.productId) {
              <a class="bar-row" role="row" [routerLink]="['/products', p.productId]"
                 [title]="p.name + ': ' + p.customerCount + ' / ' + p.liveCount">
                <span class="bar-label" role="rowheader">{{ p.name }}</span>
                <span class="bar-track" role="cell">
                  <span class="bar-fill" [style.width.%]="barWidth(p.customerCount)"></span>
                </span>
                <span class="bar-value" role="cell">
                  {{ 'dashboard.exec.customersLive' | transloco:{ total: p.customerCount, live: p.liveCount } }}
                </span>
              </a>
            }
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    .exec { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .exec-title { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); margin: 0; }
    .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem 1.25rem; min-width: 0;
      h3 { font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 0.75rem; } }
    .pipeline { grid-column: span 2; }
    @media (max-width: 720px) { .pipeline { grid-column: auto; } }
    .pipeline-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; }
    .step { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.625rem; border-radius: 0.5rem; background: var(--surface-2);
      text-decoration: none; border: 1px solid transparent; &:hover { border-color: var(--border-strong); } }
    .step-value { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); line-height: 1; }
    .step-label { font-size: 0.75rem; color: var(--text-muted); }
    .step--muted .step-value { color: var(--text-muted); }
    .hero-value { font-size: 2rem; font-weight: 700; color: var(--text-strong); line-height: 1.1; font-variant-numeric: tabular-nums; }
    .hero-sub { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.375rem; }
    .muted { font-size: 0.875rem; color: var(--text-subtle); margin: 0; }
    .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.625rem;
      li { display: flex; flex-direction: column; gap: 0.125rem; padding-bottom: 0.625rem; border-bottom: 1px solid var(--border-light); }
      li:last-child { border-bottom: none; padding-bottom: 0; }
      a { font-size: 0.875rem; font-weight: 500; color: var(--text-strong); text-decoration: none; &:hover { color: var(--primary); } } }
    .list-meta { font-size: 0.75rem; color: var(--text-muted); }
    .list-date { font-size: 0.8125rem; color: var(--text); font-variant-numeric: tabular-nums; }
    .list-date.soon { color: var(--warning-strong, var(--danger)); font-weight: 600; }
    .checks { display: flex; gap: 0.75rem; font-size: 0.75rem; color: var(--text-subtle);
      .ok { color: var(--success-strong, var(--text)); } }
    .bars { display: flex; flex-direction: column; gap: 0.375rem; }
    .bar-row { display: grid; grid-template-columns: minmax(120px, 200px) 1fr auto; align-items: center; gap: 0.75rem;
      padding: 0.25rem 0.375rem; border-radius: 0.375rem; text-decoration: none; &:hover { background: var(--surface-2); } }
    .bar-label { font-size: 0.875rem; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { height: 10px; background: var(--surface-3); border-radius: 4px; overflow: hidden; }
    .bar-fill { display: block; height: 100%; background: var(--primary); border-radius: 0 4px 4px 0; min-width: 2px; }
    .bar-value { font-size: 0.8125rem; color: var(--text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
  `]
})
export class ExecutiveSummaryComponent implements OnInit {
  private http = inject(HttpClient);
  private transloco = inject(TranslocoService);

  data = signal<ExecutiveSummary | null>(null);

  pipeline = computed(() => {
    const counts = new Map((this.data()?.customerPipeline ?? []).map(p => [p.status, p.count]));
    return PIPELINE_ORDER.map(status => ({ status, count: counts.get(status) ?? 0 }));
  });

  private maxCustomers = computed(() => Math.max(1, ...(this.data()?.productAdoption ?? []).map(p => p.customerCount)));

  ngOnInit() {
    this.http.get<ExecutiveSummary>(`${environment.apiUrl}/dashboard/executive`).subscribe({
      next: d => this.data.set(d),
      error: () => this.data.set(null)
    });
  }

  formatNumber(n: number): string {
    return n.toLocaleString(this.transloco.getActiveLang() === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: 0 });
  }

  barWidth(n: number): number { return (n / this.maxCustomers()) * 100; }

  private dayDiff(iso: string): number {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    const target = new Date(y, m - 1, d).getTime();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((target - today.getTime()) / 86_400_000);
  }
  daysUntil(iso: string): number { return this.dayDiff(iso); }
  daysSince(iso: string): number { return -this.dayDiff(iso); }
}
