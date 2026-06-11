import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgClass, DatePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { PermissionService } from '../../../core/services/permission.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

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

const STATUS_CSS: Record<number, string> = { 0: 'badge--active', 1: 'badge--pilot', 2: 'badge--suspended', 3: 'badge--archived' };

@Component({
  selector: 'app-people-list',
  standalone: true,
  imports: [RouterLink, FormsModule, ReactiveFormsModule, NgClass, DatePipe, TranslocoModule],
  template: `
    <div class="page-content">
      <!-- Header -->
      <div class="flex-between" style="margin-bottom:1.5rem">
        <div>
          <h1 class="page-title">{{ 'people.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'people.count' | transloco:{ count: result()?.totalCount ?? 0 } }}</p>
        </div>
        @if (perms.has('person:create')) {
          <button class="btn-primary" (click)="openCreate()">
            <i class="pi pi-plus"></i> {{ 'people.new' | transloco }}
          </button>
        }
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-wrap">
          <i class="pi pi-search search-icon"></i>
          <input class="search-input" [placeholder]="'people.searchPlaceholder' | transloco" [(ngModel)]="search"
            (ngModelChange)="onSearchChange()" />
        </div>
        <select class="filter-select" [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">{{ 'people.allStatuses' | transloco }}</option>
          <option value="0">{{ 'status.employment.0' | transloco }}</option>
          <option value="1">{{ 'status.employment.1' | transloco }}</option>
          <option value="2">{{ 'status.employment.2' | transloco }}</option>
          <option value="3">{{ 'status.employment.3' | transloco }}</option>
        </select>
      </div>

      <!-- Table -->
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ 'people.colPerson' | transloco }}</th>
              <th>{{ 'people.colTitle' | transloco }}</th>
              <th>{{ 'people.colStatus' | transloco }}</th>
              <th>{{ 'people.colPlatform' | transloco }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr><td colspan="5" class="table-empty">{{ 'common.loading' | transloco }}</td></tr>
            } @else if (!result()?.items?.length) {
              <tr><td colspan="5" class="table-empty">{{ 'people.notFound' | transloco }}</td></tr>
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
                      {{ 'status.employment.' + p.employmentStatus | transloco }}
                    </span>
                  </td>
                  <td>
                    @if (p.isPlatformUser) {
                      <span class="badge badge--active">{{ 'common.yes' | transloco }}</span>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td class="action-cell">
                    <a [routerLink]="['/people', p.id]" class="btn-link">{{ 'people.detail' | transloco }}</a>
                    <div class="kebab-wrap">
                      <button class="kebab-btn" (click)="$event.stopPropagation(); toggleMenu(p.id)"><i class="pi pi-ellipsis-v"></i></button>
                      @if (openMenuId() === p.id) {
                        <div class="kebab-menu">
                          @if (!p.isPlatformUser && perms.has('person:write')) {
                            <button class="km-item" (click)="openPromote(p)">
                              <i class="pi pi-key"></i> {{ 'people.promote' | transloco }}
                            </button>
                          }
                          <button class="km-item km-danger" (click)="confirmDelete(p)">
                            <i class="pi pi-trash"></i> {{ 'common.delete' | transloco }}
                          </button>
                        </div>
                      }
                    </div>
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

    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="cancelDelete()">
        <div class="modal modal--sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ 'people.deleteTitle' | transloco }}</h2>
            <button class="modal-close" (click)="cancelDelete()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <p style="margin:0;color:var(--text)" [innerHTML]="'people.deleteConfirm' | transloco:{ name: deleteTarget()!.firstName + ' ' + deleteTarget()!.lastName }"></p>
            <p style="margin:0.5rem 0 0;font-size:0.8125rem;color:var(--text-muted)">{{ 'common.irreversible' | transloco }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="cancelDelete()">{{ 'common.cancel' | transloco }}</button>
            <button type="button" class="btn-danger" [disabled]="deleting()" (click)="deletePerson()">
              {{ (deleting() ? 'common.deleting' : 'common.delete') | transloco }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (promoteTarget()) {
      <div class="modal-overlay" (click)="closePromote()">
        <div class="modal modal--sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ 'people.promoteTitle' | transloco }}</h2>
            <button class="modal-close" (click)="closePromote()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <p style="margin:0 0 1rem;color:var(--text)" [innerHTML]="'people.promoteInfo' | transloco:{ name: promoteTarget()!.firstName + ' ' + promoteTarget()!.lastName }"></p>
            <div class="form-group">
              <label>{{ 'people.username' | transloco }}</label>
              <input type="text" [value]="promoteTarget()!.email" readonly style="background:var(--surface-2);color:var(--text-muted)" />
              <span class="form-hint">{{ 'people.usernameHint' | transloco }}</span>
            </div>
            <div class="form-group">
              <label>{{ 'people.password' | transloco }} *</label>
              <div style="display:flex;gap:0.5rem">
                <input type="text" [(ngModel)]="promotePassword" style="flex:1" [placeholder]="'people.passwordPlaceholder' | transloco" />
                <button type="button" class="btn-secondary" (click)="promotePassword.set(randomPassword())" [title]="'people.genPassword' | transloco"><i class="pi pi-refresh"></i></button>
              </div>
            </div>
            @if (promoteError()) { <div class="alert-error">{{ promoteError() }}</div> }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="closePromote()">{{ 'common.cancel' | transloco }}</button>
            <button type="button" class="btn-primary" [disabled]="promoteSaving()" (click)="submitPromote()">
              {{ (promoteSaving() ? 'common.saving' : 'people.promoteTitle') | transloco }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Create Person Modal -->
    @if (showCreate()) {
      <div class="modal-overlay" (click)="closeCreate()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ 'people.new' | transloco }}</h2>
            <button class="modal-close" (click)="closeCreate()"><i class="pi pi-times"></i></button>
          </div>
          <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="modal-body">
            <div class="form-row">
              <div class="form-group" [class.has-error]="isInvalid('firstName')">
                <label>{{ 'people.firstName' | transloco }} *</label>
                <input formControlName="firstName" [placeholder]="'people.firstName' | transloco" />
                @if (isInvalid('firstName')) { <span class="form-error">{{ 'common.required' | transloco }}</span> }
              </div>
              <div class="form-group" [class.has-error]="isInvalid('lastName')">
                <label>{{ 'people.lastName' | transloco }} *</label>
                <input formControlName="lastName" [placeholder]="'people.lastName' | transloco" />
                @if (isInvalid('lastName')) { <span class="form-error">{{ 'common.required' | transloco }}</span> }
              </div>
            </div>
            <div class="form-group" [class.has-error]="isInvalid('email')">
              <label>{{ 'common.email' | transloco }} *</label>
              <input type="email" formControlName="email" placeholder="ad@sirket.com" />
              @if (isInvalid('email')) { <span class="form-error">{{ 'people.emailInvalid' | transloco }}</span> }
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'people.jobTitle' | transloco }}</label>
                <input formControlName="title" [placeholder]="'people.jobTitlePlaceholder' | transloco" />
              </div>
              <div class="form-group">
                <label>{{ 'people.phone' | transloco }}</label>
                <input formControlName="phone" [placeholder]="'people.phonePlaceholder' | transloco" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'people.hireDate' | transloco }}</label>
                <input type="date" formControlName="hireDate" />
              </div>
              <div class="form-group">
                <label>{{ 'people.statusLabel' | transloco }}</label>
                <select formControlName="employmentStatus">
                  <option value="0">{{ 'status.employment.0' | transloco }}</option>
                  <option value="1">{{ 'status.employment.1' | transloco }}</option>
                </select>
              </div>
            </div>

            <label class="toggle-row">
              <input type="checkbox" formControlName="isPlatformUser" />
              <span>{{ 'people.grantPlatformAccess' | transloco }}</span>
            </label>

            @if (createForm.get('isPlatformUser')?.value) {
              <div class="form-group">
                <label>{{ 'people.username' | transloco }}</label>
                <input type="text" [value]="createForm.get('email')?.value || ('people.enterEmail' | transloco)" readonly
                  style="background:var(--surface-2);color:var(--text-muted)" />
                <span class="form-hint">{{ 'people.usernameHint' | transloco }}</span>
              </div>
              <div class="form-group" [class.has-error]="isInvalid('password')">
                <label>{{ 'people.password' | transloco }} *</label>
                <div style="display:flex;gap:0.5rem">
                  <input type="text" formControlName="password" style="flex:1"
                    [placeholder]="'people.passwordPlaceholder' | transloco" />
                  <button type="button" class="btn-secondary" (click)="generatePassword()" [title]="'people.genPassword' | transloco">
                    <i class="pi pi-refresh"></i>
                  </button>
                </div>
                @if (isInvalid('password')) {
                  <span class="form-error">{{ 'people.passwordRule' | transloco }}</span>
                }
              </div>
            }

            @if (createError()) {
              <div class="alert-error">{{ createError() }}</div>
            }

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="closeCreate()">{{ 'common.cancel' | transloco }}</button>
              <button type="submit" class="btn-primary" [disabled]="saving()">
                {{ (saving() ? 'common.saving' : 'common.save') | transloco }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

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
      color: var(--text-subtle);
      font-size: 0.875rem;
    }
    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid var(--border-strong);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      outline: none;
      &:focus { border-color: var(--primary); }
    }
    .filter-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-strong);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: var(--surface);
      outline: none;
      cursor: pointer;
    }

    .table-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      th {
        background: var(--surface-2);
        padding: 0.75rem 1rem;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border);
      }
      td {
        padding: 0.875rem 1rem;
        font-size: 0.875rem;
        color: var(--text);
        border-bottom: 1px solid var(--surface-3);
      }
    }
    .table-row:last-child td { border-bottom: none; }
    .table-row:hover td { background: var(--surface-2); }
    .table-empty { text-align: center; color: var(--text-subtle); padding: 3rem 1rem !important; }

    .person-cell { display: flex; align-items: center; gap: 0.75rem; }
    .avatar {
      width: 2rem; height: 2rem;
      background: var(--indigo-soft-bg); color: var(--indigo-strong);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
      flex-shrink: 0;
    }
    .person-name { font-weight: 500; color: var(--text-strong); }
    .person-email { font-size: 0.75rem; color: var(--text-subtle); margin-top: 1px; }
    .text-muted { color: var(--text-subtle); }
    .action-cell { text-align: right; }
    .btn-link {
      color: var(--primary); font-size: 0.8125rem; font-weight: 500;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.375rem;
      background: var(--primary); color: white; border: none;
      border-radius: 0.5rem; padding: 0.5rem 1rem;
      font-size: 0.875rem; font-weight: 600; cursor: pointer;
      &:hover:not(:disabled) { background: var(--primary-hover); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .btn-secondary {
      background: var(--surface); color: var(--text);
      border: 1px solid var(--border-strong); border-radius: 0.5rem;
      padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; cursor: pointer;
      &:hover { background: var(--surface-2); }
    }

    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      padding: 0.75rem;
      border-top: 1px solid var(--surface-3);
    }
    .page-btn {
      width: 2rem; height: 2rem;
      border: 1px solid var(--border-strong); border-radius: 0.375rem;
      background: var(--surface); cursor: pointer; font-size: 1rem;
      &:hover:not(:disabled) { background: var(--surface-3); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
    .page-info { font-size: 0.875rem; color: var(--text-muted); }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal {
      background: var(--surface); border-radius: 0.75rem;
      width: 100%; max-width: 540px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      max-height: 90vh; overflow-y: auto;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); }
    }
    .modal-close {
      background: none; border: none; cursor: pointer;
      color: var(--text-subtle); font-size: 1rem;
      &:hover { color: var(--text); }
    }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-3);
      margin-top: 0.5rem;
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-group label { font-size: 0.8125rem; font-weight: 500; color: var(--text); }
    .form-group input, .form-group select {
      border: 1px solid var(--border-strong); border-radius: 0.5rem;
      padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none;
      &:focus { border-color: var(--primary); }
    }
    .form-group.has-error input, .form-group.has-error select { border-color: var(--danger); }
    .form-error { font-size: 0.75rem; color: var(--danger); }

    .toggle-row {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.875rem; color: var(--text); cursor: pointer;
      input[type="checkbox"] { width: 1rem; height: 1rem; cursor: pointer; }
    }

    .alert-error {
      background: var(--danger-soft-bg); border: 1px solid var(--danger-border);
      border-radius: 0.5rem; padding: 0.75rem;
      font-size: 0.875rem; color: var(--danger-soft-text);
    }

    .action-cell { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; }
    .kebab-wrap { position: relative; display: inline-block; }
    .kebab-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 1rem; line-height: 1; &:hover { background: var(--surface-3); color: var(--text); } }
    .kebab-menu { position: absolute; right: 0; top: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 0.5rem; box-shadow: 0 4px 16px rgba(0,0,0,0.12); min-width: 120px; z-index: 50; padding: 0.25rem; }
    .km-item { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem 0.75rem; border: none; background: none; cursor: pointer; font-size: 0.875rem; border-radius: 0.375rem; white-space: nowrap; &:hover { background: var(--surface-3); } }
    .km-danger { color: var(--danger-strong); &:hover { background: var(--danger-faint-bg) !important; } }
    .btn-danger { display: inline-flex; align-items: center; gap: 0.375rem; background: var(--danger-strong); color: white; border: none; border-radius: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; &:hover:not(:disabled) { background: var(--danger-strong); } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .modal--sm { max-width: 400px; }
  `]
})
export class PeopleListComponent implements OnInit {
  private http = inject(HttpClient);
  protected perms = inject(PermissionService);
  private fb = inject(FormBuilder);
  private transloco = inject(TranslocoService);

