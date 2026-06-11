import { Component, inject, HostListener, signal, ElementRef } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { selectCurrentUser } from '../../core/store/auth/auth.selectors';
import { logout } from '../../core/store/auth/auth.actions';
import { environment } from '../../../environments/environment';
import { ThemeService, THEMES, ThemeId } from '../../core/services/theme.service';
import { LayoutService } from '../../core/services/layout.service';
import { LanguageService } from '../../core/i18n/language.service';
import { TranslocoModule } from '@jsverse/transloco';

interface SearchItem { id: string; name: string; subTitle: string | null; category: string; status: string | null; }
interface SearchResult { customers: SearchItem[]; products: SearchItem[]; people: SearchItem[]; teams: SearchItem[]; articles: SearchItem[]; }

const CATEGORY_LABEL: Record<string, string> = {
  Customer: 'Müşteri', Product: 'Ürün', Person: 'Kişi', Team: 'Ekip', Article: 'KB Makalesi'
};
const CATEGORY_ICON: Record<string, string> = {
  Customer: 'pi-building', Product: 'pi-box', Person: 'pi-user', Team: 'pi-users', Article: 'pi-book'
};
const CATEGORY_ROUTE: Record<string, string> = {
  Customer: '/customers', Product: '/products', Person: '/people', Team: '/teams', Article: '/knowledge-base'
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FormsModule, AsyncPipe, NgClass, RouterLink, TranslocoModule],
  template: `
    <header class="topbar">
      <div class="topbar__left">
      <button class="topbar__menu-btn" (click)="layout.primaryToggle()" [title]="'topbar.menu' | transloco">
        <i class="pi pi-bars"></i>
      </button>
      <div class="topbar__search" [class.topbar__search--active]="showDropdown()">
        <i class="pi pi-search search-icon"></i>
        <input
          #searchInput
          type="text"
          [placeholder]="'topbar.searchPlaceholder' | transloco"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onQueryChange($event)"
          (keyup.enter)="onEnter()"
          (keyup.escape)="closeDropdown()"
          (focus)="onFocus()"
          autocomplete="off" />
        @if (searching()) {
          <i class="pi pi-spin pi-spinner search-spinner"></i>
        } @else if (searchQuery.length > 0) {
          <button class="clear-btn" (click)="clearSearch()"><i class="pi pi-times"></i></button>
        }

        @if (showDropdown() && searchQuery.length >= 3) {
          <div class="search-dropdown">
            @if (hasResults()) {
              @for (group of resultGroups(); track group.category) {
                <div class="result-group">
                  <div class="result-group-header">
                    <i [class]="'pi ' + group.icon"></i>
                    {{ group.label }}
                    <span class="result-count">{{ group.items.length }}</span>
                  </div>
                  @for (item of group.items; track item.id) {
                    <button class="result-item" (click)="navigate(item)">
                      <span class="result-name">{{ item.name }}</span>
                      @if (item.subTitle) {
                        <span class="result-sub">{{ item.subTitle }}</span>
                      }
                      @if (item.status) {
                        <span class="result-status">{{ item.status }}</span>
                      }
                    </button>
                  }
                </div>
              }
              <div class="dropdown-footer">
                <button class="view-all-btn" (click)="onEnter()">
                  <i class="pi pi-search"></i>
                  Tüm sonuçları gör
                </button>
              </div>
            } @else if (!searching()) {
              <div class="no-results">
                <i class="pi pi-inbox"></i>
                <span>"{{ searchQuery }}" için sonuç bulunamadı</span>
              </div>
            }
          </div>
        }
      </div>
      </div>

      <div class="topbar__right">
        <button class="topbar__lang-btn" (click)="lang.toggle()" [title]="'topbar.language' | transloco">
          <i class="pi pi-globe"></i> {{ lang.current().toUpperCase() }}
        </button>
        <div class="theme-menu">
          <button class="topbar__icon-btn" (click)="toggleThemeMenu($event)" [title]="'topbar.theme' | transloco">
            <i class="pi pi-palette"></i>
          </button>
          @if (showThemeMenu()) {
            <div class="theme-dropdown">
              @for (g of themeGroups; track g.group) {
                <div class="theme-group-label">{{ g.group }}</div>
                @for (t of g.items; track t.id) {
                  <button class="theme-option" [class.active]="theme.current() === t.id" (click)="selectTheme(t.id)">
                    <span class="theme-swatch" [style.background]="t.swatch"></span>
                    <span class="theme-option-label">{{ t.label }}</span>
                    @if (theme.current() === t.id) { <i class="pi pi-check"></i> }
                  </button>
                }
              }
            </div>
          }
        </div>
        @if (user$ | async; as user) {
          <a class="topbar__user" routerLink="/account" [title]="'topbar.account' | transloco">
            <i class="pi pi-user"></i> {{ user.fullName }}
          </a>
        }
        <button class="topbar__logout" (click)="onLogout()" [title]="'topbar.logout' | transloco">
          <i class="pi pi-sign-out"></i>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: 64px; background: var(--surface); border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.5rem; flex-shrink: 0; position: relative; z-index: 100;
    }

    .topbar__left { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
    .topbar__menu-btn {
      background: none; border: none; cursor: pointer; color: var(--text-muted);
      font-size: 1.15rem; padding: 0.35rem; border-radius: 0.375rem; display: inline-flex;
      flex-shrink: 0; transition: all 0.15s;
      &:hover { color: var(--primary); background: var(--hover); }
    }
    .topbar__search {
      position: relative; display: flex; align-items: center; gap: 0.5rem;
      background: var(--surface-3); border-radius: 0.5rem; padding: 0.5rem 1rem;
      width: 420px; max-width: 100%; border: 1px solid transparent; transition: all 0.15s;

      &--active, &:focus-within {
        background: var(--surface); border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-soft-bg);
      }
    }
    .search-icon { color: var(--text-subtle); font-size: 0.875rem; flex-shrink: 0; }
    .search-spinner { color: var(--primary); font-size: 0.75rem; flex-shrink: 0; }
    .clear-btn {
      background: none; border: none; cursor: pointer; color: var(--text-subtle);
      padding: 0; font-size: 0.75rem; line-height: 1; flex-shrink: 0;
      &:hover { color: var(--text); }
    }
    input {
      background: transparent; border: none; outline: none;
      font-size: 0.875rem; color: var(--text); width: 100%;
      &::placeholder { color: var(--text-subtle); }
    }

    .search-dropdown {
      position: absolute; top: calc(100% + 0.5rem); left: 0; right: 0;
      background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem;
      box-shadow: var(--shadow-lg); max-height: 480px;
      overflow-y: auto; z-index: 200;
    }

    .result-group { padding: 0.5rem 0; border-bottom: 1px solid var(--border-light); &:last-of-type { border-bottom: none; } }
    .result-group-header {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.375rem 1rem; font-size: 0.6875rem; font-weight: 700;
      color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.06em;
      i { font-size: 0.75rem; }
    }
    .result-count {
      margin-left: auto; background: var(--surface-3); color: var(--text-subtle);
      border-radius: 9999px; padding: 0 0.375rem; font-size: 0.6875rem;
    }

    .result-item {
      display: flex; align-items: center; gap: 0.5rem; width: 100%;
      padding: 0.5rem 1rem; background: none; border: none; text-align: left;
      cursor: pointer; font-size: 0.875rem; color: var(--text);
      &:hover { background: var(--hover); }
    }
    .result-name { font-weight: 500; flex-shrink: 0; }
    .result-sub { font-size: 0.8125rem; color: var(--text-subtle); margin-left: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .result-status {
      margin-left: auto; flex-shrink: 0; font-size: 0.6875rem;
      background: var(--surface-3); color: var(--text-muted); padding: 0.125rem 0.5rem; border-radius: 9999px;
    }

    .dropdown-footer {
      padding: 0.5rem; border-top: 1px solid var(--border-light);
    }
    .view-all-btn {
      width: 100%; padding: 0.5rem 1rem; background: none; border: none;
      cursor: pointer; font-size: 0.8125rem; color: var(--primary); font-weight: 500;
      border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      &:hover { background: var(--primary-soft-bg); }
    }

    .no-results {
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
      padding: 2rem 1rem; color: var(--text-subtle); font-size: 0.875rem;
      i { font-size: 1.5rem; }
    }

    .topbar__right { display: flex; align-items: center; gap: 1rem; }
    .topbar__user { font-size: 0.875rem; font-weight: 500; color: var(--text); text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.6rem; border-radius: 0.5rem; &:hover { background: var(--hover); color: var(--primary); text-decoration: none; } i { font-size: 0.8rem; } }
    .topbar__logout {
      background: none; border: none; cursor: pointer; color: var(--text-muted);
      font-size: 1rem; padding: 0.25rem; border-radius: 0.25rem;
      &:hover { color: var(--danger); }
    }

    .topbar__lang-btn {
      background: none; border: none; cursor: pointer; color: var(--text-muted);
      font-size: 0.8125rem; font-weight: 600; padding: 0.3rem 0.5rem; border-radius: 0.375rem;
      display: inline-flex; align-items: center; gap: 0.3rem;
      &:hover { color: var(--primary); background: var(--hover); }
      i { font-size: 0.9rem; }
    }
    .theme-menu { position: relative; }
    .topbar__icon-btn {
      background: none; border: none; cursor: pointer; color: var(--text-muted);
      font-size: 1rem; padding: 0.25rem; border-radius: 0.25rem; display: flex; align-items: center;
      &:hover { color: var(--primary); }
    }
    .theme-dropdown {
      position: absolute; top: calc(100% + 0.5rem); right: 0;
      background: var(--surface); border: 1px solid var(--border); border-radius: 0.625rem;
      box-shadow: var(--shadow-lg); padding: 0.375rem; min-width: 180px; z-index: 200;
    }
    .theme-group-label {
      font-size: 0.6875rem; font-weight: 700; color: var(--text-subtle);
      text-transform: uppercase; letter-spacing: 0.06em; padding: 0.5rem 0.625rem 0.25rem;
    }
    .theme-option {
      display: flex; align-items: center; gap: 0.5rem; width: 100%;
      padding: 0.5rem 0.625rem; background: none; border: none; cursor: pointer;
      border-radius: 0.375rem; font-size: 0.8125rem; color: var(--text); text-align: left;
      &:hover { background: var(--hover); }
      &.active { color: var(--primary); font-weight: 600; }
      i { margin-left: auto; font-size: 0.75rem; color: var(--primary); }
    }
    .theme-option-label { flex: 1; }
    .theme-swatch {
      width: 1rem; height: 1rem; border-radius: 0.25rem; border: 1px solid var(--border-strong); flex-shrink: 0;
    }
  `]
})
export class TopbarComponent {
  private store = inject(Store);
  private router = inject(Router);
  private http = inject(HttpClient);
  private el = inject(ElementRef);

