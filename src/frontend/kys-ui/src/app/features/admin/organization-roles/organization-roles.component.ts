import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../core/services/notification.service';

interface OrgRole {
  id: string;
  name: string;
  description: string | null;
  activeMemberCount: number;
}

// Ekip üyeliklerinde seçilen organizasyon rolleri (ör. "Mobil Geliştirici", "Veri Mühendisi").
@Component({
  selector: 'app-organization-roles',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <div class="breadcrumb"><span>{{ 'menu.definitions' | transloco }}</span><span>/</span><span>{{ 'admin.orgRoles.title' | transloco }}</span></div>
          <h1 class="page-title">{{ 'admin.orgRoles.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'admin.orgRoles.subtitle' | transloco }}</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()"><i class="pi pi-plus"></i> {{ 'admin.orgRoles.new' | transloco }}</button>
      </div>

      <div class="table-wrapper">
        @if (loading()) {
          <div class="empty-state">{{ 'common.loading' | transloco }}</div>
        } @else if (!roles().length) {
          <div class="empty-state">{{ 'admin.orgRoles.empty' | transloco }}</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'admin.orgRoles.name' | transloco }}</th>
                <th>{{ 'admin.orgRoles.description' | transloco }}</th>
                <th>{{ 'admin.orgRoles.activeMembers' | transloco }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of roles(); track r.id) {
                <tr>
                  <td class="name-cell">{{ r.name }}</td>
                  <td class="text-muted">{{ r.description ?? '—' }}</td>
                  <td>{{ r.activeMemberCount }}</td>
                  <td class="actions-cell">
                    <button class="btn-icon" [title]="'common.edit' | transloco" [attr.aria-label]="'common.edit' | transloco" (click)="openEdit(r)"><i class="pi pi-pencil"></i></button>
                    <button class="btn-icon btn-icon--danger" [disabled]="r.activeMemberCount > 0"
                      [title]="(r.activeMemberCount > 0 ? 'admin.orgRoles.inUseHint' : 'common.delete') | transloco"
                      [attr.aria-label]="'common.delete' | transloco" (click)="remove(r)"><i class="pi pi-trash"></i></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-backdrop" (click)="showModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ (editingId() ? 'admin.orgRoles.edit' : 'admin.orgRoles.new') | transloco }}</h2>
            <button class="close-btn" (click)="showModal.set(false)" [attr.aria-label]="'common.close' | transloco"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (error()) { <div class="alert-error">{{ error() }}</div> }
            <div class="form-group">
              <label>{{ 'admin.orgRoles.name' | transloco }} <span class="req">*</span></label>
              <input type="text" [(ngModel)]="form.name" maxlength="100" [class.input-error]="submitted() && !form.name.trim()"
                [placeholder]="'admin.orgRoles.namePh' | transloco" />
              @if (submitted() && !form.name.trim()) { <span class="field-error">{{ 'common.required' | transloco }}</span> }
            </div>
            <div class="form-group">
              <label>{{ 'admin.orgRoles.description' | transloco }}</label>
              <textarea rows="2" [(ngModel)]="form.description" maxlength="500"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showModal.set(false)">{{ 'common.cancel' | transloco }}</button>
            <button class="btn btn-primary" [disabled]="saving()" (click)="save()">{{ (saving() ? 'common.saving' : 'common.save') | transloco }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.375rem; span:last-child { color: var(--text); } }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }
    .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-subtle); font-size: 0.875rem; }
    .data-table { width: 100%; border-collapse: collapse;
      th { background: var(--surface-2); padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); }
      td { padding: 0.75rem; font-size: 0.875rem; color: var(--text); border-bottom: 1px solid var(--surface-3); }
      tr:last-child td { border-bottom: none; } }
    .name-cell { font-weight: 500; color: var(--text-strong); }
    .text-muted { color: var(--text-subtle); font-size: 0.8125rem; }
    .actions-cell { text-align: right; white-space: nowrap; }
    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary); color: white; &:not(:disabled):hover { background: var(--primary-hover); } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--surface-3); } }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 0.375rem; border-radius: 0.375rem; color: var(--text-muted); font-size: 0.875rem; &:hover:not(:disabled) { background: var(--surface-3); color: var(--text); } &:disabled { opacity: 0.35; cursor: not-allowed; } }
    .btn-icon--danger { &:hover:not(:disabled) { background: var(--danger-faint-bg); color: var(--danger); } }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; font-size: 1rem; &:hover { color: var(--text); } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: var(--text); }
      input, textarea { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; font-family: inherit; } }
    .input-error { border-color: var(--danger) !important; }
    .req { color: var(--danger); }
    .field-error { font-size: 0.75rem; color: var(--danger); }
    .alert-error { padding: 0.75rem 1rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.5rem; color: var(--danger-soft-text); font-size: 0.875rem; }
  `]
})
export class OrganizationRolesComponent implements OnInit {
  private http = inject(HttpClient);
  private transloco = inject(TranslocoService);
  private confirmDialog = inject(ConfirmDialogService);
  private notifications = inject(NotificationService);
  private readonly base = `${environment.apiUrl}/organization-roles`;

  roles = signal<OrgRole[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  submitted = signal(false);
  error = signal('');
  form = { name: '', description: '' };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<OrgRole[]>(this.base).subscribe({
      next: r => { this.roles.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { name: '', description: '' };
    this.submitted.set(false);
    this.error.set('');
    this.showModal.set(true);
  }

  openEdit(r: OrgRole) {
    this.editingId.set(r.id);
    this.form = { name: r.name, description: r.description ?? '' };
    this.submitted.set(false);
    this.error.set('');
    this.showModal.set(true);
  }

  save() {
    this.submitted.set(true);
    if (!this.form.name.trim()) return;
    this.saving.set(true);
    this.error.set('');
    const body = { name: this.form.name.trim(), description: this.form.description.trim() || null };
    const id = this.editingId();
    const req = id ? this.http.put(`${this.base}/${id}`, body) : this.http.post(this.base, body);
    req.subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.load(); },
      error: err => { this.saving.set(false); this.error.set(err.error?.detail ?? this.transloco.translate('admin.orgRoles.saveError')); }
    });
  }

  async remove(r: OrgRole) {
    if (!(await this.confirmDialog.ask(this.transloco.translate('admin.orgRoles.deleteConfirm', { name: r.name })))) return;
    this.http.delete(`${this.base}/${r.id}`).subscribe({
      next: () => this.load(),
      error: err => this.notifications.error(err.error?.detail ?? this.transloco.translate('admin.orgRoles.deleteError'))
    });
  }
}
