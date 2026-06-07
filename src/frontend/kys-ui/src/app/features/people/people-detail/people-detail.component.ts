import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
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
  imports: [RouterLink, NgClass, DatePipe],
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
  `,
  styles: [`
    .loading-state { text-align: center; padding: 4rem; color: #9CA3AF; }
    .breadcrumb {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.875rem; color: #6B7280;
      margin-bottom: 1.25rem;
      a { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } }
    }

    .header-card {
      background: white; border: 1px solid #E5E7EB;
      border-radius: 0.75rem; padding: 1.5rem;
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      flex-wrap: wrap;
    }
    .header-main { display: flex; align-items: center; gap: 1rem; }
    .big-avatar {
      width: 3.5rem; height: 3.5rem;
      background: #EEF2FF; color: #4F46E5;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 1.125rem; font-weight: 700; flex-shrink: 0;
    }
    .header-info h1 { font-size: 1.25rem; font-weight: 700; color: #111827; }
    .header-title { font-size: 0.875rem; color: #6B7280; margin: 0.125rem 0; }
    .header-meta {
      display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.375rem;
      span { font-size: 0.8125rem; color: #6B7280; display: flex; align-items: center; gap: 0.375rem; }
      i { font-size: 0.75rem; }
    }
    .header-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.25rem; }

    .tabs {
      display: flex; gap: 0; border-bottom: 2px solid #E5E7EB;
      margin-bottom: 1.25rem;
    }
    .tab-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.625rem 1rem; background: none; border: none;
      font-size: 0.875rem; font-weight: 500; color: #6B7280;
      cursor: pointer; border-bottom: 2px solid transparent;
      margin-bottom: -2px; transition: color 0.15s;
      &:hover { color: #374151; }
      &.active { color: #3B82F6; border-bottom-color: #3B82F6; }
    }
    .tab-count {
      background: #F3F4F6; color: #6B7280;
      border-radius: 9999px; padding: 0 0.375rem;
      font-size: 0.75rem;
    }
    .tab-btn.active .tab-count { background: #DBEAFE; color: #1D4ED8; }

    .tab-content {
      background: white; border: 1px solid #E5E7EB;
      border-radius: 0.75rem; padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .empty-text { color: #9CA3AF; font-size: 0.875rem; text-align: center; padding: 2rem; }

    .info-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.25rem;
    }
    .info-item {
      display: flex; flex-direction: column; gap: 0.25rem;
      label { font-size: 0.75rem; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; }
      span { font-size: 0.875rem; color: #111827; }
    }

    .data-table {
      width: 100%; border-collapse: collapse;
      th {
        background: #F9FAFB; padding: 0.625rem 0.75rem;
        text-align: left; font-size: 0.75rem; font-weight: 600;
        color: #6B7280; text-transform: uppercase;
        border-bottom: 1px solid #E5E7EB;
      }
      td {
        padding: 0.75rem; font-size: 0.875rem; color: #374151;
        border-bottom: 1px solid #F3F4F6;
      }
      tr:last-child td { border-bottom: none; }
    }
    .link { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } }

    .role-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .role-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1rem; background: #F9FAFB;
      border: 1px solid #E5E7EB; border-radius: 0.5rem;
      font-size: 0.875rem; font-weight: 500; color: #374151;
      i { color: #6366F1; }
    }
    .role-code {
      margin-left: auto; font-size: 0.75rem;
      background: #EEF2FF; color: #4F46E5;
      padding: 0.125rem 0.5rem; border-radius: 9999px;
    }
  `]
})
export class PeopleDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  person = signal<PersonDetail | null>(null);
  loading = signal(true);
  activeTab = signal<'info' | 'teams' | 'roles'>('info');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<PersonDetail>(`${environment.apiUrl}/people/${id}`).subscribe({
      next: p => { this.person.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  statusLabel(s: number) { return STATUS_LABELS[s] ?? s; }
  statusCss(s: number) { return STATUS_CSS[s] ?? ''; }
}
