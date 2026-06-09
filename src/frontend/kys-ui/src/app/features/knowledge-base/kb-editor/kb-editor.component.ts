import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';

interface ArticleDetail {
  id: string;
  title: string;
  content: string;
  visibility: string;
  productId: string | null;
  customerId: string | null;
  teamId: string | null;
  tags: string[];
}

@Component({
  selector: 'app-kb-editor',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-content">
      <div class="breadcrumb">
        <a routerLink="/knowledge-base">Bilgi Bankası</a>
        <span>/</span>
        <span>{{ isEdit() ? 'Düzenle' : 'Yeni Makale' }}</span>
      </div>

      <div class="editor-header">
        <input
          type="text"
          class="title-input"
          placeholder="Makale başlığı..."
          [(ngModel)]="form.title"
        />
        @if (submitted() && !form.title.trim()) {
          <span class="field-error">Başlık zorunludur</span>
        }
      </div>

      <div class="editor-layout">
        <!-- Left: editor + metadata -->
        <div class="editor-col">
          <div class="toolbar-row">
            <span class="mode-label">Markdown Editör</span>
            <button class="preview-toggle" (click)="showPreview.set(!showPreview())">
              <i class="pi" [class]="showPreview() ? 'pi-eye-slash' : 'pi-eye'"></i>
              {{ showPreview() ? 'Önizlemeyi Gizle' : 'Önizle' }}
            </button>
          </div>

          @if (!showPreview()) {
            <textarea
              class="content-editor"
              placeholder="Markdown formatında yazın..."
              [(ngModel)]="form.content"
              (ngModelChange)="updatePreview()"
              rows="24"
            ></textarea>
          } @else {
            <div class="preview-area" [innerHTML]="previewHtml()"></div>
          }
        </div>

        <!-- Right: metadata panel -->
        <aside class="meta-panel">
          <div class="meta-section">
            <label>Görünürlük</label>
            <select [(ngModel)]="form.visibility">
              <option value="Internal">Dahili (sadece platform kullanıcıları)</option>
              <option value="TeamOnly">Ekip (ilgili ekip)</option>
              <option value="Public">Herkese Açık</option>
            </select>
          </div>

          <div class="meta-section">
            <label>Etiketler</label>
            <div class="tag-input-row">
              <input type="text" [(ngModel)]="tagInput" placeholder="Etiket ekle..." (keydown.enter)="addTag(); $event.preventDefault()" />
              <button class="btn-add-tag" (click)="addTag()"><i class="pi pi-plus"></i></button>
            </div>
            @if (form.tags.length) {
              <div class="tag-list">
                @for (tag of form.tags; track tag) {
                  <span class="tag">
                    {{ tag }}
                    <button (click)="removeTag(tag)"><i class="pi pi-times"></i></button>
                  </span>
                }
              </div>
            }
          </div>

          <div class="meta-section meta-note">
            <p><i class="pi pi-info-circle"></i> İsteğe bağlı: makaleyi bir ürün, müşteri veya ekiple ilişkilendirebilirsiniz.</p>
          </div>

          @if (saveError()) {
            <div class="alert-error">{{ saveError() }}</div>
          }

          <div class="action-buttons">
            <a routerLink="/knowledge-base" class="btn btn-secondary">İptal</a>
            <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
              {{ saving() ? 'Kaydediliyor...' : (isEdit() ? 'Güncelle' : 'Yayınla') }}
            </button>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.25rem; a { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } } }

    .editor-header { margin-bottom: 1rem; }
    .title-input { width: 100%; padding: 0.75rem 1rem; font-size: 1.25rem; font-weight: 600; border: 1px solid var(--border-strong); border-radius: 0.5rem; color: var(--text-strong); box-sizing: border-box; &:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); } &::placeholder { color: var(--border-strong); } }
    .field-error { font-size: 0.75rem; color: var(--danger); margin-top: 0.25rem; display: block; }

    .editor-layout { display: grid; grid-template-columns: 1fr 240px; gap: 1.25rem; align-items: start; }
    @media (max-width: 900px) { .editor-layout { grid-template-columns: 1fr; } }

    .editor-col { display: flex; flex-direction: column; gap: 0; }
    .toolbar-row { display: flex; align-items: center; justify-content: space-between; background: var(--surface-2); border: 1px solid var(--border); border-bottom: none; border-radius: 0.5rem 0.5rem 0 0; padding: 0.5rem 0.75rem; }
    .mode-label { font-size: 0.8125rem; font-weight: 500; color: var(--text-muted); }
    .preview-toggle { background: none; border: none; cursor: pointer; font-size: 0.8125rem; color: var(--primary); display: flex; align-items: center; gap: 0.375rem; &:hover { text-decoration: underline; } }
    .content-editor { width: 100%; padding: 1rem; border: 1px solid var(--border); border-radius: 0 0 0.5rem 0.5rem; font-family: 'Courier New', monospace; font-size: 0.875rem; line-height: 1.75; color: var(--text); resize: vertical; min-height: 480px; box-sizing: border-box; &:focus { outline: none; border-color: var(--primary); } }
    .preview-area {
      min-height: 480px; padding: 1rem; border: 1px solid var(--border); border-radius: 0 0 0.5rem 0.5rem; background: var(--surface);
      font-size: 0.9375rem; line-height: 1.75; color: var(--text);
      h1,h2,h3,h4 { font-weight: 700; color: var(--text-strong); margin: 1.5rem 0 0.5rem; }
      h1 { font-size: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
      h2 { font-size: 1.25rem; }
      h3 { font-size: 1.125rem; }
      p { margin: 0.75rem 0; }
      ul,ol { padding-left: 1.5rem; margin: 0.75rem 0; }
      code { background: var(--surface-3); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875em; }
      pre { background: var(--text-strong); color: var(--border); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; code { background: none; color: inherit; } }
      blockquote { border-left: 4px solid var(--primary); margin: 1rem 0; padding: 0.5rem 1rem; background: var(--primary-soft-bg); border-radius: 0 0.375rem 0.375rem 0; }
    }

    .meta-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .meta-section { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.8125rem; font-weight: 600; color: var(--text); } select,input { padding: 0.5rem 0.625rem; border: 1px solid var(--border-strong); border-radius: 0.375rem; font-size: 0.8125rem; width: 100%; box-sizing: border-box; &:focus { outline: none; border-color: var(--primary); } } }
    .tag-input-row { display: flex; gap: 0.5rem; input { flex: 1; } }
    .btn-add-tag { background: var(--primary); color: white; border: none; border-radius: 0.375rem; padding: 0 0.625rem; cursor: pointer; font-size: 0.875rem; flex-shrink: 0; &:hover { background: var(--primary-hover); } }
    .tag-list { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .tag { display: inline-flex; align-items: center; gap: 0.25rem; background: var(--indigo-soft-bg); color: var(--indigo-strong); padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; button { background: none; border: none; cursor: pointer; color: var(--indigo); padding: 0; font-size: 0.7rem; line-height: 1; display: flex; align-items: center; } }
    .meta-note { p { font-size: 0.75rem; color: var(--text-subtle); display: flex; align-items: flex-start; gap: 0.375rem; i { flex-shrink: 0; margin-top: 0.125rem; } } }
    .alert-error { padding: 0.75rem; background: var(--danger-faint-bg); border: 1px solid var(--danger-border); border-radius: 0.375rem; color: var(--danger-soft-text); font-size: 0.8125rem; }

    .action-buttons { display: flex; flex-direction: column; gap: 0.5rem; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; text-decoration: none; &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-primary { background: var(--primary); color: white; &:not(:disabled):hover { background: var(--primary-hover); } }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--surface-3); } }
  `]
})
export class KbEditorComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  isEdit = signal(false);
  saving = signal(false);
  submitted = signal(false);
  saveError = signal('');
  showPreview = signal(false);
  previewHtml = signal<SafeHtml>('');
  tagInput = '';

  form = {
    title: '',
    content: '',
    visibility: 'Internal',
    tags: [] as string[],
    productId: null as string | null,
    customerId: null as string | null,
    teamId: null as string | null,
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.http.get<ArticleDetail>(`${environment.apiUrl}/knowledge-base/${id}`).subscribe({
        next: a => {
          this.form.title = a.title;
          this.form.content = a.content;
          this.form.visibility = a.visibility;
          this.form.tags = [...a.tags];
          this.form.productId = a.productId;
          this.form.customerId = a.customerId;
          this.form.teamId = a.teamId;
          this.updatePreview();
        }
      });
    }
  }

  updatePreview() {
    if (this.form.content) {
      const html = marked.parse(this.form.content) as string;
      this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
    }
  }

  addTag() {
    const tag = this.tagInput.trim();
    if (tag && !this.form.tags.includes(tag)) {
      this.form.tags = [...this.form.tags, tag];
    }
    this.tagInput = '';
  }

  removeTag(tag: string) {
    this.form.tags = this.form.tags.filter(t => t !== tag);
  }

  save() {
    this.submitted.set(true);
    if (!this.form.title.trim()) return;
    this.saving.set(true);
    this.saveError.set('');

    const body = {
      title: this.form.title,
      content: this.form.content,
      visibility: this.form.visibility,
      productId: this.form.productId,
      customerId: this.form.customerId,
      teamId: this.form.teamId,
      tags: this.form.tags,
    };

    const id = this.route.snapshot.paramMap.get('id');
    const req = this.isEdit()
      ? this.http.put(`${environment.apiUrl}/knowledge-base/${id}`, body)
      : this.http.post<{ id: string }>(`${environment.apiUrl}/knowledge-base`, body);

    req.subscribe({
      next: (res: any) => {
        this.saving.set(false);
        const targetId = this.isEdit() ? id : res?.id;
        this.router.navigate(['/knowledge-base', targetId]);
      },
      error: err => {
        this.saving.set(false);
        this.saveError.set(err.error?.detail ?? 'Makale kaydedilemedi');
      }
    });
  }
}
