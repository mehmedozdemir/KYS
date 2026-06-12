import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgStyle, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';

interface HostingPlatform {
  id: string;
  name: string;
  code: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
}

const ICON_OPTIONS = ['pi-server', 'pi-box', 'pi-cloud', 'pi-microsoft', 'pi-desktop', 'pi-database', 'pi-sitemap', 'pi-globe'];
const CATEGORY_OPTIONS = ['Konteyner', 'Sunucu', 'Bulut', 'Diğer'];

@Component({
  selector: 'app-hosting-platforms',
  standalone: true,
  imports: [RouterLink, NgStyle, NgClass, FormsModule, TranslocoModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <div class="breadcrumb"><a routerLink="/admin">{{ 'admin.crumb' | transloco }}</a><span>/</span><span>{{ 'admin.hostingPlatforms.title' | transloco }}</span></div>
          <h1 class="page-title">{{ 'admin.hostingPlatforms.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'admin.hostingPlatforms.subtitle' | transloco }}</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <i class="pi pi-plus"></i> {{ 'admin.hostingPlatforms.newPlatform' | transloco }}
        </button>
      </div>

      @if (loading()) {
        <div class="empty-state">{{ 'common.loading' | transloco }}</div>
      } @else if (!platforms().length) {
        <div class="empty-state">{{ 'admin.hostingPlatforms.empty' | transloco }}</div>
      } @else {
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'admin.hostingPlatforms.colPlatform' | transloco }}</th>
                <th>{{ 'admin.hostingPlatforms.colCode' | transloco }}</th>
                <th>{{ 'admin.hostingPlatforms.colCategory' | transloco }}</th>
                <th>{{ 'admin.hostingPlatforms.colSort' | transloco }}</th>
                <th>{{ 'admin.hostingPlatforms.colStatus' | transloco }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of platforms(); track p.id) {
                <tr [class.row-inactive]="!p.isActive">
                  <td>
                    <div class="plat-cell">
                      <span class="plat-badge" [ngStyle]="{ background: softBg(p.color), color: p.color ?? 'var(--text-muted)' }">
                        <i class="pi" [ngClass]="p.icon ?? 'pi-server'"></i>
                      </span>
                      <span class="name-cell">{{ p.name }}</span>
                    </div>
                  </td>
                  <td><code class="mono">{{ p.code }}</code></td>
                  <td class="text-muted">{{ categoryLabel(p.category) }}</td>
                  <td class="text-muted">{{ p.sortOrder }}</td>
                  <td>
                    @if (p.isActive) { <span class="status-on">{{ 'admin.hostingPlatforms.active' | transloco }}</span> }
                    @else { <span class="status-off">{{ 'admin.hostingPlatforms.inactive' | transloco }}</span> }
                  </td>
                  <td class="actions-cell">
                    <button class="btn-icon" [title]="'admin.hostingPlatforms.editTitle' | transloco" (click)="openEdit(p)"><i class="pi pi-pencil"></i></button>
                    <button class="btn-icon btn-icon--danger" [title]="'admin.hostingPlatforms.deleteTitle' | transloco" (click)="confirmDelete(p)"><i class="pi pi-trash"></i></button>
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
            <h2>{{ (editingId() ? 'admin.hostingPlatforms.editModal' : 'admin.hostingPlatforms.newModal') | transloco }}</h2>
            <button class="close-btn" (click)="showModal.set(false)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (saveError()) { <div class="alert-error">{{ saveError() }}</div> }
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'admin.hostingPlatforms.name' | transloco }} <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.name" [placeholder]="'admin.hostingPlatforms.namePh' | transloco"
                  [class.input-error]="submitted() && !form.name.trim()" />
                @if (submitted() && !form.name.trim()) { <span class="field-error">{{ 'admin.hostingPlatforms.nameRequired' | transloco }}</span> }
              </div>
              <div class="form-group">
                <label>{{ 'admin.hostingPlatforms.code' | transloco }} <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.code" [placeholder]="'admin.hostingPlatforms.codePh' | transloco" maxlength="30"
                  (input)="form.code = form.code.toUpperCase()"
                  [class.input-error]="submitted() && !form.code.trim()" />
                @if (submitted() && !form.code.trim()) { <span class="field-error">{{ 'admin.hostingPlatforms.codeRequired' | transloco }}</span> }
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'admin.hostingPlatforms.category' | transloco }}</label>
                <select [(ngModel)]="form.category">
                  <option [ngValue]="null">—</option>
                  @for (c of categoryOptions; track c) { <option [ngValue]="c">{{ categoryLabel(c) }}</option> }
                </select>
              </div>
              <div class="form-group">
                <label>{{ 'admin.hostingPlatforms.icon' | transloco }}</label>
                <select [(ngModel)]="form.icon">
                  @for (ic of iconOptions; track ic) { <option [ngValue]="ic">{{ ic }}</option> }
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'admin.hostingPlatforms.color' | transloco }}</label>
                <div class="color-input-row">
                  <input type="color" [(ngModel)]="form.color" class="color-picker" />
                  <input type="text" [(ngModel)]="form.color" placeholder="#326CE5" maxlength="7" class="color-text" />
                </div>
              </div>
              <div class="form-group">
                <label>{{ 'admin.hostingPlatforms.sortOrder' | transloco }}</label>
                <input type="number" [(ngModel)]="form.sortOrder" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'admin.hostingPlatforms.description' | transloco }}</label>
              <input type="text" [(ngModel)]="form.description" [placeholder]="'admin.hostingPlatforms.descriptionPh' | transloco" />
            </div>
            <div class="preview-row">
              <span class="preview-label">{{ 'admin.hostingPlatforms.preview' | transloco }}</span>
              <span class="plat-badge" [ngStyle]="{ background: softBg(form.color), color: form.color }">
                <i class="pi" [ngClass]="form.icon"></i>
              </span>
              <span class="plat-chip" [ngStyle]="{ background: softBg(form.color), color: form.color }">
                <i class="pi" [ngClass]="form.icon"></i> {{ form.name || ('admin.hostingPlatforms.platformFallback' | transloco) }}
              </span>
            </div>
            @if (editingId()) {
              <label class="checkbox-label"><input type="checkbox" [(ngModel)]="form.isActive" /> {{ 'admin.hostingPlatforms.activeToggle' | transloco }}</label>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showModal.set(false)">{{ 'common.cancel' | transloco }}</button>
            <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
              {{ (saving() ? 'common.saving' : (editingId() ? 'common.update' : 'common.create')) | transloco }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (deletingPlatform()) {
      <div class="modal-backdrop" (click)="deletingPlatform.set(null)">
        <div class="modal modal--sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ 'admin.hostingPlatforms.deleteModal' | transloco }}</h2>
            <button class="close-btn" (click)="deletingPlatform.set(null)"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (deleteError()) { <div class="alert-error">{{ deleteError() }}</div> }
            @else {
              <p class="confirm-text" [innerHTML]="'admin.hostingPlatforms.deleteConfirm' | transloco:{ name: deletingPlatform()!.name }"></p>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="deletingPlatform.set(null)">{{ 'common.cancel' | transloco }}</button>
            @if (!deleteError()) {
              <button class="btn btn-danger" [disabled]="deleting()" (click)="deleteConfirmed()">
                {{ (deleting() ? 'common.deleting' : 'common.delete') | transloco }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.375rem; a { color: var(--primary); text-decoration: none; } span:last-child { color: var(--text); } }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; box-shadow: var(--shadow-sm); }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-subtle); font-size: 0.875rem; }
    .data-table { width: 100%; border-collapse: collapse;
      th { background: var(--surface-2); padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); }
      td { padding: 0.75rem; font-size: 0.875rem; color: var(--text); border-bottom: 1px solid var(--border-light); }
      tr:last-child td { border-bottom: none; }
    }
    .row-inactive { opacity: 0.55; }
    .plat-cell { display: flex; align-items: center; gap: 0.625rem; }
    .plat-badge { width: 1.75rem; height: 1.75rem; border-radius: 0.5rem; display: inline-flex; align-items: center; justify-content: center; font-size: 0.875rem; flex-shrink: 0; }
    .name-cell { font-weight: 500; color: var(--text-strong); }
    .mono { font-family: monospace; font-size: 0.8125rem; background: var(--surface-3); color: var(--text-muted); padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
    .text-muted { color: var(--text-subtle); font-size: 0.8125rem; }
    .status-on { font-size: 0.7rem; font-weight: 600; color: var(--success-soft-text); background: var(--success-soft-bg); padding: 0.1rem 0.5rem; border-radius: 9999px; }
    .status-off { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); background: var(--surface-3); padding: 0.1rem 0.5rem; border-radius: 9999px; }
    .actions-cell { text-align: right; white-space: nowrap; }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary); color: var(--primary-contrast); &:not(:disabled):hover { background: var(--primary-hover); } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--hover); } }
    .btn-danger { background: var(--danger); color: #fff; &:not(:disabled):hover { background: var(--danger-strong); } }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 0.375rem; border-radius: 0.375rem; color: var(--text-muted); font-size: 0.875rem; &:hover { background: var(--hover); color: var(--text); } }
    .btn-icon--danger { &:hover { background: var(--danger-faint-bg); color: var(--danger); } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 520px; box-shadow: var(--shadow-lg); }
    .modal--sm { max-width: 400px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; font-size: 1rem; &:hover { color: var(--text); } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: var(--text); } input, select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; background: var(--surface); color: var(--text-strong); &:focus { outline: none; border-color: var(--primary); } } }
    .color-input-row { display: flex; gap: 0.5rem; align-items: center; }
    .color-picker { width: 3rem; height: 2.25rem; padding: 0.125rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; cursor: pointer; }
    .color-text { flex: 1; }
    .input-error { border-color: var(--danger) !important; }
    .req { color: var(--danger); }
    .field-error { font-size: 0.75rem; color: var(--danger); }
    .alert-error { padding: 0.75rem 1rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.5rem; color: var(--danger-soft-text); font-size: 0.875rem; }
    .confirm-text { font-size: 0.9375rem; color: var(--text); line-height: 1.5; margin: 0; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text); cursor: pointer; input { width: auto; } }
    .preview-row { display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem 0.75rem; background: var(--surface-2); border-radius: 0.5rem; }
    .preview-label { font-size: 0.75rem; color: var(--text-muted); }
    .plat-chip { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; i { font-size: 0.7rem; } }
  `]
})
export class HostingPlatformsComponent implements OnInit {
  private http = inject(HttpClient);
  private transloco = inject(TranslocoService);

  platforms = signal<HostingPlatform[]>([]);
  loading = signal(true);
  readonly iconOptions = ICON_OPTIONS;
  readonly categoryOptions = CATEGORY_OPTIONS;

  private readonly categoryKeys: Record<string, string> = {
    'Konteyner': 'admin.hostingPlatforms.catContainer',
    'Sunucu': 'admin.hostingPlatforms.catServer',
    'Bulut': 'admin.hostingPlatforms.catCloud',
    'Diğer': 'admin.hostingPlatforms.catOther'
  };

  categoryLabel(c: string | null): string {
    if (!c) return '—';
    const key = this.categoryKeys[c];
    return key ? this.transloco.translate(key) : c;
  }

  showModal = signal(false);
  editingId = signal<string | null>(null);
  submitted = signal(false);
  saving = signal(false);
  saveError = signal('');
  form = { name: '', code: '', description: '', category: null as string | null, icon: 'pi-server', color: '#326CE5', sortOrder: 0, isActive: true };

  deletingPlatform = signal<HostingPlatform | null>(null);
  deleting = signal(false);
  deleteError = signal('');

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<HostingPlatform[]>(`${environment.apiUrl}/environments/hosting-platforms?activeOnly=false`).subscribe({
      next: p => { this.platforms.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  softBg(color: string | null): string {
    const c = color ?? '#6B7280';
    return c + '22';
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { name: '', code: '', description: '', category: null, icon: 'pi-server', color: '#326CE5', sortOrder: this.platforms().length + 1, isActive: true };
    this.submitted.set(false); this.saveError.set('');
    this.showModal.set(true);
  }

  openEdit(p: HostingPlatform) {
    this.editingId.set(p.id);
    this.form = {
      name: p.name, code: p.code, description: p.description ?? '',
      category: p.category, icon: p.icon ?? 'pi-server', color: p.color ?? '#326CE5',
      sortOrder: p.sortOrder, isActive: p.isActive
    };
    this.submitted.set(false); this.saveError.set('');
    this.showModal.set(true);
  }

  save() {
    this.submitted.set(true);
    if (!this.form.name.trim() || !this.form.code.trim()) return;
    this.saving.set(true);
    this.saveError.set('');

    const payload = {
      name: this.form.name.trim(),
      code: this.form.code.trim().toUpperCase(),
      description: this.form.description.trim() || null,
      category: this.form.category,
      icon: this.form.icon || null,
      color: this.form.color || null,
      sortOrder: Number(this.form.sortOrder)
    };

    const id = this.editingId();
    const req = id
      ? this.http.put(`${environment.apiUrl}/admin/hosting-platforms/${id}`, { ...payload, isActive: this.form.isActive })
      : this.http.post(`${environment.apiUrl}/admin/hosting-platforms`, payload);

    req.subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.load(); },
      error: err => { this.saving.set(false); this.saveError.set(err.error?.detail ?? this.transloco.translate('admin.hostingPlatforms.saveFailed')); }
    });
  }

  confirmDelete(p: HostingPlatform) { this.deleteError.set(''); this.deletingPlatform.set(p); }

  deleteConfirmed() {
    const p = this.deletingPlatform();
    if (!p) return;
    this.deleting.set(true);
    this.http.delete(`${environment.apiUrl}/admin/hosting-platforms/${p.id}`).subscribe({
      next: () => { this.deleting.set(false); this.deletingPlatform.set(null); this.load(); },
      error: err => { this.deleting.set(false); this.deleteError.set(err.error?.detail ?? this.transloco.translate('admin.hostingPlatforms.deleteFailed')); }
    });
  }
}
