import { inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type AppLang = 'tr' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private transloco = inject(TranslocoService);
  readonly current = signal<AppLang>(this.transloco.getActiveLang() as AppLang);

  constructor() {
    this.applyHtmlLang(this.current());
  }

  set(lang: AppLang): void {
    this.transloco.setActiveLang(lang);
    this.current.set(lang);
    localStorage.setItem('kys-lang', lang);
    this.applyHtmlLang(lang);
  }

  toggle(): void {
    this.set(this.current() === 'tr' ? 'en' : 'tr');
  }

  private applyHtmlLang(lang: string): void {
    document.documentElement.lang = lang;
  }
}
