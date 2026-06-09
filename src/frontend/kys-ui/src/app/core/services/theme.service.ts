import { Injectable, signal } from '@angular/core';

export type ThemeId = 'light-classic' | 'dark-slate' | 'dark-midnight' | 'dark-oled';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  group: 'Açık' | 'Koyu';
  swatch: string; // önizleme rengi (arka plan)
}

const STORAGE_KEY = 'kys_theme';

export const THEMES: ThemeOption[] = [
  { id: 'light-classic', label: 'Klasik',   group: 'Açık', swatch: '#FFFFFF' },
  { id: 'dark-slate',    label: 'Slate',    group: 'Koyu', swatch: '#1E293B' },
  { id: 'dark-midnight', label: 'Midnight', group: 'Koyu', swatch: '#102841' },
  { id: 'dark-oled',     label: 'OLED',     group: 'Koyu', swatch: '#000000' }
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly current = signal<ThemeId>('light-classic');

  /** Uygulama başlarken çağrılır: kayıtlı tema yoksa sistem tercihine bakar. */
  init(): void {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES.some(t => t.id === stored)) {
      this.apply(stored);
      return;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this.apply(prefersDark ? 'dark-slate' : 'light-classic');
  }

  set(theme: ThemeId): void {
    this.apply(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  private apply(theme: ThemeId): void {
    document.documentElement.setAttribute('data-theme', theme);
    this.current.set(theme);
  }
}
