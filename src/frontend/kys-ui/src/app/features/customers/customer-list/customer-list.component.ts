import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, DatePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';

interface Customer {
  id: string;
  name: string;
  code: string;
  status: string;
  industry: string;
  goLiveDate: string | null;
  productCount: number;
  isArchived: boolean;
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [RouterLink, FormsModule, NgClass, DatePipe],
  template: `
    <div class="page-content">
      <div class="flex-between" style="margin-bottom:1.5rem">
        <h1 style="font-size:1.5rem;font-weight:700;color:#111827">Müşteriler</h1>
        <button class="btn-primary-sm">
          <i class="pi pi-plus"></i> Yeni Müşteri
        </button>
      </div>

      <div class="filter-bar">
        <input
          type="text" placeholder="Müşteri ara..."
          [(ngModel)]="search" (ngModelChange)="onSearch()"
          class="search-input" />
        <select [(ngModel)]="statusFilter" (ngModelChange)="onSearch()" class="select-input">
          <option value="">Tüm Durumlar</option>
          <option value="Active">Aktif</option>
          <option value="Onboarding">Onboarding</option>
          <option value="Pilot">Pilot</option>
          <option value="Suspended">Askıya Alındı</option>
          <option value="Churned">Churn</option>
        </select>
        <label class="checkbox-label">
          <input type="checkbox" [(ngModel)]="includeArchived" (ngModelChange)="onSearch()" />
          Arşivlenenleri göster
        </label>
      </div>

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Müşteri</th>
              <th>Durum</th>
              <th>Sektör</th>
              <th>Go-Live</th>
              <th>Ürünler</th>
            </tr>
          </thead>
          <tbody>
            @for (c of customers; track c.id) {
              <tr [routerLink]="['/customers', c.id]" class="table-row">
                <td>
                  <div style="font-weight:500;color:#111827">{{ c.name }}</div>
                  <div style="font-size:0.75rem;color:#6B7280">{{ c.code }}</div>
                </td>
                <td>
                  <span [ngClass]="'badge badge--' + c.status.toLowerCase()">{{ statusLabel(c.status) }}</span>
                </td>
                <td>{{ c.industry || '—' }}</td>
                <td>{{ c.goLiveDate ? (c.goLiveDate | date:'dd.MM.yyyy') : '—' }}</td>
                <td>{{ c.productCount }}</td>
              </tr>
            }
            @empty {
              <tr><td colspan="5" style="text-align:center;color:#9CA3AF;padding:2rem">Müşteri bulunamadı.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .search-input, .select-input {
      border: 1px solid #D1D5DB;
      border-radius: 0.5rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      outline: none;
      &:focus { border-color: #3B82F6; }
    }
    .search-input { width: 280px; }
    .checkbox-label { font-size: 0.875rem; color: #374151; display: flex; align-items: center; gap: 0.375rem; cursor: pointer; }
    .table-card {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 0.75rem;
      overflow: hidden;
      table { width: 100%; border-collapse: collapse; }
      th {
        background: #F9FAFB;
        padding: 0.75rem 1rem;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 600;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #E5E7EB;
      }
      td { padding: 0.875rem 1rem; border-bottom: 1px solid #F3F4F6; font-size: 0.875rem; }
    }
    .table-row { cursor: pointer; &:hover td { background: #F9FAFB; } }
    .btn-primary-sm {
      background: #3B82F6; color: white; border: none;
      border-radius: 0.5rem; padding: 0.5rem 1rem;
      font-size: 0.875rem; font-weight: 500; cursor: pointer;
      display: flex; align-items: center; gap: 0.375rem;
      &:hover { background: #2563EB; }
    }
  `]
})
export class CustomerListComponent implements OnInit {
  private http = inject(HttpClient);

  customers: Customer[] = [];
  search = '';
  statusFilter = '';
  includeArchived = false;
  totalCount = 0;

  ngOnInit(): void {
    this.load();
  }

  onSearch(): void {
    this.load();
  }

  private load(): void {
    const params = new URLSearchParams();
    if (this.search) params.set('search', this.search);
    if (this.statusFilter) params.set('status', this.statusFilter);
    params.set('includeArchived', String(this.includeArchived));
    params.set('page', '1');
    params.set('pageSize', '50');

    this.http.get<{ items: Customer[]; totalCount: number }>(
      `${environment.apiUrl}/customers?${params}`
    ).subscribe(r => {
      this.customers = r.items;
      this.totalCount = r.totalCount;
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      Active: 'Aktif', Onboarding: 'Onboarding', Pilot: 'Pilot',
      Suspended: 'Askıda', Churned: 'Churn', Archived: 'Arşiv'
    };
    return map[status] ?? status;
  }
}
