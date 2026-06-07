import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
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
        <button class="btn-primary-sm" (click)="showModal.set(true)">
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

    <!-- Yeni Müşteri Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Yeni Müşteri</h2>
            <button class="modal-close" (click)="closeModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Müşteri Adı <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.name" placeholder="ör. Acme Yazılım A.Ş." [class.input-error]="submitted() && !form.name.trim()" />
                @if (submitted() && !form.name.trim()) {
                  <span class="error-msg">Ad zorunludur</span>
                }
              </div>
              <div class="form-group">
                <label>Kod <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.code" placeholder="ör. ACME" (input)="form.code = form.code.toUpperCase()" [class.input-error]="submitted() && !form.code.trim()" />
                @if (submitted() && !form.code.trim()) {
                  <span class="error-msg">Kod zorunludur</span>
                }
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Kısa Ad</label>
                <input type="text" [(ngModel)]="form.shortName" placeholder="ör. Acme" />
              </div>
              <div class="form-group">
                <label>Sektör</label>
                <input type="text" [(ngModel)]="form.sector" placeholder="ör. Fintech, Sağlık..." />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Ülke</label>
                <input type="text" [(ngModel)]="form.country" placeholder="ör. Türkiye" />
              </div>
              <div class="form-group">
                <label>Şehir</label>
                <input type="text" [(ngModel)]="form.city" placeholder="ör. İstanbul" />
              </div>
            </div>
            <div class="form-group">
              <label>Açıklama</label>
              <textarea [(ngModel)]="form.description" rows="2" placeholder="Kısa açıklama..."></textarea>
            </div>
            <div class="section-title">Birincil İletişim (isteğe bağlı)</div>
            <div class="form-row">
              <div class="form-group">
                <label>Ad Soyad</label>
                <input type="text" [(ngModel)]="form.primaryContactName" />
              </div>
              <div class="form-group">
                <label>E-posta</label>
                <input type="email" [(ngModel)]="form.primaryContactEmail" />
              </div>
            </div>
            @if (saveError()) {
              <div class="alert-error">{{ saveError() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">İptal</button>
            <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
              {{ saving() ? 'Kaydediliyor...' : 'Oluştur' }}
            </button>
          </div>
        </div>
      </div>
    }
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
    .flex-between { display: flex; justify-content: space-between; align-items: center; }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal {
      background: white; border-radius: 0.75rem; width: 100%; max-width: 560px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column;
      max-height: 90vh;
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #E5E7EB;
      h2 { font-size: 1.125rem; font-weight: 700; color: #111827; }
    }
    .modal-close { background: none; border: none; cursor: pointer; color: #6B7280; font-size: 1.25rem; padding: 0.25rem; border-radius: 0.375rem; &:hover { background: #F3F4F6; } }
    .modal-body { padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 0.75rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group {
      display: flex; flex-direction: column; gap: 0.375rem;
      label { font-size: 0.8125rem; font-weight: 600; color: #374151; }
      input, textarea, select {
        padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem;
        font-size: 0.875rem; color: #111827;
        &:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      }
      textarea { resize: vertical; font-family: inherit; }
    }
    .input-error { border-color: #EF4444 !important; }
    .error-msg { font-size: 0.75rem; color: #EF4444; }
    .required { color: #EF4444; }
    .section-title { font-size: 0.8125rem; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid #F3F4F6; padding-top: 0.75rem; }
    .alert-error { padding: 0.75rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 0.375rem; color: #991B1B; font-size: 0.8125rem; }
    .btn { padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: #3B82F6; color: white; &:not(:disabled):hover { background: #2563EB; } }
    .btn-secondary { background: white; color: #374151; border: 1px solid #D1D5DB; &:hover { background: #F3F4F6; } }
  `]
})
export class CustomerListComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  customers: Customer[] = [];
  search = '';
  statusFilter = '';
  includeArchived = false;
  totalCount = 0;

  showModal = signal(false);
  submitted = signal(false);
  saving = signal(false);
  saveError = signal('');

  form = {
    name: '',
    code: '',
    shortName: '',
    sector: '',
    country: '',
    city: '',
    description: '',
    primaryContactName: '',
    primaryContactEmail: '',
  };

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

  closeModal(): void {
    this.showModal.set(false);
    this.submitted.set(false);
    this.saveError.set('');
    this.form = {
      name: '', code: '', shortName: '', sector: '',
      country: '', city: '', description: '',
      primaryContactName: '', primaryContactEmail: '',
    };
  }

  save(): void {
    this.submitted.set(true);
    if (!this.form.name.trim() || !this.form.code.trim()) return;

    this.saving.set(true);
    this.saveError.set('');

    const body = {
      name: this.form.name.trim(),
      code: this.form.code.trim(),
      shortName: this.form.shortName.trim() || null,
      sector: this.form.sector.trim() || null,
      country: this.form.country.trim() || null,
      city: this.form.city.trim() || null,
      description: this.form.description.trim() || null,
      primaryContactName: this.form.primaryContactName.trim() || null,
      primaryContactEmail: this.form.primaryContactEmail.trim() || null,
      primaryContactPhone: null,
      customFields: null,
    };

    this.http.post<{ id: string }>(`${environment.apiUrl}/customers`, body).subscribe({
      next: res => {
        this.saving.set(false);
        this.closeModal();
        this.router.navigate(['/customers', res.id]);
      },
      error: err => {
        this.saving.set(false);
        this.saveError.set(err.error?.detail ?? 'Müşteri oluşturulamadı');
      }
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
