import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface EnvType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
}

@Component({
  selector: 'app-environment-types',
  standalone: true,
  imports: [RouterLink, NgStyle, FormsModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <div class="breadcrumb"><a routerLink="/admin">Admin</a><span>/</span><span>Ortam Tipleri</span></div>
          <h1 class="page-title">Ortam Tipleri</h1>
          <p class="page-subtitle">Development, Test, UAT, Production gibi ortam tiplerini tanımlayın</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <i class="pi pi-plus"></i> Yeni Tip
        </button>
      </div>

      @if (loading()) {
        <div class="empty-state">Yükleniyor...</div>
      } @else if (!types().length) {
        <div class="empty-state">Henüz ortam tipi tanımlanmamış.</div>
      } @else {
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Renk</th>
                <th>Ad</th>
                <th>Kod</th>
                <th>Açıklama</th>
                <th>Sıra</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (t of types(); track t.id) {
                <tr>
                  <td>
                    <div class="color-dot" [ngStyle]="{ background: t.color ?? '#6B7280' }"></div>
                  </td>
                  <td class="name-cell">{{ t.name }}</td>
                  <td><code class="mono">{{ t.code }}</code></td>
                  <td class="text-muted">{{ t.description ?? '—' }}</td>
                  <td class="text-muted">{{ t.sortOrder }}</td>
                  <td class="actions-cell">
                    <button class="btn-icon" title="Düzenle" (click)="openEdit(t)">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="btn-icon btn-icon--danger" title="Sil" (click)="confirmDelete(t)">
                      <i class="pi pi-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Create / Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? 'Ortam Tipini Düzenle' : 'Yeni Ortam Tipi' }}</h2>
            <button class="close-btn" (click)="closeModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (saveError()) {
              <div class="alert-error">{{ saveError() }}</div>
            }
            <div class="form-row">
              <div class="form-group">
                <label>Ad <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.name" placeholder="ör. Production"
                  [class.input-error]="submitted() && !form.name.trim()" />
                @if (submitted() && !form.name.trim()) {
                  <span class="field-error">Ad zorunludur</span>
                }
              </div>
              <div class="form-group">
                <label>Kod <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.code" placeholder="ör. PROD" maxlength="20"
                  (input)="form.code = form.code.toUpperCase()"
                  [class.input-error]="submitted() && !form.code.trim()" />
                @if (submitted() && !form.code.trim()) {
                  <span class="field-error">Kod zorunludur</span>
                }
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Renk</label>
                <div class="color-input-row">
                  <input type="color" [(ngModel)]="form.color" class="color-picker" />
                  <input type="text" [(ngModel)]="form.color" placeholder="#3B82F6" maxlength="7" class="color-text" />
                </div>
              </div>
              <div class="form-group">
                <label>Sıra</label>
                <input type="number" [(ngModel)]="form.sortOrder" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Açıklama</label>
              <input type="text" [(ngModel)]="form.description" placeholder="İsteğe bağlı" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">İptal</button>
            <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
              {{ saving() ? 'Kaydediliyor...' : (editingId() ? 'Güncelle' : 'Oluştur') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirm Modal -->
    @if (deletingType()) {
      <div class="modal-backdrop" (click)="deletingType.set(null)">
        <div class="modal modal--sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Ortam Tipini Sil</h2>
            <button class="close-btn" (click)="deletingType.set(null)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (deleteError()) {
              <div class="alert-error">{{ deleteError() }}</div>
            } @else {
              <p class="confirm-text">
                <strong>{{ deletingType()!.name }}</strong> ortam tipini silmek istediğinize emin misiniz?
                Bu işlem geri alınamaz.
              </p>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="deletingType.set(null)">İptal</button>
            @if (!deleteError()) {
              <button class="btn btn-danger" [disabled]="deleting()" (click)="deleteConfirmed()">
                {{ deleting() ? 'Siliniyor...' : 'Sil' }}
              </button>
            }
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

    .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-subtle); font-size: 0.875rem; }
    .data-table { width: 100%; border-collapse: collapse;
      th { background: var(--surface-2); padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); }
      td { padding: 0.75rem; font-size: 0.875rem; color: var(--text); border-bottom: 1px solid var(--surface-3); }
      tr:last-child td { border-bottom: none; }
    }
    .color-dot { width: 1.25rem; height: 1.25rem; border-radius: 50%; }
    .name-cell { font-weight: 500; color: var(--text-strong); }
    .mono { font-family: monospace; font-size: 0.8125rem; background: var(--surface-3); padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
    .text-muted { color: var(--text-subtle); font-size: 0.8125rem; }
    .actions-cell { text-align: right; white-space: nowrap; }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary); color: white; &:not(:disabled):hover { background: var(--primary-hover); } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--surface-3); } }
    .btn-danger { background: var(--danger); color: white; &:not(:disabled):hover { background: var(--danger-strong); } }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 0.375rem; border-radius: 0.375rem; color: var(--text-muted); font-size: 0.875rem; &:hover { background: var(--surface-3); color: var(--text); } }
    .btn-icon--danger { &:hover { background: var(--danger-faint-bg); color: var(--danger); } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal--sm { max-width: 400px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; font-size: 1rem; &:hover { color: var(--text); } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: var(--text); } input { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; &:focus { outline: none; border-color: var(--primary); } } }
    .color-input-row { display: flex; gap: 0.5rem; align-items: center; }
    .color-picker { width: 3rem; height: 2.25rem; padding: 0.125rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; cursor: pointer; }
    .color-text { flex: 1; }
    .input-error { border-color: var(--danger) !important; }
    .req { color: var(--danger); }
    .field-error { font-size: 0.75rem; color: var(--danger); }
    .alert-error { padding: 0.75rem 1rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.5rem; color: var(--danger-soft-text); font-size: 0.875rem; }
    .confirm-text { font-size: 0.9375rem; color: var(--text); line-height: 1.5; margin: 0; }
  `]
})
export class EnvironmentTypesComponent implements OnInit {
  private http = inject(HttpClient);

  types = signal<EnvType[]>([]);
  loading = signal(true);

  showModal = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  submitted = signal(false);
  saveError = signal('');
  form = { name: '', code: '', description: '', color: '#3B82F6', sortOrder: 0 };

  deletingType = signal<EnvType | null>(null);
  deleting = signal(false);
  deleteError = signal('');

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<EnvType[]>(`${environment.apiUrl}/environments/types`).subscribe({
      next: t => { this.types.set(t); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { name: '', code: '', description: '', color: '#3B82F6', sortOrder: this.types().length + 1 };
    this.submitted.set(false);
    this.saveError.set('');
    this.showModal.set(true);
  }

  openEdit(t: EnvType) {
    this.editingId.set(t.id);
    this.form = { name: t.name, code: t.code, description: t.description ?? '', color: t.color ?? '#3B82F6', sortOrder: t.sortOrder };
    this.submitted.set(false);
    this.saveError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    this.submitted.set(true);
    if (!this.form.name.trim() || !this.form.code.trim()) return;
    this.saving.set(true);
    this.saveError.set('');

    const payload = {
      name: this.form.name.trim(),
      code: this.form.code.trim().toUpperCase(),
      description: this.form.description.trim() || null,
      color: this.form.color || null,
      sortOrder: Number(this.form.sortOrder)
    };

    const id = this.editingId();
    const req = id
      ? this.http.put(`${environment.apiUrl}/admin/environment-types/${id}`, payload)
      : this.http.post(`${environment.apiUrl}/admin/environment-types`, payload);

    req.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: err => { this.saving.set(false); this.saveError.set(err.error?.detail ?? 'Kaydedilemedi'); }
    });
  }

  confirmDelete(t: EnvType) {
    this.deleteError.set('');
    this.deletingType.set(t);
  }

  deleteConfirmed() {
    const t = this.deletingType();
    if (!t) return;
    this.deleting.set(true);
    this.http.delete(`${environment.apiUrl}/admin/environment-types/${t.id}`).subscribe({
      next: () => { this.deleting.set(false); this.deletingType.set(null); this.load(); },
      error: err => { this.deleting.set(false); this.deleteError.set(err.error?.detail ?? 'Silinemedi'); }
    });
  }
}
