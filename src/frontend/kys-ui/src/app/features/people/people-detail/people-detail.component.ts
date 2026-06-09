import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface PersonDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  title: string | null;
  employmentStatus: number;
  hireDate: string | null;
  terminationDate: string | null;
  isPlatformUser: boolean;
  username: string | null;
  isLocked: boolean;
  lastLoginAt: string | null;
  systemRoles: { roleId: string; roleName: string; roleCode: string }[];
  teamMemberships: { teamId: string; teamName: string; organizationRole: string; startDate: string; endDate: string | null }[];
}

const STATUS_LABELS: Record<number, string> = { 0: 'Aktif', 1: 'İzinde', 2: 'İstifa', 3: 'Ayrıldı' };
const STATUS_CSS: Record<number, string> = { 0: 'badge--active', 1: 'badge--pilot', 2: 'badge--suspended', 3: 'badge--archived' };

@Component({
  selector: 'app-people-detail',
  standalone: true,
  imports: [RouterLink, NgClass, DatePipe, FormsModule],
  template: `
    <div class="page-content">
      @if (loading()) {
        <div class="loading-state">Yükleniyor...</div>
      } @else if (!person()) {
        <div class="loading-state">Kişi bulunamadı. <a routerLink="/people">← Geri dön</a></div>
      } @else {
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a routerLink="/people">Kişiler</a>
          <span>/</span>
          <span>{{ person()!.firstName }} {{ person()!.lastName }}</span>
        </div>

        <!-- Header Card -->
        <div class="header-card">
          <div class="header-main">
            <div class="big-avatar">
              {{ person()!.firstName[0] }}{{ person()!.lastName[0] }}
            </div>
            <div class="header-info">
              <h1>{{ person()!.firstName }} {{ person()!.lastName }}</h1>
              <p class="header-title">{{ person()!.title ?? 'Unvan belirtilmemiş' }}</p>
              <div class="header-meta">
                <span><i class="pi pi-envelope"></i> {{ person()!.email }}</span>
                @if (person()!.phone) {
                  <span><i class="pi pi-phone"></i> {{ person()!.phone }}</span>
                }
              </div>
            </div>
          </div>
          <div class="header-badges">
            <span class="badge" [ngClass]="statusCss(person()!.employmentStatus)">
              {{ statusLabel(person()!.employmentStatus) }}
            </span>
            @if (person()!.isPlatformUser) {
              <span class="badge badge--active">Platform Kullanıcısı</span>
            }
            @if (person()!.isLocked) {
              <span class="badge badge--churned">Kilitli</span>
            }
            <button type="button" class="btn-edit" (click)="openStatusChange()">
              <i class="pi pi-sync"></i> Durum
            </button>
            <button type="button" class="btn-edit" (click)="openEdit()">
              <i class="pi pi-pencil"></i> Düzenle
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn" [class.active]="activeTab() === 'info'" (click)="activeTab.set('info')">
            Genel Bilgiler
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'teams'" (click)="activeTab.set('teams')">
            Ekip Geçmişi
            <span class="tab-count">{{ person()!.teamMemberships.length }}</span>
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'roles'" (click)="activeTab.set('roles')">
            Sistem Rolleri
            <span class="tab-count">{{ person()!.systemRoles.length }}</span>
          </button>
        </div>

        <!-- Tab: Genel Bilgiler -->
        @if (activeTab() === 'info') {
          <div class="tab-content">
            <div class="info-grid">
              <div class="info-item">
                <label>İşe Başlama</label>
                <span>{{ person()!.hireDate ? (person()!.hireDate | date:'dd.MM.yyyy') : '—' }}</span>
              </div>
              <div class="info-item">
                <label>Ayrılma Tarihi</label>
                <span>{{ person()!.terminationDate ? (person()!.terminationDate | date:'dd.MM.yyyy') : '—' }}</span>
              </div>
              <div class="info-item">
                <label>Kullanıcı Adı</label>
                <span>{{ person()!.username ?? '—' }}</span>
              </div>
              <div class="info-item">
                <label>Son Giriş</label>
                <span>{{ person()!.lastLoginAt ? (person()!.lastLoginAt | date:'dd.MM.yyyy HH:mm') : '—' }}</span>
              </div>
            </div>
          </div>
        }

        <!-- Tab: Ekip Geçmişi -->
        @if (activeTab() === 'teams') {
          <div class="tab-content">
            @if (!person()!.teamMemberships.length) {
              <p class="empty-text">Ekip üyeliği bulunmuyor.</p>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ekip</th>
                    <th>Organizasyon Rolü</th>
                    <th>Başlangıç</th>
                    <th>Bitiş</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of person()!.teamMemberships; track m.teamId + m.startDate) {
                    <tr>
                      <td>
                        <a [routerLink]="['/teams', m.teamId]" class="link">{{ m.teamName }}</a>
                      </td>
                      <td>{{ m.organizationRole }}</td>
                      <td>{{ m.startDate | date:'dd.MM.yyyy' }}</td>
                      <td>
                        @if (m.endDate) {
                          {{ m.endDate | date:'dd.MM.yyyy' }}
                        } @else {
                          <span class="badge badge--active">Devam ediyor</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }

        <!-- Tab: Sistem Rolleri -->
        @if (activeTab() === 'roles') {
          <div class="tab-content">
            @if (!person()!.systemRoles.length) {
              <p class="empty-text">Sistem rolü atanmamış.</p>
            } @else {
              <div class="role-list">
                @for (r of person()!.systemRoles; track r.roleId) {
                  <div class="role-item">
                    <i class="pi pi-shield"></i>
                    <span>{{ r.roleName }}</span>
                    <span class="role-code">{{ r.roleCode }}</span>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- Employment Status Modal -->
    @if (showStatusModal()) {
      <div class="modal-backdrop" (click)="showStatusModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Çalışma Durumu Değiştir</h2>
            <button type="button" class="close-btn" (click)="showStatusModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (statusError()) {
              <div class="alert-error">{{ statusError() }}</div>
            }
            <div class="form-group">
              <label>Yeni Durum <span class="req">*</span></label>
              <select [(ngModel)]="statusForm.newStatus" style="padding:0.5rem 0.75rem;border:1px solid var(--border-strong);border-radius:0.375rem;font-size:0.875rem;width:100%;box-sizing:border-box;">
                <option value="0">Aktif</option>
                <option value="1">İzinde</option>
                <option value="2">İstifa</option>
                <option value="3">Ayrıldı</option>
              </select>
            </div>
            @if (+statusForm.newStatus === 2 || +statusForm.newStatus === 3) {
              <div class="form-group">
                <label>Ayrılma Tarihi</label>
                <input type="date" [(ngModel)]="statusForm.terminationDate" />
              </div>
              <div class="form-group">
                <label>Ayrılma Nedeni</label>
                <input type="text" [(ngModel)]="statusForm.terminationReason" placeholder="İsteğe bağlı..." />
              </div>
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showStatusModal.set(false)">İptal</button>
            <button type="button" class="btn btn-primary" [disabled]="statusSaving()" (click)="saveStatusChange()">
              {{ statusSaving() ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Edit Modal -->
    @if (showEditModal()) {
      <div class="modal-backdrop" (click)="showEditModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Kişiyi Düzenle</h2>
            <button type="button" class="close-btn" (click)="showEditModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (editError()) {
              <div class="alert-error">{{ editError() }}</div>
            }
            <div class="form-row">
              <div class="form-group">
                <label>Ad <span class="req">*</span></label>
                <input type="text" [(ngModel)]="editForm.firstName" [class.input-error]="editSubmitted() && !editForm.firstName.trim()" />
                @if (editSubmitted() && !editForm.firstName.trim()) {
                  <span class="field-error">Zorunlu alan</span>
                }
              </div>
              <div class="form-group">
                <label>Soyad <span class="req">*</span></label>
                <input type="text" [(ngModel)]="editForm.lastName" [class.input-error]="editSubmitted() && !editForm.lastName.trim()" />
                @if (editSubmitted() && !editForm.lastName.trim()) {
                  <span class="field-error">Zorunlu alan</span>
                }
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Unvan</label>
                <input type="text" [(ngModel)]="editForm.title" placeholder="ör. Senior Developer" />
              </div>
              <div class="form-group">
                <label>Telefon</label>
                <input type="tel" [(ngModel)]="editForm.phone" placeholder="ör. +90 555 123 4567" />
              </div>
            </div>
            <div class="form-group">
              <label>İşe Başlama Tarihi</label>
              <input type="date" [(ngModel)]="editForm.hireDate" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showEditModal.set(false)">İptal</button>
            <button type="button" class="btn btn-primary" [disabled]="editSaving()" (click)="saveEdit()">
              {{ editSaving() ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-state { text-align: center; padding: 4rem; color: var(--text-subtle); }
    .breadcrumb {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.875rem; color: var(--text-muted);
      margin-bottom: 1.25rem;
      a { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } }
    }

    .header-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 0.75rem; padding: 1.5rem;
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      flex-wrap: wrap;
    }
    .header-main { display: flex; align-items: center; gap: 1rem; }
    .big-avatar {
      width: 3.5rem; height: 3.5rem;
      background: var(--indigo-soft-bg); color: var(--indigo-strong);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 1.125rem; font-weight: 700; flex-shrink: 0;
    }
    .header-info h1 { font-size: 1.25rem; font-weight: 700; color: var(--text-strong); }
    .header-title { font-size: 0.875rem; color: var(--text-muted); margin: 0.125rem 0; }
    .header-meta {
      display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.375rem;
      span { font-size: 0.8125rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.375rem; }
      i { font-size: 0.75rem; }
    }
    .header-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.25rem; align-items: center; }
    .btn-edit { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; &:hover { background: var(--surface-2); border-color: var(--primary); color: var(--primary); } }

    .tabs {
      display: flex; gap: 0; border-bottom: 2px solid var(--border);
      margin-bottom: 1.25rem;
    }
    .tab-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.625rem 1rem; background: none; border: none;
      font-size: 0.875rem; font-weight: 500; color: var(--text-muted);
      cursor: pointer; border-bottom: 2px solid transparent;
      margin-bottom: -2px; transition: color 0.15s;
      &:hover { color: var(--text); }
      &.active { color: var(--primary); border-bottom-color: var(--primary); }
    }
    .tab-count {
      background: var(--surface-3); color: var(--text-muted);
      border-radius: 9999px; padding: 0 0.375rem;
      font-size: 0.75rem;
    }
    .tab-btn.active .tab-count { background: var(--primary-soft-bg-2); color: var(--primary-strong); }

    .tab-content {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 0.75rem; padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .empty-text { color: var(--text-subtle); font-size: 0.875rem; text-align: center; padding: 2rem; }

    .info-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.25rem;
    }
    .info-item {
      display: flex; flex-direction: column; gap: 0.25rem;
      label { font-size: 0.75rem; font-weight: 600; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; }
      span { font-size: 0.875rem; color: var(--text-strong); }
    }

    .data-table {
      width: 100%; border-collapse: collapse;
      th {
        background: var(--surface-2); padding: 0.625rem 0.75rem;
        text-align: left; font-size: 0.75rem; font-weight: 600;
        color: var(--text-muted); text-transform: uppercase;
        border-bottom: 1px solid var(--border);
      }
      td {
        padding: 0.75rem; font-size: 0.875rem; color: var(--text);
        border-bottom: 1px solid var(--surface-3);
      }
      tr:last-child td { border-bottom: none; }
    }
    .link { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } }

    .role-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .role-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1rem; background: var(--surface-2);
      border: 1px solid var(--border); border-radius: 0.5rem;
      font-size: 0.875rem; font-weight: 500; color: var(--text);
      i { color: var(--indigo); }
    }
    .role-code {
      margin-left: auto; font-size: 0.75rem;
      background: var(--indigo-soft-bg); color: var(--indigo-strong);
      padding: 0.125rem 0.5rem; border-radius: 9999px;
    }

    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary) !important; color: var(--surface) !important; &:not(:disabled):hover { background: var(--primary-hover) !important; } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--surface-3); } }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); flex-shrink: 0; h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; font-size: 1rem; &:hover { color: var(--text); } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; flex: 1; min-height: 0; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: var(--text); } input { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; &:focus { outline: none; border-color: var(--primary); } } }
    .input-error { border-color: var(--danger) !important; }
    .field-error { font-size: 0.75rem; color: var(--danger); }
    .req { color: var(--danger); }
    .alert-error { padding: 0.75rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.375rem; color: var(--danger-soft-text); font-size: 0.8125rem; }
  `]
})
export class PeopleDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  person = signal<PersonDetail | null>(null);
  loading = signal(true);
  activeTab = signal<'info' | 'teams' | 'roles'>('info');

  showStatusModal = signal(false);
  statusSaving = signal(false);
  statusError = signal('');
  statusForm = { newStatus: '0', terminationDate: '', terminationReason: '' };

  openStatusChange() {
    const p = this.person()!;
    this.statusForm = { newStatus: String(p.employmentStatus), terminationDate: '', terminationReason: '' };
    this.statusError.set('');
    this.showStatusModal.set(true);
  }

  saveStatusChange() {
    this.statusSaving.set(true);
    this.statusError.set('');
    const id = this.route.snapshot.paramMap.get('id');
    const newStatus = +this.statusForm.newStatus;
    const needsTermination = newStatus === 2 || newStatus === 3;
    this.http.patch(`${environment.apiUrl}/people/${id}/employment-status`, {
      newStatus,
      terminationDate: needsTermination && this.statusForm.terminationDate ? this.statusForm.terminationDate : null,
      terminationReason: needsTermination && this.statusForm.terminationReason.trim() ? this.statusForm.terminationReason.trim() : null
    }).subscribe({
      next: () => {
        this.statusSaving.set(false);
        this.showStatusModal.set(false);
        this.http.get<PersonDetail>(`${environment.apiUrl}/people/${id}`).subscribe(p => this.person.set(p));
      },
      error: err => {
        this.statusSaving.set(false);
        this.statusError.set(err.error?.detail ?? 'Durum güncellenemedi');
      }
    });
  }

  showEditModal = signal(false);
  editSaving = signal(false);
  editSubmitted = signal(false);
  editError = signal('');
  editForm = { firstName: '', lastName: '', title: '', phone: '', hireDate: '' };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<PersonDetail>(`${environment.apiUrl}/people/${id}`).subscribe({
      next: p => { this.person.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openEdit() {
    const p = this.person()!;
    this.editForm = {
      firstName: p.firstName,
      lastName: p.lastName,
      title: p.title ?? '',
      phone: p.phone ?? '',
      hireDate: p.hireDate ? p.hireDate.slice(0, 10) : ''
    };
    this.editSubmitted.set(false);
    this.editError.set('');
    this.showEditModal.set(true);
  }

  saveEdit() {
    this.editSubmitted.set(true);
    if (!this.editForm.firstName.trim() || !this.editForm.lastName.trim()) return;
    this.editSaving.set(true);
    this.editError.set('');
    const id = this.route.snapshot.paramMap.get('id');
    this.http.patch(`${environment.apiUrl}/people/${id}`, {
      firstName: this.editForm.firstName.trim(),
      lastName: this.editForm.lastName.trim(),
      title: this.editForm.title.trim() || null,
      phone: this.editForm.phone.trim() || null,
      hireDate: this.editForm.hireDate || null
    }).subscribe({
      next: () => {
        this.editSaving.set(false);
        this.showEditModal.set(false);
        this.http.get<PersonDetail>(`${environment.apiUrl}/people/${id}`).subscribe(p => this.person.set(p));
      },
      error: err => {
        this.editSaving.set(false);
        this.editError.set(err.error?.detail ?? 'Güncelleme başarısız');
      }
    });
  }

  statusLabel(s: number) { return STATUS_LABELS[s] ?? s; }
  statusCss(s: number) { return STATUS_CSS[s] ?? ''; }
}
