import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface TeamSummary {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isActive: boolean;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface CreateTeamRequest {
  name: string;
  description: string;
}

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-content">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Ekipler</h1>
          <p class="page-subtitle">{{ totalCount() }} ekip</p>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">
          <i class="pi pi-plus"></i> Yeni Ekip
        </button>
      </div>

      <!-- Search -->
      <div class="toolbar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input
            type="text"
            placeholder="Ekip ara..."
            [(ngModel)]="searchInput"
            (ngModelChange)="onSearch($event)"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        @if (loading()) {
          <div class="loading-row">Yükleniyor...</div>
        } @else if (!teams().length) {
          <div class="loading-row">Ekip bulunamadı.</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Ekip Adı</th>
                <th>Açıklama</th>
                <th>Üye Sayısı</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              @for (team of teams(); track team.id) {
                <tr class="clickable-row" [routerLink]="['/teams', team.id]">
                  <td class="name-cell">
                    <div class="team-avatar">{{ team.name[0] }}</div>
                    <span class="team-name">{{ team.name }}</span>
                  </td>
                  <td class="desc-cell">{{ team.description ?? '—' }}</td>
                  <td>
                    <span class="member-count">
                      <i class="pi pi-users"></i> {{ team.memberCount }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class]="team.isActive ? 'badge--active' : 'badge--archived'">
                      {{ team.isActive ? 'Aktif' : 'Pasif' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (totalCount() > pageSize) {
            <div class="pagination">
              <button class="page-btn" [disabled]="page() === 1" (click)="goToPage(page() - 1)">
                <i class="pi pi-chevron-left"></i>
              </button>
              <span class="page-info">{{ page() }} / {{ totalPages() }}</span>
              <button class="page-btn" [disabled]="page() === totalPages()" (click)="goToPage(page() + 1)">
                <i class="pi pi-chevron-right"></i>
              </button>
            </div>
          }
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Yeni Ekip</h2>
            <button class="close-btn" (click)="closeModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (createError()) {
              <div class="alert-error">{{ createError() }}</div>
            }
            <div class="form-group">
              <label>Ekip Adı <span class="required">*</span></label>
              <input type="text" [(ngModel)]="form.name" placeholder="Ekip adı" />
              @if (submitted() && !form.name.trim()) {
                <span class="field-error">Ekip adı zorunludur</span>
              }
            </div>
            <div class="form-group">
              <label>Açıklama</label>
              <textarea [(ngModel)]="form.description" placeholder="Kısa açıklama" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">İptal</button>
            <button class="btn btn-primary" [disabled]="saving()" (click)="createTeam()">
              {{ saving() ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #111827; }
    .page-subtitle { font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem; }

    .toolbar { margin-bottom: 1rem; }
    .search-box {
      position: relative; max-width: 360px;
      i { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #9CA3AF; font-size: 0.875rem; }
      input { width: 100%; padding: 0.5rem 0.75rem 0.5rem 2.25rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem; box-sizing: border-box; }
    }

    .table-wrapper { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .loading-row { padding: 3rem; text-align: center; color: #9CA3AF; font-size: 0.875rem; }
    .data-table {
      width: 100%; border-collapse: collapse;
      th { background: #F9FAFB; padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; }
      td { padding: 0.75rem; font-size: 0.875rem; color: #374151; border-bottom: 1px solid #F3F4F6; }
    }
    .clickable-row { cursor: pointer; &:hover td { background: #F9FAFB; } &:last-child td { border-bottom: none; } }
    .name-cell { display: flex; align-items: center; gap: 0.625rem; }
    .team-avatar { width: 2rem; height: 2rem; border-radius: 0.375rem; background: #E0E7FF; color: #4F46E5; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; flex-shrink: 0; }
    .team-name { font-weight: 500; color: #111827; }
    .desc-cell { color: #6B7280; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .member-count { display: flex; align-items: center; gap: 0.375rem; color: #6B7280; i { font-size: 0.75rem; } }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 0.875rem; border-top: 1px solid #F3F4F6; }
    .page-btn { background: none; border: 1px solid #D1D5DB; border-radius: 0.375rem; padding: 0.375rem 0.625rem; cursor: pointer; color: #374151; &:disabled { opacity: 0.4; cursor: not-allowed; } &:not(:disabled):hover { background: #F3F4F6; } }
    .page-info { font-size: 0.875rem; color: #6B7280; }

    .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--active { background: #D1FAE5; color: #065F46; }
    .badge--archived { background: #F3F4F6; color: #6B7280; }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: opacity 0.15s; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: #3B82F6; color: white; &:not(:disabled):hover { background: #2563EB; } }
    .btn-secondary { background: white; color: #374151; border: 1px solid #D1D5DB; &:hover { background: #F3F4F6; } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 0.75rem; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E5E7EB; h2 { font-size: 1.125rem; font-weight: 700; color: #111827; } }
    .close-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 0.25rem; font-size: 1rem; &:hover { color: #374151; } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: #374151; } input, textarea { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; resize: vertical; &:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); } } }
    .required { color: #EF4444; }
    .field-error { font-size: 0.75rem; color: #EF4444; }
    .alert-error { padding: 0.75rem 1rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 0.5rem; color: #991B1B; font-size: 0.875rem; }
  `]
})
export class TeamListComponent implements OnInit {
  private http = inject(HttpClient);

  teams = signal<TeamSummary[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  searchInput = '';
  private searchSubject = new Subject<string>();

  showModal = signal(false);
  saving = signal(false);
  submitted = signal(false);
  createError = signal('');
  form: CreateTeamRequest = { name: '', description: '' };

  ngOnInit() {
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
    this.load();
  }

  onSearch(val: string) { this.searchSubject.next(val); }

  load() {
    this.loading.set(true);
    const params = new URLSearchParams({
      page: String(this.page()),
      pageSize: String(this.pageSize),
      ...(this.searchInput.trim() ? { search: this.searchInput.trim() } : {})
    });
    this.http.get<PagedResult<TeamSummary>>(`${environment.apiUrl}/teams?${params}`).subscribe({
      next: r => { this.teams.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  goToPage(p: number) { this.page.set(p); this.load(); }

  closeModal() {
    this.showModal.set(false);
    this.submitted.set(false);
    this.createError.set('');
    this.form = { name: '', description: '' };
  }

  createTeam() {
    this.submitted.set(true);
    if (!this.form.name.trim()) return;
    this.saving.set(true);
    this.createError.set('');
    this.http.post<TeamSummary>(`${environment.apiUrl}/teams`, this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.page.set(1);
        this.load();
      },
      error: err => {
        this.saving.set(false);
        this.createError.set(err.error?.detail ?? 'Ekip oluşturulamadı');
      }
    });
  }
}
