import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PermissionService } from '../../../core/services/permission.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

interface TeamSummary {
  id: string;
  name: string;
  code: string | null;
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
  code: string;
  description: string;
  teamType: string;
}

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslocoModule],
  template: `
    <div class="page-content">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'teams.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'teams.count' | transloco:{ count: totalCount() } }}</p>
        </div>
        @if (perms.has('team:create')) {
          <button class="btn btn-primary" (click)="showModal.set(true)">
            <i class="pi pi-plus"></i> {{ 'teams.new' | transloco }}
          </button>
        }
      </div>

      <!-- Search -->
      <div class="toolbar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input
            type="text"
            [placeholder]="'teams.searchPlaceholder' | transloco"
            [(ngModel)]="searchInput"
            (ngModelChange)="onSearch($event)"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        @if (loading()) {
          <div class="loading-row">{{ 'common.loading' | transloco }}</div>
        } @else if (!teams().length) {
          <div class="loading-row">{{ 'teams.notFound' | transloco }}</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'teams.colName' | transloco }}</th>
                <th>{{ 'teams.colDescription' | transloco }}</th>
                <th>{{ 'teams.colMemberCount' | transloco }}</th>
                <th>{{ 'teams.colStatus' | transloco }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (team of teams(); track team.id) {
                <tr class="clickable-row" [routerLink]="['/teams', team.id]">
                  <td class="name-cell">
                    <div class="team-avatar">{{ team.name[0] }}</div>
                    <span class="team-name">{{ team.name }}</span>
                    @if (team.code) {
                      <span class="code-tag">{{ team.code }}</span>
                    }
                  </td>
                  <td class="desc-cell">{{ team.description ?? '—' }}</td>
                  <td>
                    <span class="member-count">
                      <i class="pi pi-users"></i> {{ team.memberCount }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class]="team.isActive ? 'badge--active' : 'badge--archived'">
                      {{ (team.isActive ? 'status.customer.Active' : 'status.customer.Inactive') | transloco }}
                    </span>
                  </td>
                  <td class="actions-cell" (click)="$event.stopPropagation()">
                    <div class="kebab-wrap">
                      <button class="kebab-btn" (click)="toggleMenu(team.id)"><i class="pi pi-ellipsis-v"></i></button>
                      @if (openMenuId() === team.id) {
                        <div class="kebab-menu">
                          <button class="km-item km-danger" (click)="confirmDelete(team)">
                            <i class="pi pi-trash"></i> {{ 'common.delete' | transloco }}
                          </button>
                        </div>
                      }
                    </div>
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

    @if (deleteTarget()) {
      <div class="modal-backdrop" (click)="cancelDelete()">
        <div class="modal modal--sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ 'teams.deleteTitle' | transloco }}</h2>
            <button class="close-btn" (click)="cancelDelete()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <p style="margin:0;color:var(--text)" [innerHTML]="'teams.deleteConfirm' | transloco:{ name: deleteTarget()!.name }"></p>
            <p style="margin:0.5rem 0 0;font-size:0.8125rem;color:var(--text-muted)">{{ 'common.irreversible' | transloco }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cancelDelete()">{{ 'common.cancel' | transloco }}</button>
            <button class="btn btn-danger" [disabled]="deleting()" (click)="deleteTeam()">
              {{ (deleting() ? 'common.deleting' : 'common.delete') | transloco }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ 'teams.new' | transloco }}</h2>
            <button class="close-btn" (click)="closeModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (createError()) {
              <div class="alert-error">{{ createError() }}</div>
            }
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'teams.name' | transloco }} <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.name" [placeholder]="'teams.namePlaceholder' | transloco" [class.input-error]="submitted() && !form.name.trim()" />
                @if (submitted() && !form.name.trim()) {
                  <span class="field-error">{{ 'teams.nameRequired' | transloco }}</span>
                }
              </div>
              <div class="form-group">
                <label>{{ 'teams.code' | transloco }}</label>
                <input type="text" [(ngModel)]="form.code" [placeholder]="'teams.codePlaceholder' | transloco" maxlength="20" (input)="form.code = form.code.toUpperCase()" />
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'teams.teamType' | transloco }} <span class="required">*</span></label>
              <select [(ngModel)]="form.teamType" [class.input-error]="submitted() && !form.teamType">
                <option value="Project">{{ 'type.team.Project' | transloco }}</option>
                <option value="Domain">{{ 'type.team.Domain' | transloco }}</option>
                <option value="Platform">{{ 'type.team.Platform' | transloco }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ 'teams.description' | transloco }}</label>
              <textarea [(ngModel)]="form.description" [placeholder]="'teams.descriptionPlaceholder' | transloco" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">{{ 'common.cancel' | transloco }}</button>
            <button class="btn btn-primary" [disabled]="saving()" (click)="createTeam()">
              {{ (saving() ? 'common.saving' : 'common.save') | transloco }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .toolbar { margin-bottom: 1rem; }
    .search-box {
      position: relative; max-width: 360px;
      i { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-subtle); font-size: 0.875rem; }
      input { width: 100%; padding: 0.5rem 0.75rem 0.5rem 2.25rem; border: 1px solid var(--border-strong); border-radius: 0.5rem; font-size: 0.875rem; box-sizing: border-box; }
    }

    .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .loading-row { padding: 3rem; text-align: center; color: var(--text-subtle); font-size: 0.875rem; }
    .data-table {
      width: 100%; border-collapse: collapse;
      th { background: var(--surface-2); padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); }
      td { padding: 0.75rem; font-size: 0.875rem; color: var(--text); border-bottom: 1px solid var(--surface-3); }
    }
    .clickable-row { cursor: pointer; &:hover td { background: var(--surface-2); } &:last-child td { border-bottom: none; } }
    .name-cell { display: flex; align-items: center; gap: 0.625rem; }
    .team-avatar { width: 2rem; height: 2rem; border-radius: 0.375rem; background: var(--indigo-soft-bg); color: var(--indigo-strong); display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; flex-shrink: 0; }
    .team-name { font-weight: 500; color: var(--text-strong); }
    .code-tag { display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; background: var(--indigo-soft-bg); color: var(--indigo-strong); border-radius: 0.25rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; }
    .desc-cell { color: var(--text-muted); max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .member-count { display: flex; align-items: center; gap: 0.375rem; color: var(--text-muted); i { font-size: 0.75rem; } }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 0.875rem; border-top: 1px solid var(--surface-3); }
    .page-btn { background: none; border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.375rem 0.625rem; cursor: pointer; color: var(--text); &:disabled { opacity: 0.4; cursor: not-allowed; } &:not(:disabled):hover { background: var(--surface-3); } }
    .page-info { font-size: 0.875rem; color: var(--text-muted); }

    .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--active { background: var(--success-soft-bg); color: var(--success-soft-text); }
    .badge--archived { background: var(--surface-3); color: var(--text-muted); }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: opacity 0.15s; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary); color: white; &:not(:disabled):hover { background: var(--primary-hover); } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--surface-3); } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; font-size: 1rem; &:hover { color: var(--text); } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: var(--text); } input, textarea, select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.5rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; resize: vertical; background: var(--surface); &:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); } } }
    .input-error { border-color: var(--danger) !important; }
    .required { color: var(--danger); }
    .field-error { font-size: 0.75rem; color: var(--danger); }
    .alert-error { padding: 0.75rem 1rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.5rem; color: var(--danger-soft-text); font-size: 0.875rem; }

    .actions-cell { width: 2.5rem; text-align: center; }
    .kebab-wrap { position: relative; display: inline-block; }
    .kebab-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 1rem; line-height: 1; &:hover { background: var(--surface-3); color: var(--text); } }
    .kebab-menu { position: absolute; right: 0; top: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 0.5rem; box-shadow: 0 4px 16px rgba(0,0,0,0.12); min-width: 120px; z-index: 50; padding: 0.25rem; }
    .km-item { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem 0.75rem; border: none; background: none; cursor: pointer; font-size: 0.875rem; border-radius: 0.375rem; &:hover { background: var(--surface-3); } }
    .km-danger { color: var(--danger-strong); &:hover { background: var(--danger-faint-bg) !important; } }
    .btn-danger { background: var(--danger-strong); color: white; &:not(:disabled):hover { background: var(--danger-strong); } }
    .modal--sm { max-width: 400px; }
  `]
})
export class TeamListComponent implements OnInit {
  private http = inject(HttpClient);
  private transloco = inject(TranslocoService);
  protected perms = inject(PermissionService);

  teams = signal<TeamSummary[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  searchInput = '';
  private searchSubject = new Subject<string>();

  openMenuId = signal<string | null>(null);
  deleteTarget = signal<TeamSummary | null>(null);
  deleting = signal(false);

  toggleMenu(id: string): void {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  confirmDelete(team: TeamSummary): void {
    this.openMenuId.set(null);
    this.deleteTarget.set(team);
  }

  cancelDelete(): void { this.deleteTarget.set(null); }

  deleteTeam(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.http.delete(`${environment.apiUrl}/teams/${target.id}`).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.page.set(1);
        this.load();
      },
      error: () => this.deleting.set(false)
    });
  }

  showModal = signal(false);
  saving = signal(false);
  submitted = signal(false);
  createError = signal('');
  form: CreateTeamRequest = { name: '', code: '', description: '', teamType: 'Project' };

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
    this.form = { name: '', code: '', description: '', teamType: 'Project' };
  }

  createTeam() {
    this.submitted.set(true);
    if (!this.form.name.trim() || !this.form.teamType) return;
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
        this.createError.set(err.error?.detail ?? this.transloco.translate('teams.createError'));
      }
    });
  }
}
