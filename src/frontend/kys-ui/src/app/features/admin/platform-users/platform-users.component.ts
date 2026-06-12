import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';

interface ProvisionableGroup {
  teamId: string | null;
  teamName: string;
  people: { id: string; fullName: string; email: string; title: string | null }[];
}

interface PersonItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string | null;
  employmentStatus: number;
  isPlatformUser: boolean;
  isLocked: boolean;
}

interface SystemRole {
  id: string;
  name: string;
  code: string;
  permissions: string[];
  assignedAt: string;
}

// Seeded system roles (fixed GUIDs from SystemRoleConfiguration)
const ALL_SYSTEM_ROLES = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Platform Yöneticisi', code: 'PlatformAdmin' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Direktör', code: 'Director' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Ekip Lideri', code: 'TeamLead' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Geliştirici', code: 'Developer' },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Salt Okuma', code: 'ReadOnly' }
];

const ROLE_COLOR: Record<string, string> = {
  PlatformAdmin: 'badge--admin', Director: 'badge--director',
  TeamLead: 'badge--lead', Developer: 'badge--dev', ReadOnly: 'badge--readonly'
};

@Component({
  selector: 'app-platform-users',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule, TranslocoModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <div class="breadcrumb"><a routerLink="/admin">{{ 'admin.crumb' | transloco }}</a><span>/</span><span>{{ 'admin.platformUsers.title' | transloco }}</span></div>
          <h1 class="page-title">{{ 'admin.platformUsers.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'admin.platformUsers.subtitle' | transloco }}</p>
        </div>
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-user-plus"></i> {{ 'admin.platformUsers.addPerson' | transloco }}</button>
      </div>

      <!-- Search -->
      <div class="toolbar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input type="text" [placeholder]="'admin.platformUsers.searchPh' | transloco" [(ngModel)]="search" (input)="filterUsers()" />
        </div>
      </div>

      @if (loading()) {
        <div class="empty-state">{{ 'common.loading' | transloco }}</div>
      } @else if (!filtered().length) {
        <div class="empty-state">{{ 'admin.platformUsers.empty' | transloco }}</div>
      } @else {
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'admin.platformUsers.colPerson' | transloco }}</th>
                <th>{{ 'admin.platformUsers.colTitle' | transloco }}</th>
                <th>{{ 'admin.platformUsers.colRoles' | transloco }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of filtered(); track p.id) {
                <tr>
                  <td class="person-cell">
                    <div class="avatar">{{ p.firstName[0] }}{{ p.lastName[0] }}</div>
                    <div>
                      <a [routerLink]="['/people', p.id]" class="person-name">{{ p.firstName }} {{ p.lastName }}</a>
                      <p class="person-email">{{ p.email }}</p>
                    </div>
                  </td>
                  <td class="text-muted">{{ p.title ?? '—' }}</td>
                  <td>
                    @if (p.isLocked) {
                      <span class="locked-badge"><i class="pi pi-lock"></i> {{ 'admin.platformUsers.locked' | transloco }}</span>
                    }
                    @let roles = rolesMap().get(p.id);
                    @if (roles === undefined) {
                      <button class="load-roles-btn" (click)="loadRoles(p.id)">{{ 'admin.platformUsers.loadRoles' | transloco }}</button>
                    } @else if (!roles.length) {
                      <span class="text-muted">{{ 'admin.platformUsers.noRoles' | transloco }}</span>
                    } @else {
                      <div class="role-chips">
                        @for (r of roles; track r.id) {
                          <span class="role-chip" [ngClass]="roleColor(r.code)">
                            {{ roleName(r.code, r.name) }}
                            <button class="remove-role-btn" (click)="removeRole(p.id, r.id)" [title]="'admin.platformUsers.removeRoleTitle' | transloco">
                              <i class="pi pi-times"></i>
                            </button>
                          </span>
                        }
                      </div>
                    }
                  </td>
                  <td class="action-cell">
                    <div class="action-group">
                      <button class="btn-sm" (click)="openAssignRole(p.id)">
                        <i class="pi pi-user-edit"></i> {{ 'admin.platformUsers.addRole' | transloco }}
                      </button>
                      <button class="btn-sm" (click)="openResetPassword(p.id, p.firstName + ' ' + p.lastName)">
                        <i class="pi pi-key"></i> {{ 'admin.platformUsers.password' | transloco }}
                      </button>
                      @if (p.isLocked) {
                        <button class="btn-sm btn-warning" (click)="unlockAccount(p.id)">
                          <i class="pi pi-lock-open"></i> {{ 'admin.platformUsers.unlock' | transloco }}
                        </button>
                      }
                      <button class="btn-sm btn-danger-sm" (click)="removePlatformUser(p)" [title]="'admin.platformUsers.removeAccessTitle' | transloco">
                        <i class="pi pi-user-minus"></i> {{ 'admin.platformUsers.remove' | transloco }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Assign Role Modal -->
    @if (assignModal()) {
      <div class="modal-backdrop" (click)="assignModal.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ 'admin.platformUsers.assignModalTitle' | transloco }}</h2>
            <button class="close-btn" (click)="assignModal.set(null)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (assignError()) {
              <div class="alert-error">{{ assignError() }}</div>
            }
            @let currentRoles = rolesMap().get(assignModal()!) ?? [];
            @let alreadyAssigned = currentRoleIds(assignModal()!);
            <div class="role-list">
              @for (r of ALL_SYSTEM_ROLES; track r.id) {
                <div class="role-option" [class.assigned]="alreadyAssigned.has(r.id)">
                  <div>
                    <span class="role-chip" [ngClass]="roleColor(r.code)">{{ roleName(r.code, r.name) }}</span>
                    <p class="role-code">{{ r.code }}</p>
                  </div>
                  @if (alreadyAssigned.has(r.id)) {
                    <span class="assigned-badge">{{ 'admin.platformUsers.assigned' | transloco }}</span>
                  } @else {
                    <button class="btn btn-primary btn-sm-modal" [disabled]="assigning()" (click)="assignRole(r.id)">{{ 'admin.platformUsers.assign' | transloco }}</button>
                  }
                </div>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="assignModal.set(null)">{{ 'common.close' | transloco }}</button>
          </div>
        </div>
      </div>
    }

    <!-- Reset Password Modal -->
    @if (resetModal()) {
      <div class="modal-backdrop" (click)="resetModal.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ 'admin.platformUsers.resetTitle' | transloco }} — {{ resetModal()!.name }}</h2>
            <button class="close-btn" (click)="resetModal.set(null)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body" style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem">
            @if (resetError()) {
              <div class="alert-error">{{ resetError() }}</div>
            }
            @if (resetSuccess()) {
              <div class="alert-success">{{ 'admin.platformUsers.resetSuccessMsg' | transloco }}</div>
            }
            <div style="display:flex;flex-direction:column;gap:0.375rem">
              <label style="font-size:0.875rem;font-weight:500;color:var(--text)">{{ 'admin.platformUsers.newPassword' | transloco }} *</label>
              <div style="display:flex;gap:0.5rem">
                <input type="text" [(ngModel)]="newPassword"
                  style="flex:1;padding:0.5rem 0.75rem;border:1px solid var(--border-strong);border-radius:0.375rem;font-size:0.875rem"
                  [placeholder]="'admin.platformUsers.newPasswordPh' | transloco" />
                <button type="button" class="btn-secondary" (click)="generateResetPassword()" [title]="'admin.platformUsers.generateTitle' | transloco"><i class="pi pi-refresh"></i></button>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.375rem">
              <label style="font-size:0.875rem;font-weight:500;color:var(--text)">{{ 'admin.platformUsers.confirmPassword' | transloco }} *</label>
              <input type="password" [(ngModel)]="confirmPassword"
                style="padding:0.5rem 0.75rem;border:1px solid var(--border-strong);border-radius:0.375rem;font-size:0.875rem"
                [placeholder]="'admin.platformUsers.confirmPasswordPh' | transloco" />
              @if (resetSubmitted() && newPassword !== confirmPassword) {
                <span style="font-size:0.75rem;color:var(--danger)">{{ 'admin.platformUsers.passwordsMismatch' | transloco }}</span>
              }
            </div>
          </div>
          <div class="modal-footer" style="padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:0.75rem">
            <button class="btn btn-secondary" (click)="resetModal.set(null)">{{ 'common.cancel' | transloco }}</button>
            <button class="btn btn-primary" [disabled]="resetSaving()" (click)="saveResetPassword()">
              {{ (resetSaving() ? 'common.saving' : 'admin.platformUsers.resetButton') | transloco }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (addModal()) {
      <div class="modal-backdrop" (click)="addModal.set(false)">
        <div class="modal modal--lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ 'admin.platformUsers.addModalTitle' | transloco }}</h2>
            <button class="close-btn" (click)="addModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body add-body">
            @if (addLoading()) {
              <div class="empty-state">{{ 'common.loading' | transloco }}</div>
            } @else if (!groups().length) {
              <div class="empty-state">{{ 'admin.platformUsers.noProvisionable' | transloco }}</div>
            } @else {
              <p class="add-hint">{{ 'admin.platformUsers.addHint' | transloco }}</p>
              @for (g of groups(); track g.teamName) {
                <div class="group">
                  <label class="group-head">
                    <input type="checkbox" [checked]="isGroupAll(g)" (change)="toggleGroup(g)" />
                    <span class="group-name">{{ g.teamName }}</span>
                    <span class="group-count">{{ g.people.length }}</span>
                  </label>
                  @for (p of g.people; track p.id) {
                    <label class="person-row">
                      <input type="checkbox" [checked]="selected().has(p.id)" (change)="toggle(p.id)" />
                      <span class="pr-name">{{ p.fullName }}</span>
                      <span class="pr-email">{{ p.email }}</span>
                    </label>
                  }
                </div>
              }
            }
          </div>
          <div class="modal-footer">
            <span class="sel-count">{{ 'admin.platformUsers.selCount' | transloco:{ count: selected().size } }}</span>
            <button class="btn btn-secondary" (click)="addModal.set(false)">{{ 'common.cancel' | transloco }}</button>
            <button class="btn btn-primary" [disabled]="selected().size === 0 || addSaving()" (click)="submitAdd()">
              {{ (addSaving() ? 'common.adding' : 'admin.platformUsers.addToPlatform') | transloco }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal--lg { max-width: 600px; }
    .add-body { max-height: 60vh; overflow-y: auto; }
    .add-hint { font-size: 0.8125rem; color: var(--text-muted); margin: 0 0 1rem; }
    .group { margin-bottom: 1rem; border: 1px solid var(--border); border-radius: 0.5rem; overflow: hidden; }
    .group-head { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: var(--surface-2); font-weight: 600; font-size: 0.875rem; color: var(--text-strong); cursor: pointer; }
    .group-count { margin-left: auto; font-size: 0.75rem; color: var(--text-muted); background: var(--surface-3); padding: 0.1rem 0.5rem; border-radius: 9999px; }
    .person-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-top: 1px solid var(--border-light); cursor: pointer; font-size: 0.875rem; }
    .person-row:hover { background: var(--hover); }
    .pr-name { color: var(--text-strong); }
    .pr-email { margin-left: auto; color: var(--text-muted); font-size: 0.8125rem; }
    .sel-count { margin-right: auto; font-size: 0.8125rem; color: var(--text-muted); }
  `,
  `
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.375rem; a { color: var(--primary); text-decoration: none; } span { &:last-child { color: var(--text); } } }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .toolbar { margin-bottom: 1rem; }
    .search-box { position: relative; max-width: 360px; i { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-subtle); font-size: 0.875rem; } input { width: 100%; padding: 0.5rem 0.75rem 0.5rem 2.25rem; border: 1px solid var(--border-strong); border-radius: 0.5rem; font-size: 0.875rem; box-sizing: border-box; } }

    .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-subtle); font-size: 0.875rem; }
    .data-table { width: 100%; border-collapse: collapse;
      th { background: var(--surface-2); padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); }
      td { padding: 0.75rem; font-size: 0.875rem; color: var(--text); border-bottom: 1px solid var(--surface-3); vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
    }
    .person-cell { display: flex; align-items: center; gap: 0.75rem; }
    .avatar { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: var(--indigo-soft-bg); color: var(--indigo-strong); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
    .person-name { font-weight: 500; color: var(--text-strong); text-decoration: none; &:hover { color: var(--primary); } }
    .person-email { font-size: 0.8125rem; color: var(--text-subtle); margin: 0; }
    .text-muted { color: var(--text-subtle); font-size: 0.8125rem; }
    .role-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .role-chip { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.1875rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--admin { background: var(--danger-soft-bg); color: var(--danger-soft-text); }
    .badge--director { background: var(--violet-soft-bg); color: var(--violet-soft-text); }
    .badge--lead { background: var(--primary-soft-bg-2); color: var(--primary-strong); }
    .badge--dev { background: var(--success-soft-bg); color: var(--success-soft-text); }
    .badge--readonly { background: var(--surface-3); color: var(--text); }
    .remove-role-btn { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.6; padding: 0; font-size: 0.6875rem; line-height: 1; display: flex; &:hover { opacity: 1; } }
    .load-roles-btn { background: none; border: none; color: var(--primary); font-size: 0.8125rem; cursor: pointer; padding: 0; &:hover { text-decoration: underline; } }
    .action-cell { text-align: right; }
    .btn-sm { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.375rem 0.75rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; &:hover { background: var(--surface-2); } }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary); color: white; &:not(:disabled):hover { background: var(--primary-hover); } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--surface-3); } }
    .btn-sm-modal { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; font-size: 1rem; &:hover { color: var(--text); } }
    .modal-body { padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 0; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; }
    .role-list { display: flex; flex-direction: column; }
    .role-option { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 0; border-bottom: 1px solid var(--surface-3); &:last-child { border-bottom: none; } &.assigned { opacity: 0.6; } }
    .role-code { font-size: 0.75rem; color: var(--text-subtle); margin: 0.25rem 0 0; }
    .assigned-badge { font-size: 0.75rem; color: var(--text-muted); background: var(--surface-3); padding: 0.25rem 0.625rem; border-radius: 9999px; }
    .alert-error { padding: 0.75rem 1rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.5rem; color: var(--danger-soft-text); font-size: 0.875rem; margin-bottom: 0.5rem; }
    .alert-success { padding: 0.75rem 1rem; background: var(--success-soft-bg); border: 1px solid var(--success-soft-bg); border-radius: 0.5rem; color: var(--success-soft-text); font-size: 0.875rem; }
    .locked-badge { display: inline-flex; align-items: center; gap: 0.25rem; background: var(--warning-soft-bg); color: var(--warning-soft-text); font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 9999px; margin-bottom: 0.25rem; }
    .action-group { display: flex; gap: 0.375rem; justify-content: flex-end; flex-wrap: wrap; }
    .btn-warning { border-color: var(--warning); color: var(--warning-soft-text); &:hover { background: var(--warning-soft-bg); } }
    .btn-danger-sm { border-color: var(--danger-border); color: var(--danger-soft-text); &:hover { background: var(--danger-faint-bg); color: var(--danger); } }
  `]
})
export class PlatformUsersComponent implements OnInit {
  private http = inject(HttpClient);
  private notify = inject(NotificationService);
  private transloco = inject(TranslocoService);

  readonly ALL_SYSTEM_ROLES = ALL_SYSTEM_ROLES;

  roleName(code: string, fallback: string): string {
    const key = `admin.platformUsers.role.${code}`;
    const label = this.transloco.translate(key);
    return label === key ? fallback : label;
  }

  users = signal<PersonItem[]>([]);
  filtered = signal<PersonItem[]>([]);
  loading = signal(true);
  search = '';

  rolesMap = signal<Map<string, SystemRole[]>>(new Map());
  assignModal = signal<string | null>(null);
  assigning = signal(false);
  assignError = signal('');

  // --- Toplu kişi ekleme ---
  addModal = signal(false);
  addLoading = signal(false);
  addSaving = signal(false);
  groups = signal<ProvisionableGroup[]>([]);
  selected = signal<Set<string>>(new Set());

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading.set(true);
    this.http.get<{ items: PersonItem[]; totalCount: number }>(`${environment.apiUrl}/people?pageSize=500`).subscribe({
      next: r => {
        const platform = r.items.filter(p => p.isPlatformUser);
        this.users.set(platform);
        this.filterUsers();
        this.loading.set(false);
        platform.forEach(p => this.loadRoles(p.id));
      },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    this.addModal.set(true);
    this.selected.set(new Set());
    this.addLoading.set(true);
    this.http.get<ProvisionableGroup[]>(`${environment.apiUrl}/admin/users/provisionable`).subscribe({
      next: g => { this.groups.set(g); this.addLoading.set(false); },
      error: () => this.addLoading.set(false)
    });
  }

  toggle(id: string) {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
  }

  isGroupAll(g: ProvisionableGroup) {
    return g.people.length > 0 && g.people.every(p => this.selected().has(p.id));
  }

  toggleGroup(g: ProvisionableGroup) {
    const s = new Set(this.selected());
    const all = this.isGroupAll(g);
    for (const p of g.people) { all ? s.delete(p.id) : s.add(p.id); }
    this.selected.set(s);
  }

  submitAdd() {
    const ids = [...this.selected()];
    if (!ids.length) return;
    this.addSaving.set(true);
    this.http.post<{ provisioned: number }>(`${environment.apiUrl}/admin/users/make-platform-users`, { personIds: ids }).subscribe({
      next: r => {
        this.addSaving.set(false);
        this.addModal.set(false);
        this.notify.success(this.transloco.translate('admin.platformUsers.provisioned', { count: r.provisioned }));
        this.loadUsers();
      },
      error: e => { this.addSaving.set(false); this.notify.error(e.error?.detail ?? this.transloco.translate('admin.platformUsers.opFailed')); }
    });
  }

  filterUsers() {
    const q = this.search.toLowerCase();
    this.filtered.set(
      this.users().filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
      )
    );
  }

  loadRoles(personId: string) {
    this.http.get<SystemRole[]>(`${environment.apiUrl}/admin/users/${personId}/system-roles`).subscribe({
      next: roles => {
        this.rolesMap.update(m => { const nm = new Map(m); nm.set(personId, roles); return nm; });
      },
      error: () => {
        this.rolesMap.update(m => { const nm = new Map(m); nm.set(personId, []); return nm; });
      }
    });
  }

  roleColor(code: string) { return ROLE_COLOR[code] ?? 'badge--readonly'; }

  currentRoleIds(personId: string): Set<string> {
    return new Set((this.rolesMap().get(personId) ?? []).map(r => r.id));
  }

  openAssignRole(personId: string) {
    this.assignError.set('');
    this.assignModal.set(personId);
  }

  assignRole(systemRoleId: string) {
    const personId = this.assignModal()!;
    this.assigning.set(true);
    this.assignError.set('');
    this.http.post(`${environment.apiUrl}/admin/users/${personId}/system-roles`, { systemRoleId }).subscribe({
      next: () => { this.assigning.set(false); this.loadRoles(personId); },
      error: err => { this.assigning.set(false); this.assignError.set(err.error?.detail ?? this.transloco.translate('admin.platformUsers.roleAssignFailed')); }
    });
  }

  removeRole(personId: string, systemRoleId: string) {
    this.http.delete(`${environment.apiUrl}/admin/users/${personId}/system-roles/${systemRoleId}`).subscribe({
      next: () => this.loadRoles(personId)
    });
  }

  // --- Reset Password ---
  resetModal = signal<{ id: string; name: string } | null>(null);
  resetSaving = signal(false);
  resetSubmitted = signal(false);
  resetError = signal('');
  resetSuccess = signal(false);
  newPassword = '';
  confirmPassword = '';

  openResetPassword(personId: string, name: string) {
    this.newPassword = '';
    this.confirmPassword = '';
    this.resetSubmitted.set(false);
    this.resetError.set('');
    this.resetSuccess.set(false);
    this.resetModal.set({ id: personId, name });
  }

  saveResetPassword() {
    this.resetSubmitted.set(true);
    if (!this.newPassword || this.newPassword !== this.confirmPassword) return;
    this.resetSaving.set(true);
    this.resetError.set('');
    this.resetSuccess.set(false);
    const personId = this.resetModal()!.id;
    this.http.post(`${environment.apiUrl}/admin/users/${personId}/reset-password`, { newPassword: this.newPassword }).subscribe({
      next: () => {
        this.resetSaving.set(false);
        this.resetSuccess.set(true);
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: err => {
        this.resetSaving.set(false);
        this.resetError.set(err.error?.detail ?? this.transloco.translate('admin.platformUsers.resetFailed'));
      }
    });
  }

  randomPassword(): string {
    const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ', L = 'abcdefghijkmnpqrstuvwxyz', D = '23456789', S = '!@#$%&*?';
    const all = U + L + D + S;
    const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
    let pw = pick(U) + pick(L) + pick(D) + pick(S);
    for (let i = 0; i < 8; i++) pw += pick(all);
    return pw.split('').sort(() => Math.random() - 0.5).join('');
  }

  generateResetPassword() {
    const pw = this.randomPassword();
    this.newPassword = pw;
    this.confirmPassword = pw;
  }

  // --- Unlock Account ---
  unlockAccount(personId: string) {
    this.http.post(`${environment.apiUrl}/admin/users/${personId}/unlock`, {}).subscribe({
      next: () => {
        this.users.update(list => list.map(p => p.id === personId ? { ...p, isLocked: false } : p));
        this.filterUsers();
      }
    });
  }

  // --- Platform erişimini kaldır ---
  removePlatformUser(p: PersonItem) {
    if (!confirm(this.transloco.translate('admin.platformUsers.removeConfirm', { name: `${p.firstName} ${p.lastName}` }))) return;
    this.http.post(`${environment.apiUrl}/admin/users/${p.id}/remove-platform-user`, {}).subscribe({
      next: () => { this.notify.success(this.transloco.translate('admin.platformUsers.accessRemoved')); this.loadUsers(); },
      error: e => this.notify.error(e.error?.detail ?? this.transloco.translate('admin.platformUsers.opFailed'))
    });
  }
}
