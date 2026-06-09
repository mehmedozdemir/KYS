import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PermissionService } from '../../core/services/permission.service';

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
    <aside class="sidebar">
      <div class="sidebar__brand">
        <span class="sidebar__logo">KYS</span>
        <span class="sidebar__name">Platform</span>
      </div>

      <nav class="sidebar__nav">
        @for (group of visibleGroups(); track $index) {
          @if (group.header) {
            <div class="sidebar__group-header">{{ group.header }}</div>
          }
          @for (item of group.items; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="sidebar__item--active"
              [routerLinkActiveOptions]="item.exact ? exactMatch : prefixMatch"
              class="sidebar__item">
              <i [class]="'pi ' + item.icon"></i>
              <span>{{ item.label }}</span>
            </a>
          }
        }
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background: #1F2937;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar__brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .sidebar__logo {
      background: #3B82F6;
      color: white;
      font-weight: 700;
      font-size: 0.875rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
    }
    .sidebar__name {
      color: white;
      font-weight: 600;
      font-size: 1rem;
    }
    .sidebar__nav {
      padding: 1rem 0.75rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }
    .sidebar__group-header {
      padding: 0.875rem 0.75rem 0.375rem;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #6B7280;
    }
    .sidebar__item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 0.375rem;
      color: #9CA3AF;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 150ms ease;

      &:hover {
        background: rgba(255,255,255,0.06);
        color: #F9FAFB;
        text-decoration: none;
      }

      &--active {
        background: #3B82F6;
        color: white;
      }

      i { font-size: 1rem; width: 1.25rem; }
    }
  `]
})
export class SidebarComponent {
  private permissions = inject(PermissionService);

  readonly exactMatch = { exact: true };
  readonly prefixMatch = { exact: false };

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
        { label: 'Özel Alanlar', icon: 'pi-sliders-h', route: '/admin/custom-fields' },
        { label: 'Audit Log', icon: 'pi-history', route: '/admin/audit-log' }
      ]
    }
  ];

  visibleGroups(): NavGroup[] {
    const isAdmin = this.permissions.isAdmin();
    return this.groups.filter(g => !g.adminOnly || isAdmin);
  }
}
