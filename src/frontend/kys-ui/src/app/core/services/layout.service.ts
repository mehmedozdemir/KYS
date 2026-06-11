import { Injectable, signal } from '@angular/core';

/**
 * Sidebar/layout durumu:
 * - collapsed: masaüstünde mini (ikon-only) mod (tercih kalıcı)
 * - mobileOpen: küçük ekranda drawer açık mı
 * - isMobile: dar ekran mı (matchMedia)
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private static readonly KEY = 'kys-sidebar-collapsed';
  private readonly mql = window.matchMedia('(max-width: 1023px)');

  readonly isMobile = signal(this.mql.matches);
  readonly collapsed = signal(localStorage.getItem(LayoutService.KEY) === '1');
  readonly mobileOpen = signal(false);

  constructor() {
    this.mql.addEventListener('change', e => {
      this.isMobile.set(e.matches);
      if (!e.matches) this.mobileOpen.set(false); // masaüstüne geçince drawer kapan
    });
  }

  /** Topbar menü düğmesi: mobilde drawer'ı, masaüstünde mini modu değiştirir. */
  primaryToggle(): void {
    if (this.isMobile()) {
      this.mobileOpen.update(v => !v);
    } else {
      const v = !this.collapsed();
      this.collapsed.set(v);
      localStorage.setItem(LayoutService.KEY, v ? '1' : '0');
    }
  }

  closeMobile(): void { this.mobileOpen.set(false); }
}
