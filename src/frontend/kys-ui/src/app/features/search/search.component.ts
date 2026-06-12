import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

interface SearchItem {
  id: string;
  name: string;
  subTitle: string | null;
  category: string;
  status: string | null;
}

interface SearchResult {
  customers: SearchItem[];
  products: SearchItem[];
  people: SearchItem[];
  teams: SearchItem[];
  articles: SearchItem[];
}

const CATEGORY_ROUTE: Record<string, string> = {
  Customer: '/customers',
  Product: '/products',
  Person: '/people',
  Team: '/teams',
  Article: '/knowledge-base'
};

const CATEGORY_LABEL_KEY: Record<string, string> = {
  Customer: 'search.catCustomer',
  Product: 'search.catProduct',
  Person: 'search.catPerson',
  Team: 'search.catTeam',
  Article: 'search.catArticle'
};

const CATEGORY_ICON: Record<string, string> = {
  Customer: 'pi-building',
  Product: 'pi-box',
  Person: 'pi-user',
  Team: 'pi-users',
  Article: 'pi-book'
};

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslocoModule],
  template: `
    <div class="page-content">
      <div class="search-header">
        <div class="search-bar">
          <i class="pi pi-search"></i>
          <input
            type="text"
            [(ngModel)]="query"
            (ngModelChange)="onQueryChange($event)"
            [placeholder]="'search.placeholder' | transloco"
            class="search-input"
            autofocus />
        </div>
        @if (query.length >= 2) {
          <p class="result-summary">
            @if (loading()) { {{ 'search.searching' | transloco }} }
            @else { {{ 'search.resultCount' | transloco:{ count: totalCount() } }} }
          </p>
        }
      </div>

      @if (!loading() && query.length >= 2) {
        @if (totalCount() === 0) {
          <div class="empty-state">
            <i class="pi pi-search" style="font-size:2rem;color:var(--border-strong)"></i>
            <p>{{ 'search.noResults' | transloco:{ query: query } }}</p>
          </div>
        } @else {
          <div class="results-container">
            @for (group of resultGroups(); track group.labelKey) {
              @if (group.items.length) {
                <div class="result-group">
                  <div class="group-header">
                    <i class="pi" [class]="group.icon"></i>
                    <span>{{ group.labelKey | transloco }}</span>
                    <span class="count">{{ group.items.length }}</span>
                  </div>
                  <div class="result-list">
                    @for (item of group.items; track item.id) {
                      <a [routerLink]="[group.route, item.id]" class="result-item">
                        <div class="result-name">{{ item.name }}</div>
                        @if (item.subTitle) {
                          <div class="result-sub">{{ item.subTitle }}</div>
                        }
                        @if (item.status) {
                          <span class="result-status">{{ item.status }}</span>
                        }
                      </a>
                    }
                  </div>
                </div>
              }
            }
          </div>
        }
      } @else if (query.length === 0) {
        <div class="empty-state">
          <i class="pi pi-search" style="font-size:2rem;color:var(--border-strong)"></i>
          <p>{{ 'search.prompt' | transloco }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .search-header { margin-bottom: 1.5rem; }
    .search-bar {
      display: flex; align-items: center; gap: 0.75rem;
      background: var(--surface); border: 2px solid var(--primary); border-radius: 0.75rem;
      padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(59,130,246,0.1);
      i { color: var(--text-subtle); font-size: 1.125rem; flex-shrink: 0; }
    }
    .search-input { border: none; outline: none; font-size: 1rem; color: var(--text-strong); width: 100%; background: transparent; }
    .result-summary { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.625rem; padding-left: 0.25rem; }

    .empty-state { text-align: center; padding: 4rem; color: var(--text-subtle); p { margin-top: 0.75rem; font-size: 0.875rem; } }

    .results-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .result-group { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .group-header {
      display: flex; align-items: center; gap: 0.625rem;
      padding: 0.75rem 1rem; background: var(--surface-2); border-bottom: 1px solid var(--border);
      font-size: 0.8125rem; font-weight: 600; color: var(--text);
      i { color: var(--text-muted); }
    }
    .count { margin-left: auto; background: var(--border); color: var(--text-muted); padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; }

    .result-list { display: flex; flex-direction: column; }
    .result-item {
      display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
      padding: 0.75rem 1rem; text-decoration: none;
      border-bottom: 1px solid var(--surface-3);
      &:last-child { border-bottom: none; }
      &:hover { background: var(--surface-2); }
    }
    .result-name { font-size: 0.875rem; font-weight: 500; color: var(--text-strong); }
    .result-sub { font-size: 0.8125rem; color: var(--text-muted); }
    .result-status { font-size: 0.75rem; color: var(--text-subtle); background: var(--surface-3); padding: 0.125rem 0.5rem; border-radius: 9999px; margin-left: auto; }
  `]
})
export class SearchComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  query = '';
  loading = signal(false);
  result = signal<SearchResult | null>(null);
  private search$ = new Subject<string>();

  totalCount() {
    const r = this.result();
    if (!r) return 0;
    return r.customers.length + r.products.length + r.people.length + r.teams.length + r.articles.length;
  }

  resultGroups() {
    const r = this.result();
    if (!r) return [];
    return [
      { labelKey: CATEGORY_LABEL_KEY['Customer'], icon: 'pi-' + CATEGORY_ICON['Customer'], route: CATEGORY_ROUTE['Customer'], items: r.customers },
      { labelKey: CATEGORY_LABEL_KEY['Product'], icon: 'pi-' + CATEGORY_ICON['Product'], route: CATEGORY_ROUTE['Product'], items: r.products },
      { labelKey: CATEGORY_LABEL_KEY['Person'], icon: 'pi-' + CATEGORY_ICON['Person'], route: CATEGORY_ROUTE['Person'], items: r.people },
      { labelKey: CATEGORY_LABEL_KEY['Team'], icon: 'pi-' + CATEGORY_ICON['Team'], route: CATEGORY_ROUTE['Team'], items: r.teams },
      { labelKey: CATEGORY_LABEL_KEY['Article'], icon: 'pi-' + CATEGORY_ICON['Article'], route: CATEGORY_ROUTE['Article'], items: r.articles },
    ].filter(g => g.items.length > 0);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.query = params['q'];
        this.doSearch(this.query);
      }
    });

    this.search$.pipe(debounceTime(350), distinctUntilChanged()).subscribe(q => {
      this.router.navigate([], { queryParams: { q: q || null }, queryParamsHandling: 'merge', replaceUrl: true });
      if (q.length >= 2) this.doSearch(q);
      else this.result.set(null);
    });
  }

  onQueryChange(q: string) { this.search$.next(q); }

  private doSearch(q: string) {
    this.loading.set(true);
    this.http.get<SearchResult>(`${environment.apiUrl}/search?q=${encodeURIComponent(q)}&limit=8`).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
