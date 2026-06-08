import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface SharedResource {
  id: string;
  name: string;
  description: string | null;
  resourceTypeName: string;
  resourceTypeCode: string;
  environmentScope: string | null;
}

interface ResourceType {
  id: string;
  name: string;
  code: string;
  category: string | null;
}

@Component({
  selector: 'app-shared-resources',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <div class="breadcrumb">
            <a routerLink="/admin">Admin</a>
            <span>/</span>
            <span>Paylaşımlı Kaynaklar</span>
          </div>
          <h1 class="page-title">Paylaşımlı Kaynaklar</h1>
          <p class="page-subtitle">{{ resources().length }} kayıt</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <i class="pi pi-plus"></i> Yeni Kaynak
        </button>
      </div>

      <div class="filter-bar">
        <select [(ngModel)]="scopeFilter" (ngModelChange)="load()" class="select-input">
          <option value="">Tüm kapsamlar</option>
          <option value="Production">Production</option>
          <option value="Test">Test</option>
          <option value="Staging">Staging</option>
          <option value="Development">Development</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-state">Yükleniyor...</div>
      } @else if (!resources().length) {
        <div class="empty-state">
          <i class="pi pi-database"></i>
          <p>Paylaşımlı kaynak bulunamadı.</p>
        </div>
      } @else {
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Kaynak Adı</th>
                <th>Tip</th>
                <th>Kapsam</th>
                <th>Açıklama</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of resources(); track r.id) {
                <tr>
                  <td>
                    <div class="resource-name">{{ r.name }}</div>
                  </td>
                  <td>
                    <div class="type-cell">
                      <code class="type-code">{{ r.resourceTypeCode }}</code>
                      <span>{{ r.resourceTypeName }}</span>
                    </div>
                  </td>
                  <td>
                    @if (r.environmentScope) {
                      <span class="scope-badge">{{ r.environmentScope }}</span>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td class="text-muted desc-cell">{{ r.description ?? '—' }}</td>
                  <td class="actions-cell">
                    <button class="btn-icon" title="Düzenle" (click)="openEdit(r)">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="btn-icon btn-icon--danger" title="Sil" (click)="deleteResource(r)"
                      [disabled]="deletingId() === r.id">
                      @if (deletingId() === r.id) { <i class="pi pi-spin pi-spinner"></i> }
                      @else { <i class="pi pi-trash"></i> }
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
      <div class="modal-backdrop" (click)="showModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? 'Kaynağı Düzenle' : 'Yeni Paylaşımlı Kaynak' }}</h2>
            <button class="modal-close" (click)="showModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Kaynak Adı <span class="required">*</span></label>
              <input type="text" [(ngModel)]="form.name" placeholder="ör. Prod Redis Cluster" [class.input-error]="submitted() && !form.name.trim()" />
              @if (submitted() && !form.name.trim()) { <span class="error-msg">Ad zorunludur</span> }
            </div>
            @if (!editingId()) {
              <div class="form-group">
                <label>Kaynak Tipi <span class="required">*</span></label>
                <select [(ngModel)]="form.resourceTypeId" [class.input-error]="submitted() && !form.resourceTypeId">
                  <option value="">Tip seçin...</option>
                  @for (t of resourceTypes(); track t.id) {
                    <option [value]="t.id">{{ t.name }}{{ t.category ? ' (' + t.category + ')' : '' }}</option>
                  }
                </select>
                @if (submitted() && !form.resourceTypeId) { <span class="error-msg">Tip zorunludur</span> }
              </div>
            }
            <div class="form-group">
              <label>Ortam Kapsamı</label>
              <select [(ngModel)]="form.environmentScope">
                <option value="">Tüm ortamlar</option>
                <option value="Production">Production</option>
                <option value="Test">Test</option>
                <option value="Staging">Staging</option>
                <option value="Development">Development</option>
              </select>
            </div>
            <div class="form-group">
              <label>Açıklama</label>
              <textarea [(ngModel)]="form.description" rows="2" placeholder="Kısa açıklama..."></textarea>
            </div>
            @if (saveError()) { <div class="alert-error">{{ saveError() }}</div> }
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showModal.set(false)">İptal</button>
            <button class="btn-save" [disabled]="saving()" (click)="save()">
              {{ saving() ? 'Kaydediliyor...' : (editingId() ? 'Güncelle' : 'Oluştur') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6B7280; margin-bottom: 0.25rem; a { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } } }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #111827; }
    .page-subtitle { font-size: 0.875rem; color: #6B7280; margin-top: 0.125rem; }
    .filter-bar { margin-bottom: 1rem; }
    .select-input { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem; background: white; }
    .loading-state { text-align: center; padding: 4rem; color: #9CA3AF; }
    .empty-state { text-align: center; padding: 4rem; color: #9CA3AF; i { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; } }

    .table-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    table { width: 100%; border-collapse: collapse; }
    th { background: #F9FAFB; padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #E5E7EB; }
    td { padding: 0.875rem 1rem; border-bottom: 1px solid #F3F4F6; font-size: 0.875rem; color: #374151; }
    tr:last-child td { border-bottom: none; }
    .resource-name { font-weight: 500; color: #111827; }
    .type-cell { display: flex; align-items: center; gap: 0.5rem; }
    .type-code { background: #F3F4F6; color: #6B7280; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem; }
    .scope-badge { display: inline-flex; padding: 0.2rem 0.5rem; background: #EDE9FE; color: #5B21B6; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .text-muted { color: #9CA3AF; }
    .desc-cell { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .actions-cell { width: 80px; text-align: right; white-space: nowrap; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 0.25rem; border-radius: 0.25rem; &:hover { color: #3B82F6; background: #EFF6FF; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .btn-icon--danger { &:hover { color: #EF4444 !important; background: #FEF2F2 !important; } }
    .btn-primary { display: inline-flex; align-items: center; gap: 0.375rem; background: #3B82F6; color: white; border: none; border-radius: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; &:hover { background: #2563EB; } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 0.75rem; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E5E7EB; h2 { font-size: 1.125rem; font-weight: 700; color: #111827; } }
    .modal-close { background: none; border: none; cursor: pointer; color: #6B7280; font-size: 1.25rem; padding: 0.25rem; border-radius: 0.375rem; &:hover { background: #F3F4F6; } }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.8125rem; font-weight: 600; color: #374151; } input, select, textarea { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; font-size: 0.875rem; color: #111827; font-family: inherit; &:focus { outline: none; border-color: #3B82F6; } } textarea { resize: vertical; } }
    .input-error { border-color: #EF4444 !important; }
    .error-msg { font-size: 0.75rem; color: #EF4444; }
    .required { color: #EF4444; }
    .alert-error { padding: 0.75rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 0.375rem; color: #991B1B; font-size: 0.8125rem; }
    .btn-cancel { background: white; color: #374151; border: 1px solid #D1D5DB; border-radius: 0.5rem; padding: 0.5rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; &:hover { background: #F3F4F6; } }
    .btn-save { background: #3B82F6; color: white; border: none; border-radius: 0.5rem; padding: 0.5rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; &:not(:disabled):hover { background: #2563EB; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
  `]
})
export class SharedResourcesComponent implements OnInit {
  private http = inject(HttpClient);

  resources = signal<SharedResource[]>([]);
  resourceTypes = signal<ResourceType[]>([]);
  loading = signal(true);
  scopeFilter = '';

  showModal = signal(false);
  editingId = signal<string | null>(null);
  submitted = signal(false);
  saving = signal(false);
  saveError = signal('');
  deletingId = signal<string | null>(null);
  form = { name: '', resourceTypeId: '', environmentScope: '', description: '' };

  ngOnInit() {
    this.load();
    this.http.get<ResourceType[]>(`${environment.apiUrl}/resources/types`).subscribe({
      next: t => this.resourceTypes.set(t)
    });
  }

  load() {
    this.loading.set(true);
    const qs = this.scopeFilter ? `?scope=${this.scopeFilter}` : '';
    this.http.get<SharedResource[]>(`${environment.apiUrl}/resources/shared${qs}`).subscribe({
      next: r => { this.resources.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openModal() {
    this.editingId.set(null);
    this.form = { name: '', resourceTypeId: '', environmentScope: '', description: '' };
    this.submitted.set(false);
    this.saveError.set('');
    this.showModal.set(true);
  }

  openEdit(r: SharedResource) {
    this.editingId.set(r.id);
    this.form = {
      name: r.name,
      resourceTypeId: '',
      environmentScope: r.environmentScope ?? '',
      description: r.description ?? ''
    };
    this.submitted.set(false);
    this.saveError.set('');
    this.showModal.set(true);
  }

  save() {
    this.submitted.set(true);
    const id = this.editingId();
    if (!this.form.name.trim()) return;
    if (!id && !this.form.resourceTypeId) return;

    this.saving.set(true);
    this.saveError.set('');

    const req = id
      ? this.http.patch(`${environment.apiUrl}/resources/shared/${id}`, {
          name: this.form.name.trim(),
          description: this.form.description.trim() || null,
          environmentScope: this.form.environmentScope || null
        })
      : this.http.post(`${environment.apiUrl}/resources/shared`, {
          resourceTypeId: this.form.resourceTypeId,
          name: this.form.name.trim(),
          description: this.form.description.trim() || null,
          environmentScope: this.form.environmentScope || null,
          connectionFields: {}
        });

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.load();
      },
      error: err => {
        this.saving.set(false);
        this.saveError.set(err.error?.detail ?? 'Kaynak kaydedilemedi');
      }
    });
  }

  deleteResource(r: SharedResource) {
    if (!confirm(`"${r.name}" kaynağı silinecek. Emin misiniz?`)) return;
    this.deletingId.set(r.id);
    this.http.delete(`${environment.apiUrl}/resources/shared/${r.id}`).subscribe({
      next: () => { this.deletingId.set(null); this.load(); },
      error: () => { this.deletingId.set(null); }
    });
  }
}
