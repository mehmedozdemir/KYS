import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface CustomFieldDef {
  id: string;
  fieldKey: string;
  displayName: string;
  fieldType: string; // Text | Number | Date | Boolean | Select | Url | Email
  isRequired: boolean;
  defaultValue?: string;
  selectOptions?: string[];
}

@Component({
  selector: 'app-custom-field-inputs',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (defs.length) {
      @if (mode === 'view') {
        <div class="custom-fields-section">
          <h3>Özel Alanlar</h3>
          <div class="info-grid">
            @for (def of defs; track def.id) {
              @let val = values[def.fieldKey];
              <div class="info-item">
                <label>{{ def.displayName }}</label>
                <span>{{ displayValue(def, val) }}</span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="section-title" style="margin-top:0.5rem">Özel Alanlar</div>
        @for (def of defs; track def.id) {
          <div class="form-group">
            <label>{{ def.displayName }} @if (def.isRequired) { <span class="required">*</span> }</label>
            @if (def.fieldType === 'Select') {
              <select [(ngModel)]="editValues[def.fieldKey]">
                <option value="">Seçiniz...</option>
                @for (opt of def.selectOptions ?? []; track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            } @else if (def.fieldType === 'Boolean') {
              <label style="display:flex;align-items:center;gap:0.5rem;font-weight:400;cursor:pointer">
                <input type="checkbox"
                  [checked]="editValues[def.fieldKey] === 'true'"
                  (change)="editValues[def.fieldKey] = $any($event.target).checked ? 'true' : 'false'" />
                Evet
              </label>
            } @else {
              <input [type]="inputType(def.fieldType)"
                [(ngModel)]="editValues[def.fieldKey]"
                [placeholder]="def.defaultValue ?? ''" />
            }
            @if (submitted && def.isRequired && !editValues[def.fieldKey]) {
              <span class="error-msg">{{ def.displayName }} zorunludur</span>
            }
          </div>
        }
      }
    }
  `
})
export class CustomFieldInputsComponent {
  @Input() defs: CustomFieldDef[] = [];
  @Input() values: Record<string, unknown> = {};
  @Input() editValues: Record<string, string> = {};
  @Input() submitted = false;
  @Input() mode: 'view' | 'edit' = 'view';

  inputType(fieldType: string): string {
    switch (fieldType) {
      case 'Number': return 'number';
      case 'Date': return 'date';
      case 'Url': return 'url';
      case 'Email': return 'email';
      default: return 'text';
    }
  }

  displayValue(def: CustomFieldDef, val: unknown): string {
    if (val === undefined || val === null || val === '') return '—';
    if (def.fieldType === 'Boolean') return val ? 'Evet' : 'Hayır';
    return String(val);
  }
}