  result = signal<GetPeopleResult | null>(null);
  loading = signal(true);
  showCreate = signal(false);
  saving = signal(false);
  createError = signal('');

  openMenuId = signal<string | null>(null);
  deleteTarget = signal<PersonListItem | null>(null);
  deleting = signal(false);

  promoteTarget = signal<PersonListItem | null>(null);
  promotePassword = signal('');
  promoteSaving = signal(false);
  promoteError = signal('');

  /** Güçlü rastgele şifre üretir (büyük/küçük harf + rakam + özel). */
  randomPassword(): string {
    const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ', L = 'abcdefghijkmnpqrstuvwxyz', D = '23456789', S = '!@#$%&*?';
    const all = U + L + D + S;
    const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
    let pw = pick(U) + pick(L) + pick(D) + pick(S);
    for (let i = 0; i < 8; i++) pw += pick(all);
    return pw.split('').sort(() => Math.random() - 0.5).join('');
  }

  generatePassword(): void {
    this.createForm.get('password')?.setValue(this.randomPassword());
  }

  openPromote(p: PersonListItem): void {
    this.openMenuId.set(null);
    this.promoteTarget.set(p);
    this.promotePassword.set(this.randomPassword());
    this.promoteError.set('');
  }
  closePromote(): void { this.promoteTarget.set(null); }

