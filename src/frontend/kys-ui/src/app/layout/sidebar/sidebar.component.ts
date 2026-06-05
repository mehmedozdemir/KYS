import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  template: `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <span class="sidebar__logo">KYS</span>
        <span class="sidebar__name">Platform</span>
      </div>

      <nav class="sidebar__nav">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="sidebar__item--active"
            class="sidebar__item">
            <i [class]="'pi ' + item.icon"></i>
            <span>{{ item.label }}</span>
          </a>
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
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi-home', route: '/dashboard' },
    { label: 'Müşteriler', icon: 'pi-building', route: '/customers' },
    { label: 'Ürünler', icon: 'pi-box', route: '/products' },
    { label: 'Ekipler', icon: 'pi-users', route: '/teams' },
    { label: 'Kişiler', icon: 'pi-user', route: '/people' },
    { label: 'Bilgi Bankası', icon: 'pi-book', route: '/knowledge-base' },
    { label: 'Admin', icon: 'pi-cog', route: '/admin' }
  ];
}
