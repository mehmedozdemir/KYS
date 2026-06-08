import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface TeamDetail {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  members: TeamMember[];
}

interface TeamMember {
  membershipId: string;  // from MembershipId
  personId: string;
  personName: string;
  personEmail: string;
  organizationRoleId: string;
  organizationRoleName: string;
  startDate: string;
  endDate: string | null;
}

// C# DateOnly serializes as "YYYY-MM-DD" string in JSON

interface OrganizationRole {
  id: string;
  name: string;
}

interface PersonOption {
  id: string;
  name: string;
  email: string;
}

interface PersonListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AddMemberRequest {
  personId: string;
  organizationRoleId: string;
  startDate: string;
}

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [RouterLink, NgClass, DatePipe, FormsModule],
  template: `
    <div class="page-content">
      @if (loading()) {
        <div class="loading-state">Yükleniyor...</div>
      } @else if (!team()) {
        <div class="loading-state">Ekip bulunamadı. <a routerLink="/teams">← Geri dön</a></div>
      } @else {
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a routerLink="/teams">Ekipler</a>
          <span>/</span>
          <span>{{ team()!.name }}</span>
        </div>

        <!-- Header -->
        <div class="header-card">
          <div class="header-main">
            <div class="team-avatar">{{ team()!.name[0] }}</div>
            <div>
              <div class="name-row">
                <h1>{{ team()!.name }}</h1>
                @if (team()!.code) {
                  <span class="code-badge">{{ team()!.code }}</span>
                }
              </div>
              <p class="header-desc">{{ team()!.description ?? 'Açıklama eklenmemiş' }}</p>
            </div>
          </div>
          <span class="badge" [ngClass]="team()!.isActive ? 'badge--active' : 'badge--archived'">
            {{ team()!.isActive ? 'Aktif' : 'Pasif' }}
          </span>
        </div>

        <!-- Members section -->
        <div class="section-header">
          <h2>Üyeler <span class="count">{{ activeMembers().length }}</span></h2>
          <button class="btn btn-primary" (click)="openAddMember()">
            <i class="pi pi-user-plus"></i> Üye Ekle
          </button>
        </div>

        <div class="table-wrapper">
          @if (!team()!.members.length) {
            <div class="empty-state">Henüz üye eklenmemiş.</div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Kişi</th>
                  <th>Organizasyon Rolü</th>
                  <th>Başlangıç</th>
                  <th>Bitiş</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (m of team()!.members; track m.membershipId) {
                  <tr [class.inactive-row]="!!m.endDate">
                    <td class="person-cell">
                      <div class="avatar">{{ m.personName[0] }}</div>
                      <div>
                        <a [routerLink]="['/people', m.personId]" class="person-name">{{ m.personName }}</a>
                        <p class="person-email">{{ m.personEmail }}</p>
                      </div>
                    </td>
                    <td>{{ m.organizationRoleName }}</td>
                    <td>{{ m.startDate | date:'dd.MM.yyyy' }}</td>
                    <td>
                      @if (m.endDate) {
                        {{ m.endDate | date:'dd.MM.yyyy' }}
                      } @else {
                        <span class="badge badge--active">Devam ediyor</span>
                      }
                    </td>
                    <td>
                      @if (!m.endDate) {
                        <button type="button" class="btn-end" (click)="openEndMembership(m)">Bitir</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </div>

    <!-- End Membership Modal -->
    @if (showEndModal()) {
      <div class="modal-backdrop" (click)="closeEndModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Üyeliği Bitir</h2>
            <button type="button" class="close-btn" (click)="closeEndModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (endError()) {
              <div class="alert-error">{{ endError() }}</div>
            }
            <p class="end-confirm-text">
              <strong>{{ endingMember()?.personName }}</strong> adlı kişinin ekip üyeliği bitirilecek.
            </p>
            <div class="form-group">
              <label>Bitiş Tarihi <span class="required">*</span></label>
              <input type="date" [(ngModel)]="endDate" [class.input-error]="endSubmitted() && !endDate" />
              @if (endSubmitted() && !endDate) {
                <span class="field-error">Bitiş tarihi zorunludur</span>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeEndModal()">İptal</button>
            <button type="button" class="btn btn-danger" [disabled]="endSaving()" (click)="endMembership()">
              {{ endSaving() ? 'Kaydediliyor...' : 'Üyeliği Bitir' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Add Member Modal -->
    @if (showAddModal()) {
      <div class="modal-backdrop" (click)="closeAddModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Üye Ekle</h2>
            <button class="close-btn" (click)="closeAddModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (addError()) {
              <div class="alert-error">{{ addError() }}</div>
            }

            <!-- Person search -->
            <div class="form-group">
              <label>Kişi <span class="required">*</span></label>
              <input
                type="text"
                placeholder="İsim veya e-posta ara..."
                [(ngModel)]="personSearch"
                (ngModelChange)="searchPeople($event)"
              />
              @if (addSubmitted() && !addForm.personId) {
                <span class="field-error">Kişi seçimi zorunludur</span>
              }
              @if (personOptions().length > 0) {
                <div class="dropdown">
                  @for (p of personOptions(); track p.id) {
                    <div class="dropdown-item" (click)="selectPerson(p)">
                      <span class="di-name">{{ p.name }}</span>
                      <span class="di-email">{{ p.email }}</span>
                    </div>
                  }
                </div>
              }
              @if (addForm.personId) {
                <div class="selected-person">
                  <i class="pi pi-check-circle"></i> {{ selectedPersonName() }}
                </div>
              }
            </div>

            <div class="form-group">
              <label>Organizasyon Rolü <span class="required">*</span></label>
              <select [(ngModel)]="addForm.organizationRoleId">
                <option value="">Rol seçin</option>
                @for (r of orgRoles(); track r.id) {
                  <option [value]="r.id">{{ r.name }}</option>
                }
              </select>
              @if (addSubmitted() && !addForm.organizationRoleId) {
                <span class="field-error">Rol seçimi zorunludur</span>
              }
            </div>

            <div class="form-group">
              <label>Başlangıç Tarihi <span class="required">*</span></label>
              <input type="date" [(ngModel)]="addForm.startDate" />
              @if (addSubmitted() && !addForm.startDate) {
                <span class="field-error">Başlangıç tarihi zorunludur</span>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAddModal()">İptal</button>
            <button class="btn btn-primary" [disabled]="addSaving()" (click)="addMember()">
              {{ addSaving() ? 'Ekleniyor...' : 'Ekle' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-state { text-align: center; padding: 4rem; color: #9CA3AF; }
    .breadcrumb {
      display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6B7280; margin-bottom: 1.25rem;
      a { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } }
    }

    .header-card {
      background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1.5rem;
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); flex-wrap: wrap;
    }
    .header-main { display: flex; align-items: center; gap: 1rem; }
    .team-avatar {
      width: 3rem; height: 3rem; border-radius: 0.5rem;
      background: #E0E7FF; color: #4F46E5;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: 700; flex-shrink: 0;
    }
    h1 { font-size: 1.25rem; font-weight: 700; color: #111827; }
    .name-row { display: flex; align-items: center; gap: 0.625rem; }
    .code-badge { display: inline-flex; align-items: center; padding: 0.1875rem 0.5rem; background: #EEF2FF; color: #4F46E5; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; }
    .header-desc { font-size: 0.875rem; color: #6B7280; margin-top: 0.125rem; }

    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .section-header h2 { font-size: 1rem; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 0.5rem; }
    .count { background: #F3F4F6; color: #6B7280; padding: 0 0.5rem; border-radius: 9999px; font-size: 0.8125rem; font-weight: 500; }

    .table-wrapper { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-state { padding: 3rem; text-align: center; color: #9CA3AF; font-size: 0.875rem; }
    .data-table {
      width: 100%; border-collapse: collapse;
      th { background: #F9FAFB; padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; }
      td { padding: 0.75rem; font-size: 0.875rem; color: #374151; border-bottom: 1px solid #F3F4F6; }
      tr:last-child td { border-bottom: none; }
    }
    .inactive-row td { opacity: 0.55; }
    .person-cell { display: flex; align-items: center; gap: 0.625rem; }
    .avatar { width: 2rem; height: 2rem; border-radius: 50%; background: #EEF2FF; color: #4F46E5; display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 700; flex-shrink: 0; }
    .person-name { font-weight: 500; color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } }
    .person-email { font-size: 0.75rem; color: #9CA3AF; }

    .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--active { background: #D1FAE5; color: #065F46; }
    .badge--archived { background: #F3F4F6; color: #6B7280; }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: opacity 0.15s; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: #3B82F6; color: white; &:not(:disabled):hover { background: #2563EB; } }
    .btn-secondary { background: white; color: #374151; border: 1px solid #D1D5DB; &:hover { background: #F3F4F6; } }

    .btn-end { background: none; border: 1px solid #FECACA; color: #DC2626; border-radius: 0.375rem; padding: 0.25rem 0.625rem; font-size: 0.75rem; font-weight: 500; cursor: pointer; &:hover { background: #FEF2F2; } }
    .end-confirm-text { font-size: 0.875rem; color: #374151; background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 0.5rem; padding: 0.75rem; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 0.75rem; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E5E7EB; flex-shrink: 0; h2 { font-size: 1.125rem; font-weight: 700; color: #111827; } }
    .close-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 0.25rem; font-size: 1rem; &:hover { color: #374151; } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; flex: 1; min-height: 0; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0; }
    .btn-danger { background: #DC2626 !important; color: white !important; &:not(:disabled):hover { background: #B91C1C !important; } }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; position: relative; label { font-size: 0.875rem; font-weight: 500; color: #374151; } input, select { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; &:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); } } }
    .input-error { border-color: #EF4444 !important; }
    .required { color: #EF4444; }
    .field-error { font-size: 0.75rem; color: #EF4444; }
    .alert-error { padding: 0.75rem 1rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 0.5rem; color: #991B1B; font-size: 0.875rem; }

    .dropdown {
      position: absolute; top: 100%; left: 0; right: 0; background: white;
      border: 1px solid #E5E7EB; border-radius: 0.5rem; z-index: 10;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12); max-height: 200px; overflow-y: auto; margin-top: 2px;
    }
    .dropdown-item { padding: 0.625rem 0.75rem; cursor: pointer; display: flex; flex-direction: column; gap: 0.125rem; &:hover { background: #F3F4F6; } }
    .di-name { font-size: 0.875rem; font-weight: 500; color: #111827; }
    .di-email { font-size: 0.75rem; color: #9CA3AF; }
    .selected-person { font-size: 0.8125rem; color: #059669; display: flex; align-items: center; gap: 0.375rem; }
  `]
})
export class TeamDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  team = signal<TeamDetail | null>(null);
  loading = signal(true);
  orgRoles = signal<OrganizationRole[]>([]);

  showAddModal = signal(false);
  addSaving = signal(false);
  addSubmitted = signal(false);
  addError = signal('');
  personSearch = '';
  personOptions = signal<PersonOption[]>([]);
  selectedPersonName = signal('');
  addForm: AddMemberRequest = { personId: '', organizationRoleId: '', startDate: '' };

  showEndModal = signal(false);
  endSaving = signal(false);
  endSubmitted = signal(false);
  endError = signal('');
  endDate = '';
  endingMember = signal<TeamMember | null>(null);

  openEndMembership(m: TeamMember) {
    this.endingMember.set(m);
    this.endDate = new Date().toISOString().slice(0, 10);
    this.endSubmitted.set(false);
    this.endError.set('');
    this.showEndModal.set(true);
  }

  closeEndModal() { this.showEndModal.set(false); }

  endMembership() {
    this.endSubmitted.set(true);
    if (!this.endDate) return;
    this.endSaving.set(true);
    this.endError.set('');
    const teamId = this.route.snapshot.paramMap.get('id');
    const personId = this.endingMember()!.personId;
    this.http.delete(`${environment.apiUrl}/teams/${teamId}/members/${personId}?endDate=${this.endDate}`).subscribe({
      next: () => {
        this.endSaving.set(false);
        this.closeEndModal();
        this.http.get<TeamDetail>(`${environment.apiUrl}/teams/${teamId}`).subscribe(t => this.team.set(t));
      },
      error: err => {
        this.endSaving.set(false);
        this.endError.set(err.error?.detail ?? 'Üyelik sonlandırılamadı');
      }
    });
  }

  activeMembers() {
    return (this.team()?.members ?? []).filter(m => !m.endDate);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<TeamDetail>(`${environment.apiUrl}/teams/${id}`).subscribe({
      next: t => { this.team.set(t); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.http.get<OrganizationRole[]>(`${environment.apiUrl}/organization-roles`).subscribe({
      next: r => this.orgRoles.set(r)
    });
  }

  openAddMember() {
    this.addForm = { personId: '', organizationRoleId: '', startDate: new Date().toISOString().slice(0, 10) };
    this.personSearch = '';
    this.personOptions.set([]);
    this.selectedPersonName.set('');
    this.addSubmitted.set(false);
    this.addError.set('');
    this.showAddModal.set(true);
  }

  closeAddModal() { this.showAddModal.set(false); }

  searchPeople(query: string) {
    if (!query.trim()) { this.personOptions.set([]); return; }
    this.http.get<{ items: PersonListItem[] }>(`${environment.apiUrl}/people?search=${encodeURIComponent(query)}&pageSize=10`).subscribe({
      next: r => this.personOptions.set(r.items.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, email: p.email }))),
      error: () => this.personOptions.set([])
    });
  }

  selectPerson(p: PersonOption) {
    this.addForm.personId = p.id;
    this.selectedPersonName.set(p.name);
    this.personSearch = '';
    this.personOptions.set([]);
  }

  addMember() {
    this.addSubmitted.set(true);
    if (!this.addForm.personId || !this.addForm.organizationRoleId || !this.addForm.startDate) return;
    this.addSaving.set(true);
    this.addError.set('');
    const teamId = this.route.snapshot.paramMap.get('id');
    this.http.post(`${environment.apiUrl}/teams/${teamId}/members`, this.addForm).subscribe({
      next: () => {
        this.addSaving.set(false);
        this.closeAddModal();
        this.http.get<TeamDetail>(`${environment.apiUrl}/teams/${teamId}`).subscribe(t => this.team.set(t));
      },
      error: err => {
        this.addSaving.set(false);
        this.addError.set(err.error?.detail ?? 'Üye eklenemedi');
      }
    });
  }
}
