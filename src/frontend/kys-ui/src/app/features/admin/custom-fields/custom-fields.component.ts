import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgClass, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface CustomFieldDef {
  id: string;
  entityType: number; // 0=Customer,1=Product
  fieldKey: string;
  displayName: string;
  fieldType: number; // 0=Text,1=Number,2=Date,3=Boolean,4=Select,5=Url,6=Email
  isRequired: boolean;
  defaultValue: string | null;
  selectOptions: string[] | null;
  displayOrder: number;
  groupName: string | null;
  isActive: boolean;
}

const FIELD_TYPE_LABEL: Record<number, string> = {
  0: 'Metin', 1: 'Sayı', 2: 'Tarih', 3: 'Evet/Hayır', 4: 'Seçim Listesi', 5: 'URL', 6: 'E-posta'
};

@Component({
  selector: 'app-custom-fields',
  standalone: true,
  imports: [RouterLink, NgClass, NgStyle, FormsModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <div class="breadcrumb"><a routerLink="/admin">Admin</a><span>/</span><span>Özel Alanlar</span></div>
          <h1 class="page-title">Özel Alanlar</h1>
          <p class="page-subtitle">Müşteri ve ürün kayıtlarına ek alan tanımlayın</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <i class="pi pi-plus"></i> Yeni Alan
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="entityTab() === 0" (click)="switchTab(0)">
          Müşteri Alanları <span class="tab-count">{{ customerFields().length }}</span>
        </button>
        <button class="tab-btn" [class.active]="entityTab() === 1" (click)="switchTab(1)">
          Ürün Alanları <span class="tab-count">{{ productFields().length }}</span>
        </button>
      </div>

      <!-- Show inactive toggle -->
      <div class="toolbar">
        <label class="toggle-row">
          <input type="checkbox" [(ngModel)]="showInactive" (change)="load()" />
          <span>Pasif alanları da göster</span>
        </label>
      </div>

      @if (loading()) {
        <div class="empty-state">Yükleniyor...</div>
      } @else {
        @let fields = entityTab() === 0 ? customerFields() : productFields();
        @if (!fields.length) {
          <div class="empty-state">Bu kategoride alan tanımlanmamış.</div>
        } @else {
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Alan Adı</th>
                  <th>Anahtar</th>
                  <th>Tip</th>
                  <th>Grup</th>
                  <th>Zorunlu</th>
                  <th>Sıra</th>
                  <th>Durum</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (f of fields; track f.id) {
                  <tr [class.inactive-row]="!f.isActive">
                    <td class="field-name">{{ f.displayName }}</td>
                    <td><code class="mono">{{ f.fieldKey }}</code></td>
                    <td>
                      <span class="type-badge">{{ fieldTypeLabel(f.fieldType) }}</span>
                    </td>
                    <td class="text-muted">{{ f.groupName ?? '—' }}</td>
                    <td>
                      @if (f.isRequired) {
                        <span class="badge badge--required">Evet</span>
                      } @else {
                        <span class="text-muted">Hayır</span>
                      }
                    </td>
                    <td class="text-muted">{{ f.displayOrder }}</td>
                    <td>
                      <span class="badge" [ngClass]="f.isActive ? 'badge--active' : 'badge--inactive'">
                        {{ f.isActive ? 'Aktif' : 'Pasif' }}
                      </span>
                    </td>
                    <td class="action-cell">
                      <button class="icon-btn" title="Düzenle" (click)="openEdit(f)"><i class="pi pi-pencil"></i></button>
                      <button class="icon-btn" [title]="f.isActive ? 'Pasife Al' : 'Aktife Al'" (click)="toggle(f)">
                        <i class="pi" [ngClass]="f.isActive ? 'pi-eye-slash' : 'pi-eye'"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>

    <!-- Create / Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId ? 'Alanı Düzenle' : 'Yeni Alan' }}</h2>
            <button class="close-btn" (click)="closeModal()"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            @if (saveError()) {
              <div class="alert-error">{{ saveError() }}</div>
            }

            @if (!editingId) {
              <div class="form-row">
                <div class="form-group">
                  <label>Entity Tipi <span class="req">*</span></label>
                  <select [(ngModel)]="form.entityType">
                    <option value="0">Müşteri</option>
                    <option value="1">Ürün</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Alan Tipi <span class="req">*</span></label>
                  <select [(ngModel)]="form.fieldType">
                    <option value="0">Metin</option>
                    <option value="1">Sayı</option>
                    <option value="2">Tarih</option>
                    <option value="3">Evet/Hayır</option>
                    <option value="4">Seçim Listesi</option>
                    <option value="5">URL</option>
                    <option value="6">E-posta</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Alan Anahtarı <span class="req">*</span></label>
                  <input type="text" [(ngModel)]="form.fieldKey" placeholder="ör. erp_code" (input)="form.fieldKey = slugify(form.fieldKey)" />
                  <span class="hint">Küçük harf, alt çizgi. Kaydedildikten sonra değiştirilemez.</span>
                </div>
                <div class="form-group">
                  <label>Görünen Ad <span class="req">*</span></label>
                  <input type="text" [(ngModel)]="form.displayName" placeholder="ör. ERP Kodu" />
                </div>
              </div>
            } @else {
              <div class="form-group">
                <label>Görünen Ad <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.displayName" />
              </div>
            }

            <div class="form-row">
              <div class="form-group">
                <label>Grup</label>
                <input type="text" [(ngModel)]="form.groupName" placeholder="ör. Sözleşme Bilgileri" />
              </div>
              <div class="form-group">
                <label>Görüntüleme Sırası</label>
                <input type="number" [(ngModel)]="form.displayOrder" min="0" />
              </div>
            </div>

            <div class="form-group">
              <label>Varsayılan Değer</label>
              <input type="text" [(ngModel)]="form.defaultValue" placeholder="İsteğe bağlı" />
            </div>

            @if (Number(form.fieldType) === 4) {
              <div class="form-group">
                <label>Seçenek Listesi <span class="req">*</span></label>
                <textarea [(ngModel)]="form.selectOptionsText" rows="3"
                  placeholder="Her satıra bir seçenek yazın..."></textarea>
                <span class="hint">Her satır ayrı bir seçenek olur</span>
              </div>
            }

            <label class="checkbox-row">
              <input type="checkbox" [(ngModel)]="form.isRequired" />
              <span>Bu alan zorunlu</span>
            </label>

            @if (submitted() && !form.displayName.trim()) {
              <span class="field-error">Görünen ad zorunludur</span>
            }
            @if (submitted() && !editingId && !form.fieldKey.trim()) {
              <span class="field-error">Alan anahtarı zorunludur</span>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">İptal</button>
            <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
              {{ saving() ? 'Kaydediliyor...' : 'Kaydet' }}
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

    .tabs { display: flex; border-bottom: 2px solid #E5E7EB; margin-bottom: 1rem; }
    .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: none; border: none; font-size: 0.875rem; font-weight: 500; color: #6B7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; &.active { color: #3B82F6; border-bottom-color: #3B82F6; } }
    .tab-count { background: #F3F4F6; color: #6B7280; border-radius: 9999px; padding: 0 0.375rem; font-size: 0.75rem; }

    .toolbar { margin-bottom: 1rem; }
    .toggle-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; cursor: pointer; user-select: none; input { cursor: pointer; } }

    .table-wrapper { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-state { text-align: center; padding: 3rem; color: #9CA3AF; font-size: 0.875rem; }
    .data-table { width: 100%; border-collapse: collapse;
      th { background: #F9FAFB; padding: 0.625rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; }
      td { padding: 0.75rem; font-size: 0.875rem; color: #374151; border-bottom: 1px solid #F3F4F6; }
    }
    .inactive-row td { opacity: 0.5; }
    .field-name { font-weight: 500; color: #111827; }
    .mono { font-family: monospace; font-size: 0.8125rem; background: #F3F4F6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
    .text-muted { color: #9CA3AF; font-size: 0.8125rem; }
    .type-badge { display: inline-flex; padding: 0.125rem 0.5rem; background: #EFF6FF; color: #1D4ED8; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; }
    .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--active { background: #D1FAE5; color: #065F46; }
    .badge--inactive { background: #F3F4F6; color: #6B7280; }
    .badge--required { background: #FEF3C7; color: #92400E; }
    .action-cell { display: flex; gap: 0.375rem; }
    .icon-btn { background: none; border: 1px solid #E5E7EB; border-radius: 0.375rem; padding: 0.25rem 0.5rem; cursor: pointer; color: #6B7280; font-size: 0.875rem; &:hover { background: #F9FAFB; color: #374151; } }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: #3B82F6; color: white; &:not(:disabled):hover { background: #2563EB; } }
    .btn-secondary { background: white; color: #374151; border: 1px solid #D1D5DB; &:hover { background: #F3F4F6; } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 0.75rem; width: 100%; max-width: 540px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E5E7EB; h2 { font-size: 1.125rem; font-weight: 700; color: #111827; } }
    .close-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 0.25rem; font-size: 1rem; &:hover { color: #374151; } }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 0.75rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; color: #374151; } input, select, textarea { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; background: white; resize: vertical; &:focus { outline: none; border-color: #3B82F6; } } }
    .req { color: #EF4444; }
    .hint { font-size: 0.75rem; color: #9CA3AF; }
    .checkbox-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; cursor: pointer; input { cursor: pointer; } }
    .field-error { font-size: 0.75rem; color: #EF4444; }
    .alert-error { padding: 0.75rem 1rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 0.5rem; color: #991B1B; font-size: 0.875rem; }
  `]
})
export class CustomFieldsComponent implements OnInit {
  private http = inject(HttpClient);

  entityTab = signal(0);
  loading = signal(true);
  allFields = signal<CustomFieldDef[]>([]);
  showInactive = false;

  customerFields = computed(() => this.allFields().filter(f => f.entityType === 0));
  productFields = computed(() => this.allFields().filter(f => f.entityType === 1));

  showModal = signal(false);
  saving = signal(false);
  submitted = signal(false);
  saveError = signal('');
  editingId: string | null = null;

  form = this.defaultForm();
  readonly Number = Number;

  private defaultForm() {
    return {
      entityType: '0', fieldKey: '', displayName: '', fieldType: '0',
      isRequired: false, defaultValue: '', groupName: '', displayOrder: 0,
      selectOptionsText: ''
    };
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const activeOnly = this.showInactive ? 'false' : 'true';
    Promise.all([
      this.http.get<CustomFieldDef[]>(`${environment.apiUrl}/admin/custom-fields?entityType=0&activeOnly=${activeOnly}`).toPromise(),
      this.http.get<CustomFieldDef[]>(`${environment.apiUrl}/admin/custom-fields?entityType=1&activeOnly=${activeOnly}`).toPromise()
    ]).then(([cust, prod]) => {
      this.allFields.set([...(cust ?? []), ...(prod ?? [])]);
      this.loading.set(false);
    });
  }

  switchTab(t: number) { this.entityTab.set(t); }

  fieldTypeLabel(t: number) { return FIELD_TYPE_LABEL[t] ?? t; }

  slugify(v: string) { return v.toLowerCase().replace(/[^a-z0-9_]/g, '_'); }

  openCreate() {
    this.editingId = null;
    this.form = this.defaultForm();
    this.form.entityType = String(this.entityTab());
    this.submitted.set(false);
    this.saveError.set('');
    this.showModal.set(true);
  }

  openEdit(f: CustomFieldDef) {
    this.editingId = f.id;
    this.form = {
      entityType: String(f.entityType),
      fieldKey: f.fieldKey,
      displayName: f.displayName,
      fieldType: String(f.fieldType),
      isRequired: f.isRequired,
      defaultValue: f.defaultValue ?? '',
      groupName: f.groupName ?? '',
      displayOrder: f.displayOrder,
      selectOptionsText: (f.selectOptions ?? []).join('\n')
    };
    this.submitted.set(false);
    this.saveError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    this.submitted.set(true);
    if (!this.form.displayName.trim()) return;
    if (!this.editingId && !this.form.fieldKey.trim()) return;

    this.saving.set(true);
    this.saveError.set('');

    const selectOptions = Number(this.form.fieldType) === 4
      ? this.form.selectOptionsText.split('\n').map(s => s.trim()).filter(Boolean)
      : null;

    if (this.editingId) {
      this.http.put(`${environment.apiUrl}/admin/custom-fields/${this.editingId}`, {
        displayName: this.form.displayName.trim(),
        isRequired: this.form.isRequired,
        defaultValue: this.form.defaultValue.trim() || null,
        selectOptions,
        validationRules: null,
        displayOrder: Number(this.form.displayOrder),
        groupName: this.form.groupName.trim() || null
      }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: err => { this.saving.set(false); this.saveError.set(err.error?.detail ?? 'Kaydedilemedi'); }
      });
    } else {
      this.http.post(`${environment.apiUrl}/admin/custom-fields`, {
        entityType: Number(this.form.entityType),
        fieldKey: this.form.fieldKey.trim(),
        displayName: this.form.displayName.trim(),
        fieldType: Number(this.form.fieldType),
        isRequired: this.form.isRequired,
        defaultValue: this.form.defaultValue.trim() || null,
        selectOptions,
        validationRules: null,
        displayOrder: Number(this.form.displayOrder),
        groupName: this.form.groupName.trim() || null
      }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: err => { this.saving.set(false); this.saveError.set(err.error?.detail ?? 'Kaydedilemedi'); }
      });
    }
  }

  toggle(f: CustomFieldDef) {
    this.http.patch(`${environment.apiUrl}/admin/custom-fields/${f.id}/toggle`, {}).subscribe({
      next: (r: any) => {
        this.allFields.update(fields => fields.map(x => x.id === f.id ? { ...x, isActive: r.isActive } : x));
      }
    });
  }
}
