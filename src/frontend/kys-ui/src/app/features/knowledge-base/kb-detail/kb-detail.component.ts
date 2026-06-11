import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';

const VIS_CSS: Record<string, string> = { Internal: 'badge--internal', TeamOnly: 'badge--team', Public: 'badge--public' };

interface ArticleDetail {
  id: string;
  title: string;
  content: string;
  visibility: string;
  productId: string | null;
  productName: string | null;
  customerId: string | null;
  customerName: string | null;
  teamId: string | null;
  teamName: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-kb-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslocoModule],
  template: `
    <div class="page-content">
      @if (loading()) {
        <div class="loading-state">{{ 'common.loading' | transloco }}</div>
      } @else if (!article()) {
        <div class="loading-state">{{ 'kb.notFound' | transloco }} <a routerLink="/knowledge-base">{{ 'common.goBack' | transloco }}</a></div>
      } @else {
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a routerLink="/knowledge-base">{{ 'kb.title' | transloco }}</a>
          <span>/</span>
          <span>{{ article()!.title }}</span>
        </div>

        <div class="layout">
          <!-- Main article -->
          <article class="article-body">
            <div class="article-title-row">
              <h1>{{ article()!.title }}</h1>
              <a [routerLink]="['/knowledge-base', article()!.id, 'edit']" class="btn btn-secondary">
                <i class="pi pi-pencil"></i> {{ 'common.edit' | transloco }}
              </a>
            </div>

            <div class="article-content" [innerHTML]="renderedContent()"></div>
          </article>

          <!-- Sidebar -->
          <aside class="sidebar">
            <div class="sidebar-section">
              <h4>{{ 'kb.visibility' | transloco }}</h4>
              <span class="badge" [class]="visCss(article()!.visibility)">{{ 'type.kbVisibility.' + article()!.visibility | transloco }}</span>
            </div>

            @if (article()!.tags.length) {
              <div class="sidebar-section">
                <h4>{{ 'kb.tags' | transloco }}</h4>
                <div class="tag-list">
                  @for (tag of article()!.tags; track tag) {
                    <a [routerLink]="['/knowledge-base']" [queryParams]="{tag}" class="tag">{{ tag }}</a>
                  }
                </div>
              </div>
            }

            @if (article()!.productName) {
              <div class="sidebar-section">
                <h4>{{ 'kb.product' | transloco }}</h4>
                <a [routerLink]="['/products', article()!.productId]" class="ctx-link">
                  <i class="pi pi-box"></i> {{ article()!.productName }}
                </a>
              </div>
            }

            @if (article()!.customerName) {
              <div class="sidebar-section">
                <h4>{{ 'kb.customer' | transloco }}</h4>
                <a [routerLink]="['/customers', article()!.customerId]" class="ctx-link">
                  <i class="pi pi-building"></i> {{ article()!.customerName }}
                </a>
              </div>
            }

            @if (article()!.teamName) {
              <div class="sidebar-section">
                <h4>{{ 'kb.team' | transloco }}</h4>
                <a [routerLink]="['/teams', article()!.teamId]" class="ctx-link">
                  <i class="pi pi-users"></i> {{ article()!.teamName }}
                </a>
              </div>
            }

            <div class="sidebar-section meta-dates">
              <div>
                <span class="meta-lbl">{{ 'kb.createdAt' | transloco }}</span>
                <span class="meta-val">{{ article()!.createdAt | date:'dd.MM.yyyy' }}</span>
              </div>
              <div>
                <span class="meta-lbl">{{ 'kb.updatedAt' | transloco }}</span>
                <span class="meta-val">{{ article()!.updatedAt | date:'dd.MM.yyyy HH:mm' }}</span>
              </div>
            </div>

            <div class="sidebar-section">
              <button class="btn-danger-sm" (click)="confirmDelete()">
                <i class="pi pi-trash"></i> {{ 'kb.deleteArticle' | transloco }}
              </button>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .loading-state { text-align: center; padding: 4rem; color: var(--text-subtle); }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.25rem; a { color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } } }

    .layout { display: grid; grid-template-columns: 1fr 220px; gap: 1.5rem; align-items: start; }
    @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } }

    .article-body { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); min-width: 0; }
    .article-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; h1 { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); flex: 1; } }

    .article-content {
      font-size: 0.9375rem; line-height: 1.75; color: var(--text);
      h1,h2,h3,h4 { font-weight: 700; color: var(--text-strong); margin: 1.5rem 0 0.5rem; }
      h1 { font-size: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
      h2 { font-size: 1.25rem; }
      h3 { font-size: 1.125rem; }
      p { margin: 0.75rem 0; }
      ul, ol { padding-left: 1.5rem; margin: 0.75rem 0; }
      li { margin: 0.25rem 0; }
      code { background: var(--surface-3); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875em; color: var(--text-strong); }
      pre { background: var(--text-strong); color: var(--border); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; code { background: none; color: inherit; padding: 0; } }
      blockquote { border-left: 4px solid var(--primary); margin: 1rem 0; padding: 0.5rem 1rem; background: var(--primary-soft-bg); color: var(--primary-soft-text); border-radius: 0 0.375rem 0.375rem 0; p { margin: 0; } }
      a { color: var(--primary); text-decoration: underline; }
      table { border-collapse: collapse; width: 100%; margin: 1rem 0; th,td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; } th { background: var(--surface-2); font-weight: 600; } }
      hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
    }

    .sidebar { display: flex; flex-direction: column; gap: 0; }
    .sidebar-section { background: var(--surface); border: 1px solid var(--border); border-top: none; padding: 0.875rem 1rem; &:first-child { border-top: 1px solid var(--border); border-radius: 0.75rem 0.75rem 0 0; } &:last-child { border-radius: 0 0 0.75rem 0.75rem; } h4 { font-size: 0.75rem; font-weight: 600; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; } }
    .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge--internal { background: var(--surface-3); color: var(--text-muted); }
    .badge--team { background: var(--primary-soft-bg-2); color: var(--primary-soft-text); }
    .badge--public { background: var(--success-soft-bg); color: var(--success-soft-text); }
    .tag-list { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .tag { background: var(--surface-3); color: var(--text); padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; text-decoration: none; &:hover { background: var(--border); } }
    .ctx-link { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--primary); text-decoration: none; &:hover { text-decoration: underline; } i { font-size: 0.8rem; } }
    .meta-dates { display: flex; flex-direction: column; gap: 0.5rem; }
    .meta-lbl { display: block; font-size: 0.7rem; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-val { font-size: 0.8125rem; color: var(--text); }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; text-decoration: none; }
    .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); &:hover { background: var(--surface-3); } }
    .btn-danger-sm { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.375rem; padding: 0.5rem; border-radius: 0.375rem; font-size: 0.8125rem; color: var(--danger); background: none; border: 1px solid var(--danger-border); cursor: pointer; &:hover { background: var(--danger-faint-bg); } }
  `]
})
export class KbDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  article = signal<ArticleDetail | null>(null);
  loading = signal(true);
  renderedContent = signal<SafeHtml>('');

  private transloco = inject(TranslocoService);
  visCss(v: string) { return VIS_CSS[v] ?? ''; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<ArticleDetail>(`${environment.apiUrl}/knowledge-base/${id}`).subscribe({
      next: a => {
        this.article.set(a);
        this.loading.set(false);
        const html = marked.parse(a.content) as string;
        this.renderedContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
      },
      error: () => this.loading.set(false)
    });
  }

  confirmDelete() {
    if (!confirm(this.transloco.translate('kb.deleteConfirm'))) return;
    const id = this.article()!.id;
    this.http.delete(`${environment.apiUrl}/knowledge-base/${id}`).subscribe({
      next: () => this.router.navigate(['/knowledge-base'])
    });
  }
}
