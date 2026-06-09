import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

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
  imports: [RouterLink, NgClass, FormsModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <div class="breadcrumb"><a routerLink="/admin">Admin</a><span>/</span><span>Platform Kullanıcıları</span></div>
          <h1 class="page-title">Platform Kullanıcıları</h1>
          <p class="page-subtitle">Platform erişimi olan kişiler ve sistem rolleri</p>
        </div>
      </div>

      <!-- Search -->
      <div class="toolbar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input type="text" placeholder="Kullanıcı ara..." [(ngModel)]="search" (input)="filterUsers()" />
        </div>
      </div>

      @if (loading()) {
        <div class="empty-state">Yükleniyor...</div>
      } @else if (!filtered().length) {
        <div class="empty-state">Platform erişimi olan kullanıcı bulunamadı.</div>
      } @else {
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Kişi</th>
                <th>Unvan</th>
                <th>Sistem Rolleri</th>
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
                      <span class="locked-badge"><i class="pi pi-lock"></i> Kilitli</span>
                    }
                    @let roles = rolesMap().get(p.id);
                    @if (roles === undefined) {
                      <button class="load-roles-btn" (click)="loadRoles(p.id)">Rolleri yükle</button>
                    } @else if (!roles.length) {
                      <span class="text-muted">Rol atanmamış</span>
                    } @else {
                      <div class="role-chips">
                        @for (r of roles; track r.id) {
                          <span class="role-chip" [ngClass]="roleColor(r.code)">
                            {{ r.name }}
                            <button class="remove-role-btn" (click)="removeRole(p.id, r.id)" title="Rolü kaldır">
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
                        <i class="pi pi-user-edit"></i> Rol Ekle
                      </button>
                      <button class="btn-sm" (click)="openResetPassword(p.id, p.firstName + ' ' + p.lastName)">
                        <i class="pi pi-key"></i> Şifre
                      </button>
                      @if (p.isLocked) {
                        <button class="btn-sm btn-warning" (click)="unlockAccount(p.id)">
                          <i class="pi pi-lock-open"></i> Kilidi Aç
                        </button>
                      }
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
            <h2>Sistem Rolü Ata</h2>
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
                    <span class="role-chip" [ngClass]="roleColor(r.code)">{{ r.name }}</span>
                    <p class="role-code">{{ r.code }}</p>
                  </div>
                  @if (alreadyAssigned.has(r.id)) {
                    <span class="assigned-badge">Atanmış</span>
                  } @else {
                    <button class="btn btn-primary btn-sm-modal" [disabled]="assigning()" (click)="assignRole(r.id)">Ata</button>
                  }
                </div>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="assignModal.set(null)">Kapat</button>
          </div>
        </div>
      </div>
    }

    <!-- Reset Password Modal -->
    @if (resetModal()) {
      <div class="modal-backdrop" (click)="resetModal.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Şifre Sıfırla — {{ resetModal()!.name }}</h2>
            <button class="close-btn" (click)="resetModal.set(null)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body" style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem">
            @if (resetError()) {
              <div class="alert-error">{{ resetError() }}</div>
            }
            @if (resetSuccess()) {
              <div class="alert-success">Şifre başarıyla sıfırlandı.</div>
            }
            <div style="display:flex;flex-direction:column;gap:0.375rem">
              <label style="font-size:0.875rem;font-weight:500;color:var(--text)">Yeni Şifre *</label>
              <input type="password" [(ngModel)]="newPassword"
                style="padding:0.5rem 0.75rem;border:1px solid var(--border-strong);border-radius:0.375rem;font-size:0.875rem"
                placeholder="En az 8 karakter" />
            </div>
            <div style="display:flex;flex-direction:column;gap:0.375rem">
              <label style="font-size:0.875rem;font-weight:500;color:var(--text)">Şifre Tekrar *</label>
              <input type="password" [(ngModel)]="confirmPassword"
                style="padding:0.5rem 0.75rem;border:1px solid var(--border-strong);border-radius:0.375rem;font-size:0.875rem"
                placeholder="Şifreyi tekrar girin" />
              @if (resetSubmitted() && newPassword !== confirmPassword) {
                <span style="font-size:0.75rem;color:var(--danger)">Şifreler eşleşmiyor</span>
              }
            </div>
          </div>
          <div class="modal-footer" style="padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:0.75rem">
            <button class="btn btn-secondary" (click)="resetModal.set(null)">İptal</button>
            <button class="btn btn-primary" [disabled]="resetSaving()" (click)="saveResetPassword()">
              {{ resetSaving() ? 'Kaydediliyor...' : 'Şifreyi Sıfırla' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
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
  `]
})
export class PlatformUsersComponent implements OnInit {
  private http = inject(HttpClient);

  readonly ALL_SYSTEM_ROLES = ALL_SYSTEM_ROLES;

  users = signal<PersonItem[]>([]);
  filtered = signal<PersonItem[]>([]);
  loading = signal(true);
  search = '';

  rolesMap = signal<Map<string, SystemRole[]>>(new Map());
  assignModal = signal<string | null>(null);
  assigning = signal(false);
  assignError = signal('');

  ngOnInit() {
    this.http.get<{ items: PersonItem[]; totalCount: number }>(`${environment.apiUrl}/people?pageSize=500`).subscribe({
      next: r => {
        const platform = r.items.filter(p => p.isPlatformUser);
        this.users.set(platform);
        this.filtered.set(platform);
        this.loading.set(false);
        // Auto-load roles for all platform users
        platform.forEach(p => this.loadRoles(p.id));
      },
      error: () => this.loading.set(false)
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
      error: err => { this.assigning.set(false); this.assignError.set(err.error?.detail ?? 'Rol atanamadı'); }
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
        this.resetError.set(err.error?.detail ?? 'Şifre sıfırlanamadı');
      }
    });
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
}