  submitPromote(): void {
    const p = this.promoteTarget();
    if (!p) return;
    const pw = this.promotePassword();
    if (!pw || pw.length < 8 || !/(?=.*[A-Z])(?=.*[0-9])/.test(pw)) {
      this.promoteError.set(this.transloco.translate('people.passwordRule'));
      return;
    }
    this.promoteSaving.set(true);
    this.promoteError.set('');
    this.http.post(`${environment.apiUrl}/admin/users/${p.id}/make-platform-user`, { password: pw }).subscribe({
      next: () => { this.promoteSaving.set(false); this.closePromote(); this.load(); },
      error: err => { this.promoteSaving.set(false); this.promoteError.set(err.error?.detail ?? this.transloco.translate('people.operationFailed')); }
    });
  }

  toggleMenu(id: string): void {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  confirmDelete(p: PersonListItem): void {
    this.openMenuId.set(null);
    this.deleteTarget.set(p);
  }

  cancelDelete(): void { this.deleteTarget.set(null); }

  deletePerson(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.http.delete(`${environment.apiUrl}/people/${target.id}`).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.load();
      },
      error: () => this.deleting.set(false)
    });
  }

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
      this.createForm.get('password')?.addValidators([
        Validators.required, Validators.minLength(8),
        Validators.pattern('(?=.*[A-Z])(?=.*[0-9]).{8,}')
      ]);
    } else {
      this.createForm.get('password')?.clearValidators();
    }
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
      username: v.isPlatformUser ? v.email : null,
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
          : err.error?.detail ?? this.transloco.translate('people.genericError'));
      }
    });
  }
}
