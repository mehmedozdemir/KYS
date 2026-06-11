import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';

// KbVisibility: 0=Internal, 1=TeamOnly, 2=Public
const VIS_CSS: Record<string, string> = { Internal: 'badge--internal', TeamOnly: 'badge--team', Public: 'badge--public' };

interface ArticleSummary {
  id: string;
  title: string;
  visibility: string;
  productId: string | null;
  productName: string | null;
  customerId: string | null;
  customerName: string | null;
  teamId: string | null;
  teamName: string | null;
  tags: string[];
  updatedAt: string;
}

interface ArticleListResult {
  items: ArticleSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-kb-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, TranslocoModule],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'kb.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'kb.count' | transloco:{ count: totalCount() } }}</p>
        </div>
        <a routerLink="/knowledge-base/new" class="btn btn-primary">
          <i class="pi pi-plus"></i> {{ 'kb.new' | transloco }}
        </a>
      </div>

      <!-- Filters -->
      <div class="toolbar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input type="text" [placeholder]="'kb.searchPlaceholder' | transloco" [(ngModel)]="searchInput" (ngModelChange)="onSearch($event)" />
        </div>
        <select [(ngModel)]="filterTag" (ngModelChange)="onFilterChange()">
          <option value="">{{ 'kb.allTags' | transloco }}</option>
          @for (tag of tags(); track tag) {
            <option [value]="tag">{{ tag }}</option>
          }
        </select>
        <select [(ngModel)]="filterVis" (ngModelChange)="onFilterChange()">
          <option value="">{{ 'kb.allVisibility' | transloco }}</option>
          <option value="Internal">{{ 'type.kbVisibility.Internal' | transloco }}</option>
          <option value="TeamOnly">{{ 'type.kbVisibility.TeamOnly' | transloco }}</option>
          <option value="Public">{{ 'type.kbVisibility.Public' | transloco }}</option>
        </select>
      </div>

      <!-- Active tag filter chips -->
      @if (filterTag) {
        <div class="filter-chips">
          <span class="chip">
            <i class="pi pi-tag"></i> {{ filterTag }}
            <button (click)="filterTag = ''; onFilterChange()"><i class="pi pi-times"></i></button>
          </span>
        </div>
      }

      @if (loading()) {
        <div class="loading-state">{{ 'common.loading' | transloco }}</div>
      } @else if (!articles().length) {
        <div class="empty-state">
          <i class="pi pi-book"></i>
          <p>{{ 'kb.notFound' | transloco }}</p>
        </div>
      } @else {
        <div class="article-list">
          @for (a of articles(); track a.id) {
            <a [routerLink]="['/knowledge-base', a.id]" class="article-card">
              <div class="article-main">
                <div class="article-header">
                  <h3 class="article-title">{{ a.title }}</h3>
                  <span class="badge" [class]="visCss(a.visibility)">{{ 'type.kbVisibility.' + a.visibility | transloco }}</span>
                </div>
                <div class="article-meta">
                  @if (a.productName) {
                    <span class="meta-item"><i class="pi pi-box"></i> {{ a.productName }}</span>
                  }
                  @if (a.customerName) {
                    <span class="meta-item"><i class="pi pi-building"></i> {{ a.customerName }}</span>
                  }
                  @if (a.teamName) {
                    <span class="meta-item"><i class="pi pi-users"></i> {{ a.teamName }}</span>
                  }
                  <span class="meta-item muted"><i class="pi pi-clock"></i> {{ a.updatedAt | date:'dd.MM.yyyy' }}</span>
                </div>
                @if (a.tags.length) {
                  <div class="tag-list">
                    @for (tag of a.tags; track tag) {
                      <span class="tag" (click)="setTagFilter(tag, $event)">{{ tag }}</span>
                    }
                  </div>
                }
              </div>
              <i class="pi pi-chevron-right arrow"></i>
            </a>
          }
        </div>
        @if (totalCount() > pageSize) {
          <div class="pagination">
            <button class="page-btn" [disabled]="page() === 1" (click)="goToPage(page() - 1)">
              <i class="pi pi-chevron-left"></i>
            </button>
            <span class="page-info">{{ page() }} / {{ totalPages() }}</span>
            <button class="page-btn" [disabled]="page() === totalPages()" (click)="goToPage(page() + 1)">
              <i class="pi pi-chevron-right"></i>
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-strong); }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .toolbar { display: flex; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap; align-items: center; }
    .search-box {
      position: relative; flex: 1; min-width: 200px; max-width: 320px;
      i { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-subtle); font-size: 0.875rem; }
      input { width: 100%; padding: 0.5rem 0.75rem 0.5rem 2.25rem; border: 1px solid var(--border-strong); border-radius: 0.5rem; font-size: 0.875rem; box-sizing: border-box; }
    }
    select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 0.5rem; font-size: 0.875rem; color: var(--text); background: var(--surface); }

    .filter-chips { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .chip { display: inline-flex; align-items: center; gap: 0.375rem; background: var(--indigo-soft-bg); color: var(--indigo-strong); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8125rem; button { background: none; border: none; cursor: pointer; color: var(--indigo); padding: 0; font-size: 0.75rem; line-height: 1; } i:first-child { font-size: 0.75rem; } }

    .loading-state { text-align: center; padding: 4rem; color: var(--text-subtle); }
    .empty-state { text-align: center; padding: 4rem; color: var(--text-subtle); i { font-size: 2.5rem; margin-bottom: 0.75rem; display: block; } p { font-size: 0.875rem; } }

    .article-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .article-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem;
      padding: 1.25rem; display: flex; align-items: center; gap: 1rem;
      text-decoration: none; transition: box-shadow 0.15s, border-color 0.15s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      &:hover { border-color: var(--primary); box-shadow: 0 2px 8px rgba(59,130,246,0.12); }
    }
    .article-main { flex: 1; min-width: 0; }
    .article-header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .article-title { font-size: 1rem; font-weight: 600; color: var(--text-strong); flex: 1; min-width: 0; }
    .article-meta { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .meta-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--text); i { font-size: 0.75rem; color: var(--text-subtle); } &.muted { color: var(--text-subtle); } }
    .tag-list { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .tag { background: var(--surface-3); color: var(--text); padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; cursor: pointer; &:hover { background: var(--border); } }
    .arrow { color: var(--border-strong); font-size: 0.875rem; flex-shrink: 0; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; }
    .page-btn { background: none; border: 1px solid var(--border-strong); border-radius: 0.375rem; padding: 0.375rem 0.625rem; cursor: pointer; color: var(--text); &:disabled { opacity: 0.4; cursor: not-allowed; } &:not(:disabled):hover { background: var(--surface-3); } }
    .page-info { font-size: 0.875rem; color: var(--text-muted); }

    .badge { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
    .badge--internal { background: var(--surface-3); color: var(--text-muted); }
    .badge--team { background: var(--primary-soft-bg-2); color: var(--primary-soft-text); }
    .badge--public { background: var(--success-soft-bg); color: var(--success-soft-text); }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; text-decoration: none; }
    .btn-primary { background: var(--primary); color: white; &:hover { background: var(--primary-hover); } }
  `]
})
export class KbListComponent implements OnInit {
  private http = inject(HttpClient);

  articles = signal<ArticleSummary[]>([]);
  tags = signal<string[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  searchInput = '';
  filterTag = '';
  filterVis = '';
  private searchSubject = new Subject<string>();

  visCss(v: string) { return VIS_CSS[v] ?? ''; }

  ngOnInit() {
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page.set(1); this.load();
    });
    this.load();
    this.loadTags();
  }

  onSearch(val: string) { this.searchSubject.next(val); }
  onFilterChange() { this.page.set(1); this.load(); }

  setTagFilter(tag: string, event: Event) {
    event.preventDefault();
    this.filterTag = this.filterTag === tag ? '' : tag;
    this.page.set(1);
    this.load();
  }

  load() {
    this.loading.set(true);
    const params: Record<string, string> = { page: String(this.page()), pageSize: String(this.pageSize) };
    if (this.searchInput.trim()) params['search'] = this.searchInput.trim();
    if (this.filterTag) params['tag'] = this.filterTag;
    const qs = new URLSearchParams(params).toString();
    this.http.get<ArticleListResult>(`${environment.apiUrl}/knowledge-base?${qs}`).subscribe({
      next: r => { this.articles.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadTags() {
    this.http.get<string[]>(`${environment.apiUrl}/knowledge-base/tags`).subscribe({
      next: t => this.tags.set(t)
    });
  }

  goToPage(p: number) { this.page.set(p); this.load(); }
}
