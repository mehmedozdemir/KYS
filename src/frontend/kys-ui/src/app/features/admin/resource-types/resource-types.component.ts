import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';

interface FieldSchemaEntry {
  key: string;
  type: string;
  label: string;
  required: boolean;
  defaultValue: string;
}

interface ResourceType {
  id: string;
  name: string;
  code: string;
  category: string | null;
  icon: string | null;
  description: string | null;
  isActive: boolean;
  fieldSchema: Record<string, { type: string; label: string; required: boolean; default?: string | number }>;
}

@Component({
  selector: 'app-resource-types',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule, TranslocoModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <div class="breadcrumb">
            <a routerLink="/admin">{{ 'admin.crumb' | transloco }}</a>
            <span>/</span>
            <span>{{ 'admin.resourceTypes.title' | transloco }}</span>
          </div>
          <h1 class="page-title">{{ 'admin.resourceTypes.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'admin.resourceTypes.subtitle' | transloco:{ count: types().length } }}</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <i class="pi pi-plus"></i> {{ 'admin.resourceTypes.newType' | transloco }}
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">{{ 'common.loading' | transloco }}</div>
      } @else if (!types().length) {
        <div class="empty-state">
          <i class="pi pi-box"></i>
          <p>{{ 'admin.resourceTypes.empty' | transloco }}</p>
          <button class="btn btn-primary" (click)="openCreate()">
            <i class="pi pi-plus"></i> {{ 'admin.resourceTypes.addFirst' | transloco }}
          </button>
        </div>
      } @else {
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>{{ 'admin.resourceTypes.colName' | transloco }}</th>
                <th>{{ 'admin.resourceTypes.colCode' | transloco }}</th>
                <th>{{ 'admin.resourceTypes.colCategory' | transloco }}</th>
                <th>{{ 'admin.resourceTypes.colFields' | transloco }}</th>
                <th>{{ 'admin.resourceTypes.colStatus' | transloco }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (t of types(); track t.id) {
                <tr [class.inactive-row]="!t.isActive">
                  <td>
                    <div class="type-name-cell">
                      @if (t.icon) {
                        <i class="pi" [ngClass]="'pi-' + t.icon" style="color:var(--text-muted);font-size:0.875rem"></i>
                      }
                      <span class="type-name">{{ t.name }}</span>
                    </div>
                  </td>
                  <td><code class="type-code">{{ t.code }}</code></td>
                  <td class="text-muted">{{ t.category ?? '—' }}</td>
                  <td>
                    @let keys = fieldKeys(t);
                    @if (keys.length) {
                      <div class="field-chips">
                        @for (k of keys; track k) {
                          <span class="field-chip"
                            [title]="t.fieldSchema[k].label + ' (' + t.fieldSchema[k].type + (t.fieldSchema[k].required ? (', ' + ('admin.resourceTypes.requiredSuffix' | transloco)) : '') + ')'">
                            @if (t.fieldSchema[k].required) { <span class="req-dot"></span> }
                            {{ t.fieldSchema[k].label }}
                          </span>
                        }
                      </div>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td>
                    <span class="badge" [ngClass]="t.isActive ? 'badge--active' : 'badge--inactive'">
                      {{ (t.isActive ? 'admin.resourceTypes.active' : 'admin.resourceTypes.inactive') | transloco }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button class="btn-icon" [title]="'admin.resourceTypes.editTitle' | transloco" (click)="openEdit(t)">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="btn-icon btn-icon--danger" [title]="'admin.resourceTypes.deactivateTitle' | transloco"
                      [disabled]="deletingId() === t.id" (click)="deleteType(t)">
                      @if (deletingId() === t.id) { <i class="pi pi-spin pi-spinner"></i> }
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
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ (editingId() ? 'admin.resourceTypes.editModal' : 'admin.resourceTypes.newModal') | transloco }}</h2>
            <button type="button" class="close-btn" (click)="closeModal()">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="modal-body">
            @if (saveError()) {
              <div class="alert-error">{{ saveError() }}</div>
            }

            <!-- Temel Bilgiler -->
            <div class="section-label">{{ 'admin.resourceTypes.basicInfo' | transloco }}</div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'admin.resourceTypes.name' | transloco }} <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.name"
                  [class.input-error]="submitted() && !form.name.trim()"
                  [placeholder]="'admin.resourceTypes.namePh' | transloco" />
                @if (submitted() && !form.name.trim()) {
                  <span class="field-error">{{ 'admin.resourceTypes.requiredField' | transloco }}</span>
                }
              </div>
              <div class="form-group">
                <label>{{ 'admin.resourceTypes.code' | transloco }} <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.code"
                  [class.input-error]="submitted() && !form.code.trim()"
                  [placeholder]="'admin.resourceTypes.codePh' | transloco"
                  [disabled]="!!editingId()" />
                @if (submitted() && !form.code.trim()) {
                  <span class="field-error">{{ 'admin.resourceTypes.requiredField' | transloco }}</span>
                }
                @if (editingId()) {
                  <span class="field-hint">{{ 'admin.resourceTypes.codeImmutable' | transloco }}</span>
                }
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'admin.resourceTypes.category' | transloco }}</label>
                <input type="text" [(ngModel)]="form.category" [placeholder]="'admin.resourceTypes.categoryPh' | transloco" />
              </div>
              <div class="form-group">
                <label>{{ 'admin.resourceTypes.icon' | transloco }}</label>
                <input type="text" [(ngModel)]="form.icon" [placeholder]="'admin.resourceTypes.iconPh' | transloco" />
                <span class="field-hint">{{ 'admin.resourceTypes.iconHint' | transloco }}</span>
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'admin.resourceTypes.description' | transloco }}</label>
              <textarea [(ngModel)]="form.description" rows="2" [placeholder]="'admin.resourceTypes.descriptionPh' | transloco"></textarea>
            </div>
            @if (editingId()) {
              <div class="form-group">
                <label class="toggle-label">
                  <input type="checkbox" [(ngModel)]="form.isActive" />
                  <span>{{ 'admin.resourceTypes.activeToggle' | transloco }}</span>
                </label>
              </div>
            }

            <!-- Alan Tanımları -->
            <div class="section-divider"></div>
            <div class="schema-header">
              <div class="section-label" style="margin:0">{{ 'admin.resourceTypes.fieldDefs' | transloco }}</div>
              <span class="section-hint">{{ 'admin.resourceTypes.fieldDefsHint' | transloco }}</span>
            </div>

            @if (fieldEntries().length) {
              <div class="field-entry-list">
                @for (f of fieldEntries(); track $index; let i = $index) {
                  <div class="field-entry">
                    <div class="field-entry-row">
                      <div class="form-group field-key-group">
                        <label>{{ 'admin.resourceTypes.fieldKey' | transloco }}</label>
                        <input type="text" [(ngModel)]="f.key" [placeholder]="'admin.resourceTypes.fieldKeyPh' | transloco" />
                      </div>
                      <div class="form-group field-label-group">
                        <label>{{ 'admin.resourceTypes.fieldLabel' | transloco }}</label>
                        <input type="text" [(ngModel)]="f.label" [placeholder]="'admin.resourceTypes.fieldLabelPh' | transloco" />
                      </div>
                      <div class="form-group field-type-group">
                        <label>{{ 'admin.resourceTypes.fieldTypeLabel' | transloco }}</label>
                        <select [(ngModel)]="f.type">
                          <option value="string">{{ 'admin.resourceTypes.typeString' | transloco }}</option>
                          <option value="password">{{ 'admin.resourceTypes.typePassword' | transloco }}</option>
                          <option value="number">{{ 'admin.resourceTypes.typeNumber' | transloco }}</option>
                          <option value="boolean">{{ 'admin.resourceTypes.typeBoolean' | transloco }}</option>
                        </select>
                      </div>
                      <div class="form-group field-req-group">
                        <label>{{ 'admin.resourceTypes.required' | transloco }}</label>
                        <label class="toggle-label" style="margin-top:0.375rem">
                          <input type="checkbox" [(ngModel)]="f.required" />
                          <span>{{ 'common.yes' | transloco }}</span>
                        </label>
                      </div>
                      <button type="button" class="btn-remove-field" (click)="removeField(i)" [title]="'admin.resourceTypes.removeFieldTitle' | transloco">
                        <i class="pi pi-times"></i>
                      </button>
                    </div>
                    <div class="form-group" style="margin-top:0.25rem">
                      <label>{{ 'admin.resourceTypes.defaultValue' | transloco }} <span class="field-hint">{{ 'admin.resourceTypes.defaultOptional' | transloco }}</span></label>
                      <input type="text" [(ngModel)]="f.defaultValue" [placeholder]="'admin.resourceTypes.defaultValuePh' | transloco" />
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="no-fields">{{ 'admin.resourceTypes.noFields' | transloco }}</div>
            }

            <button type="button" class="btn-add-field" (click)="addField()">
              <i class="pi pi-plus"></i> {{ 'admin.resourceTypes.addField' | transloco }}
            </button>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">{{ 'common.cancel' | transloco }}</button>
            <button type="button" class="btn btn-primary" [disabled]="saving()" (click)="save()">
              @if (saving()) { <i class="pi pi-spin pi-spinner"></i> }
              {{ (editingId() ? 'common.update' : 'common.create') | transloco }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem; a { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } } }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.125rem; }
    .loading-state { text-align: center; padding: 4rem; color: var(--text-subtle); }
    .empty-state { text-align: center; padding: 4rem; color: var(--text-subtle); display: flex; flex-direction: column; align-items: center; gap: 1rem; i { font-size: 2.5rem; } p { margin: 0; } }

    .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    table { width: 100%; border-collapse: collapse; }
    th { background: var(--surface-2); padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--surface-3); font-size: 0.875rem; color: var(--text); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .inactive-row td { opacity: 0.55; }
    .type-name-cell { display: flex; align-items: center; gap: 0.5rem; }
    .type-name { font-weight: 500; color: var(--text-strong); }
    .type-code { background: var(--surface-3); color: var(--text); padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8125rem; }
    .text-muted { color: var(--text-subtle); }
    .actions-cell { width: 88px; text-align: right; white-space: nowrap; }
    .badge { display: inline-flex; padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
    .badge--active { background: var(--success-soft-bg); color: var(--success-soft-text); }
    .badge--inactive { background: var(--warning-soft-bg); color: var(--warning-soft-text); }
    .btn-icon { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; border-radius: 0.25rem; &:hover { color: var(--primary); background: var(--primary-soft-bg); } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .btn-icon--danger { &:hover { color: var(--danger) !important; background: var(--danger-faint-bg) !important; } }

    /* Field chips in table */
    .field-chips { display: flex; flex-wrap: wrap; gap: 0.25rem; max-width: 320px; }
    .field-chip { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.5rem; background: var(--primary-soft-bg); border: 1px solid var(--primary-soft-bg-2); border-radius: 9999px; font-size: 0.7rem; color: var(--primary-soft-text); white-space: nowrap; cursor: default; }
    .req-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--danger); flex-shrink: 0; }

    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary); color: white; &:not(:disabled):hover { background: var(--primary-hover); } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--surface-3); } }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface); border-radius: 0.75rem; width: 100%; max-width: 620px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); flex-shrink: 0; h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-strong); } }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.25rem; font-size: 1rem; &:hover { color: var(--text); } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; overflow-y: auto; flex: 1; min-height: 0; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem;
      label { font-size: 0.8125rem; font-weight: 500; color: var(--text); }
      input, textarea, select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; font-family: inherit; width: 100%; box-sizing: border-box; &:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 2px rgba(59,130,246,0.1); } &:disabled { background: var(--surface-2); cursor: not-allowed; color: var(--text-muted); } }
      textarea { resize: vertical; min-height: 60px; }
    }
    .input-error { border-color: var(--danger) !important; }
    .field-error { font-size: 0.75rem; color: var(--danger); }
    .field-hint { font-size: 0.75rem; color: var(--text-subtle); }
    .req { color: var(--danger); }
    .toggle-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: var(--text); input { width: auto; } }
    .alert-error { padding: 0.75rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.375rem; color: var(--danger-soft-text); font-size: 0.8125rem; }
    .section-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .section-divider { border-top: 1px solid var(--border); margin: 0.25rem 0; }
    .schema-header { display: flex; align-items: baseline; gap: 0.75rem; }
    .section-hint { font-size: 0.75rem; color: var(--text-subtle); }

    /* FieldSchema editor */
    .field-entry-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .field-entry { background: var(--surface-2); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.75rem; }
    .field-entry-row { display: grid; grid-template-columns: 1fr 1fr 100px 80px auto; gap: 0.5rem; align-items: end; }
    .field-key-group, .field-label-group { min-width: 0; }
    .field-type-group { min-width: 0; }
    .field-req-group { min-width: 0; }
    .btn-remove-field { background: none; border: none; cursor: pointer; color: var(--text-subtle); padding: 0.375rem; border-radius: 0.25rem; font-size: 0.875rem; align-self: end; &:hover { color: var(--danger); background: var(--danger-faint-bg); } }
    .no-fields { padding: 0.875rem; text-align: center; font-size: 0.8125rem; color: var(--text-subtle); background: var(--surface-2); border: 1px dashed var(--border); border-radius: 0.5rem; }
    .btn-add-field { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.375rem 0.875rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; align-self: flex-start; &:hover { border-color: var(--primary); color: var(--primary-hover); background: var(--primary-soft-bg); } }
  `]
})
export class ResourceTypesComponent implements OnInit {
  private http = inject(HttpClient);
  private transloco = inject(TranslocoService);

  types = signal<ResourceType[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  submitted = signal(false);
  saveError = signal('');
  editingId = signal<string | null>(null);
  deletingId = signal<string | null>(null);
  fieldEntries = signal<FieldSchemaEntry[]>([]);

  form = { name: '', code: '', category: '', icon: '', description: '', isActive: true };

  ngOnInit() { this.load(); }

  load() {
    this.http.get<ResourceType[]>(`${environment.apiUrl}/resources/types?activeOnly=false`).subscribe({
      next: t => { this.types.set(t); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  fieldKeys(t: ResourceType): string[] {
    return t.fieldSchema ? Object.keys(t.fieldSchema) : [];
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { name: '', code: '', category: '', icon: '', description: '', isActive: true };
    this.fieldEntries.set([]);
    this.submitted.set(false);
    this.saveError.set('');
    this.showModal.set(true);
  }

  openEdit(t: ResourceType) {
    this.editingId.set(t.id);
    this.form = { name: t.name, code: t.code, category: t.category ?? '', icon: t.icon ?? '', description: t.description ?? '', isActive: t.isActive };
    this.fieldEntries.set(
      Object.entries(t.fieldSchema ?? {}).map(([key, def]) => ({
        key,
        type: def.type,
        label: def.label,
        required: def.required,
        defaultValue: def.default != null ? String(def.default) : ''
      }))
    );
    this.submitted.set(false);
    this.saveError.set('');
    this.showModal.set(true);
  }

  addField() {
    this.fieldEntries.update(list => [...list, { key: '', type: 'string', label: '', required: false, defaultValue: '' }]);
  }

  removeField(index: number) {
    this.fieldEntries.update(list => list.filter((_, i) => i !== index));
  }

  closeModal() { this.showModal.set(false); }

  save() {
    this.submitted.set(true);
    if (!this.form.name.trim() || !this.form.code.trim()) return;

    this.saving.set(true);
    this.saveError.set('');

    const fieldSchema: Record<string, object> = {};
    for (const f of this.fieldEntries()) {
      if (!f.key.trim()) continue;
      const entry: Record<string, unknown> = { type: f.type, label: f.label.trim() || f.key, required: f.required };
      if (f.defaultValue.trim()) entry['default'] = f.defaultValue.trim();
      fieldSchema[f.key.trim()] = entry;
    }

    const body = {
      name: this.form.name.trim(),
      code: this.form.code.trim().toLowerCase(),
      category: this.form.category.trim() || null,
      icon: this.form.icon.trim() || null,
      description: this.form.description.trim() || null,
      isActive: this.form.isActive,
      fieldSchema: Object.keys(fieldSchema).length ? fieldSchema : null
    };

    const id = this.editingId();
    const req = id
      ? this.http.patch(`${environment.apiUrl}/resources/types/${id}`, body)
      : this.http.post(`${environment.apiUrl}/resources/types`, body);

    req.subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.load(); },
      error: err => { this.saving.set(false); this.saveError.set(err.error?.detail ?? this.transloco.translate('admin.resourceTypes.saveFailed')); }
    });
  }

  deleteType(t: ResourceType) {
    if (!confirm(this.transloco.translate('admin.resourceTypes.deleteConfirm', { name: t.name }))) return;
    this.deletingId.set(t.id);
    this.http.delete(`${environment.apiUrl}/resources/types/${t.id}`).subscribe({
      next: () => { this.deletingId.set(null); this.load(); },
      error: () => { this.deletingId.set(null); }
    });
  }
}
