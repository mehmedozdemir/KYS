import { Component, computed, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PermissionService } from '../../core/services/permission.service';
import { BrandingService } from '../../core/services/branding.service';
import { LayoutService } from '../../core/services/layout.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

interface NavGroup {
  header?: string;
  adminOnly?: boolean;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar"
      [class.sidebar--collapsed]="collapsedMode()"
      [class.sidebar--mobile-open]="layout.mobileOpen()">

      <div class="sidebar__brand">
        @if (branding.logoUrl(); as logo) {
          <img [src]="logo" alt="logo" class="sidebar__logo-img" />
        } @else {
          <span class="sidebar__logo"><i class="pi pi-th-large"></i></span>
        }
        <div class="sidebar__brand-text">
          <span class="sidebar__subtitle">KURUMSAL YAZILIM SİSTEMİ</span>
        </div>
      </div>

      <nav class="sidebar__nav">
        @for (group of visibleGroups(); track $index) {
          @if (group.header && !collapsedMode()) {
            <button type="button" class="sidebar__group-header" (click)="toggleGroup(group.header)">
              <span>{{ group.header }}</span>
              <i class="pi pi-chevron-down sidebar__chevron" [class.sidebar__chevron--open]="isExpanded(group.header)"></i>
            </button>
          } @else if (group.header && collapsedMode() && !$first) {
            <div class="sidebar__divider"></div>
          }

          @if (showItems(group)) {
            @for (item of group.items; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="sidebar__item--active"
                [routerLinkActiveOptions]="item.exact ? exactMatch : prefixMatch"
                class="sidebar__item"
                [title]="collapsedMode() ? item.label : ''"
                (click)="onNavigate()">
                <i [class]="'pi ' + item.icon"></i>
                <span class="sidebar__label">{{ item.label }}</span>
              </a>
            }
          }
        }
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background: var(--sidebar-bg);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width 0.18s ease, transform 0.22s ease;
    }
    .sidebar__brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--sidebar-border);
      min-height: 64px;
      box-sizing: border-box;
    }
    .sidebar__logo {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--primary);
      color: var(--primary-contrast);
      width: 2rem; height: 2rem;
      border-radius: 0.5rem;
      flex-shrink: 0;
    }
    .sidebar__logo-img { max-height: 36px; max-width: 130px; object-fit: contain; }
    .sidebar__brand-text { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; overflow: hidden; }
    .sidebar__subtitle {
      color: var(--sidebar-header);
      font-size: 0.5625rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .sidebar__nav {
      padding: 0.75rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .sidebar__nav::-webkit-scrollbar { width: 6px; }
    .sidebar__nav::-webkit-scrollbar-thumb { background: var(--sidebar-border); border-radius: 3px; }

    .sidebar__group-header {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; background: none; border: none; cursor: pointer;
      padding: 0.875rem 0.75rem 0.375rem;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--sidebar-header);
      transition: color 0.15s ease;
      &:hover { color: var(--sidebar-text-hover); }
    }
    .sidebar__chevron { font-size: 0.625rem; transition: transform 0.18s ease; }
    .sidebar__chevron--open { transform: rotate(180deg); }
    .sidebar__divider { height: 1px; background: var(--sidebar-border); margin: 0.5rem 0.5rem; }

    .sidebar__item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border-radius: 0.5rem;
      color: var(--sidebar-text);
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;

      &:hover {
        background: var(--sidebar-hover-bg);
        color: var(--sidebar-text-hover);
        text-decoration: none;
      }
      &--active {
        background: var(--sidebar-active-bg);
        color: var(--sidebar-active-text);
        box-shadow: inset 3px 0 0 var(--primary);
      }
      i { font-size: 1rem; width: 1.25rem; text-align: center; flex-shrink: 0; }
    }
    .sidebar__label { overflow: hidden; text-overflow: ellipsis; }

    /* --- Mini (ikon) mod --- */
    .sidebar--collapsed { width: 72px; }
    .sidebar--collapsed .sidebar__brand { justify-content: center; padding: 1.25rem 0; }
    .sidebar--collapsed .sidebar__brand-text { display: none; }
    .sidebar--collapsed .sidebar__nav { padding: 0.75rem 0.5rem; }
    .sidebar--collapsed .sidebar__item { justify-content: center; padding: 0.6rem 0; gap: 0; }
    .sidebar--collapsed .sidebar__label { display: none; }

    /* --- Mobil: off-canvas drawer --- */
    @media (max-width: 1023px) {
      .sidebar {
        position: fixed; top: 0; left: 0; bottom: 0; z-index: 1100;
        transform: translateX(-100%);
        box-shadow: 0 0 40px rgba(0,0,0,0.28);
      }
      .sidebar--mobile-open { transform: translateX(0); }
      .sidebar--collapsed { width: 260px; }
      .sidebar--collapsed .sidebar__brand-text,
      .sidebar--collapsed .sidebar__label { display: revert; }
      .sidebar--collapsed .sidebar__item { justify-content: flex-start; padding: 0.6rem 0.75rem; gap: 0.75rem; }
    }
  `]
})
export class SidebarComponent {
  private permissions = inject(PermissionService);
  private router = inject(Router);
  protected branding = inject(BrandingService);
  protected layout = inject(LayoutService);

  readonly exactMatch = { exact: true };
  readonly prefixMatch = { exact: false };

  readonly collapsedMode = computed(() => this.layout.collapsed() && !this.layout.isMobile());

  private readonly expanded = signal<Set<string>>(new Set(['Çalışma Alanı']));

  private readonly groups: NavGroup[] = [
    {
      items: [
        { label: 'Dashboard', icon: 'pi-home', route: '/dashboard' }
      ]
    },
    {
      header: 'Çalışma Alanı',
      items: [
        { label: 'Müşteriler', icon: 'pi-building', route: '/customers' },
        { label: 'Ürünler', icon: 'pi-box', route: '/products' },
        { label: 'Ekipler', icon: 'pi-users', route: '/teams' },
        { label: 'Kişiler', icon: 'pi-user', route: '/people' },
        { label: 'Bilgi Bankası', icon: 'pi-book', route: '/knowledge-base' }
      ]
    },
    {
      header: 'Tanımlar',
      adminOnly: true,
      items: [
        { label: 'Ortam Tipleri', icon: 'pi-server', route: '/admin/environment-types' },
        { label: 'Barındırma Platformları', icon: 'pi-cloud', route: '/admin/hosting-platforms' },
        { label: 'Kaynak Tipleri', icon: 'pi-database', route: '/admin/resource-types' },
        { label: 'Paylaşımlı Kaynaklar', icon: 'pi-share-alt', route: '/admin/shared-resources' }
      ]
    },
    {
      header: 'Yönetim',
      adminOnly: true,
      items: [
        { label: 'Genel Bakış', icon: 'pi-chart-bar', route: '/admin', exact: true },
        { label: 'Platform Kullanıcıları', icon: 'pi-shield', route: '/admin/platform-users' },
        { label: 'Kurum Profili', icon: 'pi-building', route: '/admin/organization' },
        { label: 'Erişim Yetkileri', icon: 'pi-key', route: '/admin/access-grants' },
        { label: 'Mail Ayarları', icon: 'pi-envelope', route: '/admin/email-accounts' },
        { label: 'Özel Alanlar', icon: 'pi-sliders-h', route: '/admin/custom-fields' },
        { label: 'Audit Log', icon: 'pi-history', route: '/admin/audit-log' }
      ]
    }
  ];

  constructor() {
    this.syncActiveGroup(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      this.syncActiveGroup((e as NavigationEnd).urlAfterRedirects);
      if (this.layout.isMobile()) this.layout.closeMobile();
    });
  }

  visibleGroups(): NavGroup[] {
    const isAdmin = this.permissions.isAdmin();
    return this.groups.filter(g => !g.adminOnly || isAdmin);
  }

  isExpanded(header: string): boolean { return this.expanded().has(header); }

  showItems(group: NavGroup): boolean {
    return this.collapsedMode() || !group.header || this.isExpanded(group.header);
  }

  toggleGroup(header: string): void {
    this.expanded.update(s => {
      const next = new Set(s);
      next.has(header) ? next.delete(header) : next.add(header);
      return next;
    });
  }

  onNavigate(): void {
    if (this.layout.isMobile()) this.layout.closeMobile();
  }

  /** Aktif rotayı içeren grubu otomatik aç. */
  private syncActiveGroup(url: string): void {
    for (const g of this.groups) {
      if (!g.header) continue;
      const match = g.items.some(i => i.exact ? url === i.route : url.startsWith(i.route));
      if (match) this.expanded.update(s => new Set(s).add(g.header!));
    }
  }
}
