import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';

interface ArticleSummary {
  id: string;
  title: string;
  visibility: string;
  tags: string[];
  updatedAt: string;
}

/** Müşteri / ürün / ekip sayfalarında o kayda bağlı bilgi bankası makaleleri. */
@Component({
  selector: 'app-related-articles',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslocoModule],
  template: `
    <section class="related">
      <div class="related-header">
        <h3><i class="pi pi-book"></i> {{ 'kb.relatedArticles' | transloco }}
          @if (articles().length) { <span class="count">{{ articles().length }}</span> }
        </h3>
        <a class="new-link" [routerLink]="['/knowledge-base/new']" [queryParams]="linkParams()">
          <i class="pi pi-plus"></i> {{ 'kb.newRelatedArticle' | transloco }}
        </a>
      </div>
      @if (loading()) {
        <p class="muted">{{ 'common.loading' | transloco }}</p>
      } @else if (!articles().length) {
        <p class="muted">{{ 'kb.noRelatedArticles' | transloco }}</p>
      } @else {
        <ul>
          @for (a of articles(); track a.id) {
            <li>
              <a [routerLink]="['/knowledge-base', a.id]" class="title">{{ a.title }}</a>
              <span class="meta">
                {{ 'type.kbVisibility.' + a.visibility | transloco }} · {{ a.updatedAt | date:'dd.MM.yyyy' }}
                @for (t of a.tags.slice(0, 3); track t) { <span class="tag">{{ t }}</span> }
              </span>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    .related { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-light); }
    .related-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.75rem;
      h3 { font-size: 0.9375rem; font-weight: 600; color: var(--text-strong); margin: 0; display: flex; align-items: center; gap: 0.5rem; }
      .count { font-size: 0.7rem; background: var(--surface-3); color: var(--text-muted); padding: 0.0625rem 0.4rem; border-radius: 9999px; } }
    .new-link { font-size: 0.8125rem; color: var(--primary); text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem;
      &:hover { text-decoration: underline; } }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    li { display: flex; flex-direction: column; gap: 0.125rem; padding: 0.5rem 0.75rem; border: 1px solid var(--border-light); border-radius: 0.5rem; background: var(--surface-2); }
    .title { font-size: 0.875rem; font-weight: 500; color: var(--text-strong); text-decoration: none; &:hover { color: var(--primary); } }
    .meta { font-size: 0.75rem; color: var(--text-muted); display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem; }
    .tag { background: var(--surface-3); padding: 0 0.375rem; border-radius: 9999px; font-size: 0.7rem; }
    .muted { font-size: 0.8125rem; color: var(--text-subtle); margin: 0; }
  `]
})
export class RelatedArticlesComponent implements OnChanges {
  private http = inject(HttpClient);

  @Input() customerId: string | null = null;
  @Input() productId: string | null = null;
  @Input() teamId: string | null = null;

  articles = signal<ArticleSummary[]>([]);
  loading = signal(true);

  linkParams(): Record<string, string> {
    const p: Record<string, string> = {};
    if (this.customerId) p['customerId'] = this.customerId;
    if (this.productId) p['productId'] = this.productId;
    if (this.teamId) p['teamId'] = this.teamId;
    return p;
  }

  ngOnChanges() {
    let params = new HttpParams().set('pageSize', 20);
    for (const [k, v] of Object.entries(this.linkParams())) params = params.set(k, v);
    this.loading.set(true);
    this.http.get<{ items: ArticleSummary[] }>(`${environment.apiUrl}/knowledge-base`, { params }).subscribe({
      next: r => { this.articles.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
