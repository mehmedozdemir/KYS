import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgClass, DatePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';

interface PersonListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string | null;
  employmentStatus: number;
  isPlatformUser: boolean;
}
interface GetPeopleResult {
  items: PersonListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const STATUS_LABELS: Record<number, string> = { 0: 'Aktif', 1: 'İzinde', 2: 'İstifa', 3: 'Ayrıldı' };
const STATUS_CSS: Record<number, string> = { 0: 'badge--active', 1: 'badge--pilot', 2: 'badge--suspended', 3: 'badge--archived' };

@Component({
  selector: 'app-people-list',
  standalone: true,
  imports: [RouterLink, FormsModule, ReactiveFormsModule, NgClass, DatePipe],
  template: `
    <div class="page-content">
      <!-- Header -->
      <div class="flex-between" style="margin-bottom:1.5rem">
        <div>
          <h1 class="page-title">Kişiler</h1>
          <p class="page-subtitle">{{ result()?.totalCount ?? 0 }} kişi</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <i class="pi pi-plus"></i> Yeni Kişi
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-wrap">
          <i class="pi pi-search search-icon"></i>
          <input class="search-input" placeholder="Ad, soyad veya e-posta..." [(ngModel)]="search"
            (ngModelChange)="onSearchChange()" />
        </div>
        <select class="filter-select" [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">Tüm durumlar</option>
          <option value="0">Aktif</option>
          <option value="1">İzinde</option>
          <option value="2">İstifa</option>
          <option value="3">Ayrıldı</option>
        </select>
      </div>

      <!-- Table -->
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Kişi</th>
              <th>Unvan</th>
              <th>Durum</th>
              <th>Platform</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr><td colspan="5" class="table-empty">Yükleniyor...</td></tr>
            } @else if (!result()?.items?.length) {
              <tr><td colspan="5" class="table-empty">Kayıt bulunamadı.</td></tr>
            } @else {
              @for (p of result()!.items; track p.id) {
                <tr class="table-row">
                  <td>
                    <div class="person-cell">
                      <div class="avatar">{{ p.firstName[0] }}{{ p.lastName[0] }}</div>
                      <div>
                        <div class="person-name">{{ p.firstName }} {{ p.lastName }}</div>
                        <div class="person-email">{{ p.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="text-muted">{{ p.title ?? '—' }}</td>
                  <td>
                    <span class="badge" [ngClass]="statusCss(p.employmentStatus)">
                      {{ statusLabel(p.employmentStatus) }}
                    </span>
                  </td>
                  <td>
                    @if (p.isPlatformUser) {
                      <span class="badge badge--active">Evet</span>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td class="action-cell">
                    <a [routerLink]="['/people', p.id]" class="btn-link">Detay →</a>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>

        <!-- Pagination -->
        @if ((result()?.totalCount ?? 0) > pageSize) {
          <div class="pagination">
            <button class="page-btn" [disabled]="page === 1" (click)="goPage(page - 1)">‹</button>
            <span class="page-info">{{ page }} / {{ totalPages() }}</span>
            <button class="page-btn" [disabled]="page === totalPages()" (click)="goPage(page + 1)">›</button>
          </div>
        }
      </div>
    </div>

    <!-- Create Person Modal -->
    @if (showCreate()) {
      <div class="modal-overlay" (click)="closeCreate()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Yeni Kişi</h2>
            <button class="modal-close" (click)="closeCreate()"><i class="pi pi-times"></i></button>
          </div>
          <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="modal-body">
            <div class="form-row">
              <div class="form-group" [class.has-error]="isInvalid('firstName')">
                <label>Ad *</label>
                <input formControlName="firstName" placeholder="Ad" />
                @if (isInvalid('firstName')) { <span class="form-error">Zorunlu alan.</span> }
              </div>
              <div class="form-group" [class.has-error]="isInvalid('lastName')">
                <label>Soyad *</label>
                <input formControlName="lastName" placeholder="Soyad" />
                @if (isInvalid('lastName')) { <span class="form-error">Zorunlu alan.</span> }
              </div>
            </div>
            <div class="form-group" [class.has-error]="isInvalid('email')">
              <label>E-posta *</label>
              <input type="email" formControlName="email" placeholder="ad@sirket.com" />
              @if (isInvalid('email')) { <span class="form-error">Geçerli e-posta giriniz.</span> }
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Unvan</label>
                <input formControlName="title" placeholder="Yazılım Geliştirici" />
              </div>
              <div class="form-group">
                <label>Telefon</label>
                <input formControlName="phone" placeholder="+90 5xx xxx xx xx" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>İşe Başlama Tarihi</label>
                <input type="date" formControlName="hireDate" />
              </div>
              <div class="form-group">
                <label>Durum</label>
                <select formControlName="employmentStatus">
                  <option value="0">Aktif</option>
                  <option value="1">İzinde</option>
                </select>
              </div>
            </div>

            <label class="toggle-row">
              <input type="checkbox" formControlName="isPlatformUser" />
              <span>Platform erişimi ver</span>
            </label>

            @if (createForm.get('isPlatformUser')?.value) {
              <div class="form-group" [class.has-error]="isInvalid('username')">
                <label>Kullanıcı Adı *</label>
                <input type="text" formControlName="username" placeholder="ör. ahmet.yilmaz" />
                @if (isInvalid('username')) {
                  <span class="form-error">Kullanıcı adı zorunludur.</span>
                }
              </div>
              <div class="form-group" [class.has-error]="isInvalid('password')">
                <label>Şifre *</label>
                <input type="password" formControlName="password"
                  placeholder="En az 8 karakter, büyük harf ve rakam" />
                @if (isInvalid('password')) {
                  <span class="form-error">En az 8 karakter, bir büyük harf ve rakam içermeli.</span>
                }
              </div>
            }

            @if (createError()) {
              <div class="alert-error">{{ createError() }}</div>
            }

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="closeCreate()">İptal</button>
              <button type="submit" class="btn-primary" [disabled]="saving()">
                {{ saving() ? 'Kaydediliyor...' : 'Kaydet' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 700; color: #111827; }
    .page-subtitle { font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem; }

    .filters-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 220px;
    }
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9CA3AF;
      font-size: 0.875rem;
    }
    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid #D1D5DB;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      outline: none;
      &:focus { border-color: #3B82F6; }
    }
    .filter-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #D1D5DB;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
      outline: none;
      cursor: pointer;
    }

    .table-card {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
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
      td {
        padding: 0.875rem 1rem;
        font-size: 0.875rem;
        color: #374151;
        border-bottom: 1px solid #F3F4F6;
      }
    }
    .table-row:last-child td { border-bottom: none; }
    .table-row:hover td { background: #F9FAFB; }
    .table-empty { text-align: center; color: #9CA3AF; padding: 3rem 1rem !important; }

    .person-cell { display: flex; align-items: center; gap: 0.75rem; }
    .avatar {
      width: 2rem; height: 2rem;
      background: #EEF2FF; color: #4F46E5;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
      flex-shrink: 0;
    }
    .person-name { font-weight: 500; color: #111827; }
    .person-email { font-size: 0.75rem; color: #9CA3AF; margin-top: 1px; }
    .text-muted { color: #9CA3AF; }
    .action-cell { text-align: right; }
    .btn-link {
      color: #3B82F6; font-size: 0.8125rem; font-weight: 500;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.375rem;
      background: #3B82F6; color: white; border: none;
      border-radius: 0.5rem; padding: 0.5rem 1rem;
      font-size: 0.875rem; font-weight: 600; cursor: pointer;
      &:hover:not(:disabled) { background: #2563EB; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .btn-secondary {
      background: white; color: #374151;
      border: 1px solid #D1D5DB; border-radius: 0.5rem;
      padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; cursor: pointer;
      &:hover { background: #F9FAFB; }
    }

    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      padding: 0.75rem;
      border-top: 1px solid #F3F4F6;
    }
    .page-btn {
      width: 2rem; height: 2rem;
      border: 1px solid #D1D5DB; border-radius: 0.375rem;
      background: white; cursor: pointer; font-size: 1rem;
      &:hover:not(:disabled) { background: #F3F4F6; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
    .page-info { font-size: 0.875rem; color: #6B7280; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal {
      background: white; border-radius: 0.75rem;
      width: 100%; max-width: 540px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      max-height: 90vh; overflow-y: auto;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #E5E7EB;
      h2 { font-size: 1.125rem; font-weight: 700; color: #111827; }
    }
    .modal-close {
      background: none; border: none; cursor: pointer;
      color: #9CA3AF; font-size: 1rem;
      &:hover { color: #374151; }
    }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid #F3F4F6;
      margin-top: 0.5rem;
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-group label { font-size: 0.8125rem; font-weight: 500; color: #374151; }
    .form-group input, .form-group select {
      border: 1px solid #D1D5DB; border-radius: 0.5rem;
      padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none;
      &:focus { border-color: #3B82F6; }
    }
    .form-group.has-error input, .form-group.has-error select { border-color: #EF4444; }
    .form-error { font-size: 0.75rem; color: #EF4444; }

    .toggle-row {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.875rem; color: #374151; cursor: pointer;
      input[type="checkbox"] { width: 1rem; height: 1rem; cursor: pointer; }
    }

    .alert-error {
      background: #FEE2E2; border: 1px solid #FECACA;
      border-radius: 0.5rem; padding: 0.75rem;
      font-size: 0.875rem; color: #991B1B;
    }
  `]
})
export class PeopleListComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  result = signal<GetPeopleResult | null>(null);
  loading = signal(true);
  showCreate = signal(false);
  saving = signal(false);
  createError = signal('');

  search = '';
  statusFilter = '';
  page = 1;
  readonly pageSize = 20;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  createForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    title: [''],
    phone: [''],
    hireDate: [''],
    employmentStatus: [0],
    isPlatformUser: [false],
    username: [''],
    password: ['']
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    let params = new HttpParams().set('page', this.page).set('pageSize', this.pageSize);
    if (this.search) params = params.set('search', this.search);
    if (this.statusFilter !== '') params = params.set('status', this.statusFilter);

    this.http.get<GetPeopleResult>(`${environment.apiUrl}/people`, { params }).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearchChange() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page = 1; this.load(); }, 350);
  }

  goPage(p: number) { this.page = p; this.load(); }
  totalPages() { return Math.ceil((this.result()?.totalCount ?? 0) / this.pageSize); }

  statusLabel(s: number) { return STATUS_LABELS[s] ?? s; }
  statusCss(s: number) { return STATUS_CSS[s] ?? ''; }

  openCreate() {
    this.createForm.reset({ employmentStatus: 0, isPlatformUser: false });
    this.createError.set('');
    this.showCreate.set(true);
  }
  closeCreate() { this.showCreate.set(false); }

  isInvalid(field: string) {
    const c = this.createForm.get(field);
    return c?.invalid && c?.touched;
  }

  submitCreate() {
    this.createForm.markAllAsTouched();

    const isPlatformUser = this.createForm.get('isPlatformUser')?.value;
    if (isPlatformUser) {
      this.createForm.get('username')?.addValidators([Validators.required]);
      this.createForm.get('password')?.addValidators([
        Validators.required, Validators.minLength(8),
        Validators.pattern('(?=.*[A-Z])(?=.*[0-9]).{8,}')
      ]);
    } else {
      this.createForm.get('username')?.clearValidators();
      this.createForm.get('password')?.clearValidators();
    }
    this.createForm.get('username')?.updateValueAndValidity();
    this.createForm.get('password')?.updateValueAndValidity();

    if (this.createForm.invalid) return;

    this.saving.set(true);
    this.createError.set('');

    const v = this.createForm.value;
    const body = {
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      title: v.title || null,
      phone: v.phone || null,
      hireDate: v.hireDate || null,
      employmentStatus: Number(v.employmentStatus),
      isPlatformUser: v.isPlatformUser,
      username: v.isPlatformUser ? v.username : null,
      password: v.isPlatformUser ? v.password : null
    };

    this.http.post(`${environment.apiUrl}/people`, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeCreate();
        this.load();
      },
      error: err => {
        this.saving.set(false);
        const errors = err.error?.extensions?.errors;
        this.createError.set(errors
          ? Object.values(errors).flat().join(' ')
          : err.error?.detail ?? 'Bir hata oluştu.');
      }
    });
  }
}
