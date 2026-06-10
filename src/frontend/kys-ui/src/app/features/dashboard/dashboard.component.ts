import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { WorkspaceWidgetComponent } from './workspace-widget.component';

interface DashboardStats {
  activeCustomerCount: number;
  onboardingCustomerCount: number;
  totalProductCount: number;
  activeProductCount: number;
  totalTeamCount: number;
  totalPersonCount: number;
  activePersonCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [WorkspaceWidgetComponent],
  template: `
    <div class="page-content">
      <div class="page-header">
        <h1>Dashboard</h1>
      </div>

      @if (stats) {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--blue">
              <i class="pi pi-building"></i>
            </div>
            <div>
              <div class="stat-card__value">{{ stats.activeCustomerCount }}</div>
              <div class="stat-card__label">Aktif Müşteri</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--violet">
              <i class="pi pi-box"></i>
            </div>
            <div>
              <div class="stat-card__value">{{ stats.activeProductCount }}</div>
              <div class="stat-card__label">Aktif Ürün</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--green">
              <i class="pi pi-users"></i>
            </div>
            <div>
              <div class="stat-card__value">{{ stats.totalTeamCount }}</div>
              <div class="stat-card__label">Ekip</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--orange">
              <i class="pi pi-user"></i>
            </div>
            <div>
              <div class="stat-card__value">{{ stats.activePersonCount }}</div>
              <div class="stat-card__label">Aktif Personel</div>
            </div>
          </div>
        </div>
      }

      <app-workspace-widget />
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.5rem;
      h1 { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .stat-card__icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      flex-shrink: 0;

      &--blue   { background: var(--primary-soft-bg-2); color: var(--primary-hover); }
      &--violet { background: var(--violet-soft-bg);    color: var(--violet); }
      &--green  { background: var(--success-soft-bg);   color: var(--success-strong); }
      &--orange { background: var(--warning-soft-bg);   color: var(--warning-strong); }
    }
    .stat-card__value { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .stat-card__label { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.125rem; }
  `]
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);

  stats: DashboardStats | null = null;

  ngOnInit(): void {
    this.http.get<DashboardStats>(`${environment.apiUrl}/dashboard/stats`)
      .subscribe(s => this.stats = s);
  }
}