  readonly theme = inject(ThemeService);
  readonly layout = inject(LayoutService);
  readonly lang = inject(LanguageService);
  readonly themeGroups = [
    { group: 'Açık' as const, items: THEMES.filter(t => t.group === 'Açık') },
    { group: 'Koyu' as const, items: THEMES.filter(t => t.group === 'Koyu') }
  ];
  showThemeMenu = signal(false);

  user$ = this.store.select(selectCurrentUser);
  searchQuery = '';
  showDropdown = signal(false);
  searching = signal(false);
  results = signal<SearchResult | null>(null);

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 3) {
          this.searching.set(false);
          return of(null);
        }
        this.searching.set(true);
        return this.http.get<SearchResult>(`${environment.apiUrl}/search?q=${encodeURIComponent(query)}&limit=5`).pipe(
          catchError(() => of(null))
        );
      })
    ).subscribe(res => {
      this.searching.set(false);
      this.results.set(res);
    });
  }

  onQueryChange(q: string) {
    if (q.length >= 3) {
      this.showDropdown.set(true);
      this.searching.set(true);
    } else {
      this.showDropdown.set(false);
      this.results.set(null);
    }
    this.searchSubject.next(q);
  }

  onFocus() {
    if (this.searchQuery.length >= 3) this.showDropdown.set(true);
  }

  onEnter() {
    if (this.searchQuery.trim().length >= 2) {
      this.closeDropdown();
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.showDropdown.set(false);
    this.results.set(null);
  }

  closeDropdown() {
    this.showDropdown.set(false);
  }

  navigate(item: SearchItem) {
    const base = CATEGORY_ROUTE[item.category] ?? '/';
    this.router.navigate([base, item.id]);
    this.clearSearch();
  }

  hasResults(): boolean {
    const r = this.results();
    if (!r) return false;
    return (r.customers.length + r.products.length + r.people.length + r.teams.length + (r.articles?.length ?? 0)) > 0;
  }

  resultGroups() {
    const r = this.results();
    if (!r) return [];
    return [
      { category: 'Customer', label: CATEGORY_LABEL['Customer'], icon: CATEGORY_ICON['Customer'], items: r.customers },
      { category: 'Product', label: CATEGORY_LABEL['Product'], icon: CATEGORY_ICON['Product'], items: r.products },
      { category: 'Person', label: CATEGORY_LABEL['Person'], icon: CATEGORY_ICON['Person'], items: r.people },
      { category: 'Team', label: CATEGORY_LABEL['Team'], icon: CATEGORY_ICON['Team'], items: r.teams },
      { category: 'Article', label: CATEGORY_LABEL['Article'], icon: CATEGORY_ICON['Article'], items: r.articles ?? [] },
    ].filter(g => g.items.length > 0);
  }

  toggleThemeMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showThemeMenu.update(v => !v);
  }

  selectTheme(id: ThemeId) {
    this.theme.set(id);
    this.showThemeMenu.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeDropdown();
      this.showThemeMenu.set(false);
    }
  }

  onLogout(): void {
    this.store.dispatch(logout());
  }
}
