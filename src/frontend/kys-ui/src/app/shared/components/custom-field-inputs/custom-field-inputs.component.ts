import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

export interface CustomFieldDef {
  id: string;
  fieldKey: string;
  displayName: string;
  fieldType: string; // Text | Number | Date | Boolean | Select | Url | Email
  isRequired: boolean;
  defaultValue?: string;
  selectOptions?: string[];
  groupName?: string | null;
  displayOrder?: number;
}

interface FieldGroup { name: string | null; defs: CustomFieldDef[]; }

@Component({
  selector: 'app-custom-field-inputs',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
  template: `
    @if (defs.length) {
      @if (mode === 'view') {
        <div class="custom-fields-section">
          @for (group of groups(); track group.name) {
            <h3>{{ group.name ?? ('customFields.title' | transloco) }}</h3>
            <div class="info-grid">
              @for (def of group.defs; track def.id) {
                @let val = values[def.fieldKey];
                <div class="info-item">
                  <label>{{ def.displayName }}</label>
                  @if (isEmpty(val)) {
                    <span class="muted">—</span>
                  } @else if (def.fieldType === 'Url') {
                    <a [href]="val" target="_blank" rel="noopener noreferrer">{{ val }}</a>
                  } @else if (def.fieldType === 'Email') {
                    <a [href]="'mailto:' + val">{{ val }}</a>
                  } @else {
                    <span>{{ displayValue(def, val) }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      } @else {
        @for (group of groups(); track group.name) {
          <div class="section-title" style="margin-top:0.5rem">{{ group.name ?? ('customFields.title' | transloco) }}</div>
          @for (def of group.defs; track def.id) {
            <div class="form-group">
              <label>{{ def.displayName }} @if (def.isRequired) { <span class="required">*</span> }</label>
              @if (def.fieldType === 'Select') {
                <select [(ngModel)]="editValues[def.fieldKey]">
                  <option value="">{{ 'common.select' | transloco }}</option>
                  @for (opt of def.selectOptions ?? []; track opt) {
                    <option [value]="opt">{{ opt }}</option>
                  }
                </select>
              } @else if (def.fieldType === 'Boolean') {
                <label style="display:flex;align-items:center;gap:0.5rem;font-weight:400;cursor:pointer">
                  <input type="checkbox"
                    [checked]="editValues[def.fieldKey] === 'true'"
                    (change)="editValues[def.fieldKey] = $any($event.target).checked ? 'true' : 'false'" />
                  {{ 'common.yes' | transloco }}
                </label>
              } @else {
                <input [type]="inputType(def.fieldType)"
                  [(ngModel)]="editValues[def.fieldKey]"
                  [placeholder]="def.defaultValue ?? ''" />
              }
              @if (submitted && def.isRequired && !editValues[def.fieldKey]) {
                <span class="error-msg">{{ 'common.requiredField' | transloco:{ field: def.displayName } }}</span>
              }
            </div>
          }
        }
      }
    }
  `,
  styles: [`
    :host { display: contents; }

    /* Edit modu */
    .section-title { font-size: 0.8125rem; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; padding-top: 0.5rem; margin-bottom: 0.25rem; border-top: 1px solid var(--border-light); }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 0.875rem;
      label { font-size: 0.875rem; font-weight: 500; color: var(--text); }
      input, select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.875rem; width: 100%; box-sizing: border-box; background: var(--surface); color: var(--text-strong);
        &:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft-bg); } }
    }
    .required { color: var(--danger); }
    .error-msg { font-size: 0.75rem; color: var(--danger); }

    /* View modu */
    .custom-fields-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-light);
      h3 { font-size: 0.9375rem; font-weight: 600; color: var(--text-strong); margin: 0 0 0.75rem; }
      .info-grid + h3 { margin-top: 1.25rem; } }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;
      label { font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.04em; }
      span, a { font-size: 0.875rem; color: var(--text-strong); overflow-wrap: anywhere; }
      a { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } }
      .muted { color: var(--text-subtle); } }
  `]
})
export class CustomFieldInputsComponent {
  private transloco = inject(TranslocoService);

  @Input() defs: CustomFieldDef[] = [];
  @Input() values: Record<string, unknown> = {};
  @Input() editValues: Record<string, string> = {};
  @Input() submitted = false;
  @Input() mode: 'view' | 'edit' = 'view';

  // Tanımdaki "Grup" alanına göre gruplar; grupsuz alanlar genel başlık altında önce gelir.
  groups(): FieldGroup[] {
    const sorted = [...this.defs].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const map = new Map<string | null, CustomFieldDef[]>();
    for (const d of sorted) {
      const key = d.groupName?.trim() || null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a === null ? -1 : b === null ? 1 : 0))
      .map(([name, defs]) => ({ name, defs }));
  }

  inputType(fieldType: string): string {
    switch (fieldType) {
      case 'Number': return 'number';
      case 'Date': return 'date';
      case 'Url': return 'url';
      case 'Email': return 'email';
      default: return 'text';
    }
  }

  isEmpty(val: unknown): boolean {
    return val === undefined || val === null || val === '';
  }

  displayValue(def: CustomFieldDef, val: unknown): string {
    const locale = this.transloco.getActiveLang() === 'en' ? 'en-US' : 'tr-TR';
    switch (def.fieldType) {
      case 'Boolean':
        return this.transloco.translate(val === true || val === 'true' ? 'common.yes' : 'common.no');
      case 'Number': {
        const n = Number(val);
        return Number.isFinite(n) ? n.toLocaleString(locale) : String(val);
      }
      case 'Date': {
        // "2029-06-30" → yerel saat dilimine kaymadan gün olarak biçimlendir
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(val));
        return m
          ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
          : String(val);
      }
      default:
        return String(val);
    }
  }
}
