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
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Create Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Yeni Ortam Tipi</h2>
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
              {{ saving() ? 'Kaydediliyor...' : 'Oluştur' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #6B7280; margin-bottom: 0.375rem; a { color: #3B82F6; text-decoration: none; } span { &:last-child { color: #374151; } } }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #111827; }
    .page-subtitle { font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem; }

    .table-wrapper { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-state { text-align: center; padding: 3rem; color: #9CA3AF; font-size: 0.875rem; }
    .data-table { width: 100%; border-collapse: collapse;
      th { background: #F9FAFB; padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; }
      td { padding: 0.75rem; font-size: 0.875rem; color: #374151; border-bottom: 1px solid #F3F4F6; }
      tr:last-child td { border-bottom: none; }
    }
    .color-dot { width: 1.25rem; height: 1.25rem; border-radius: 50%; }
    .name-cell { font-weight: 500; color: #111827; }
    .mono { font-family: monospace; font-size: 0.8125rem; background: #F3F4F6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
    .text-muted { color: #9CA3AF; font-size: 0.8125rem; }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: #3B82F6; color: white; &:not(:disabled):hover { background: #2563EB; } }
    .btn-secondary { background: white; color: #374151; border: 1px solid #D1D5DB; &:hover { background: #F3F4F6; } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 0.75rem; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E5E7EB; h2 { font-size: 1.125rem; font-weight: 700; color: #111827; } }
    .close-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 0.25rem; font-size: 1rem; &:hover { color: #374151; } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 0.75rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: #374151; } input { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; &:focus { outline: none; border-color: #3B82F6; } } }
    .color-input-row { display: flex; gap: 0.5rem; align-items: center; }
    .color-picker { width: 3rem; height: 2.25rem; padding: 0.125rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; cursor: pointer; }
    .color-text { flex: 1; }
    .input-error { border-color: #EF4444 !important; }
    .req { color: #EF4444; }
    .field-error { font-size: 0.75rem; color: #EF4444; }
    .alert-error { padding: 0.75rem 1rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 0.5rem; color: #991B1B; font-size: 0.875rem; }
  `]
})
export class EnvironmentTypesComponent implements OnInit {
  private http = inject(HttpClient);

  types = signal<EnvType[]>([]);
  loading = signal(true);

  showModal = signal(false);
  saving = signal(false);
  submitted = signal(false);
  saveError = signal('');
  form = { name: '', code: '', description: '', color: '#3B82F6', sortOrder: 0 };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<EnvType[]>(`${environment.apiUrl}/environments/types`).subscribe({
      next: t => { this.types.set(t); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.form = { name: '', code: '', description: '', color: '#3B82F6', sortOrder: this.types().length + 1 };
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
    this.http.post(`${environment.apiUrl}/admin/environment-types`, {
      name: this.form.name.trim(),
      code: this.form.code.trim().toUpperCase(),
      description: this.form.description.trim() || null,
      color: this.form.color || null,
      sortOrder: Number(this.form.sortOrder)
    }).subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: err => { this.saving.set(false); this.saveError.set(err.error?.detail ?? 'Kaydedilemedi'); }
    });
  }
}
