import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Branding {
  companyName: string;
  shortName: string | null;
  website: string | null;
  slogan: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  taxNumber: string | null;
  hasLogo: boolean;
  logoVersion: number;
}

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private http = inject(HttpClient);
  private base = environment.apiUrl + '/branding';

  readonly branding = signal<Branding | null>(null);
  readonly companyName = computed(() => this.branding()?.companyName ?? 'KYS');
  readonly slogan = computed(() => this.branding()?.slogan ?? '');
  readonly website = computed(() => this.branding()?.website ?? '');
  readonly logoUrl = computed(() => {
    const b = this.branding();
    return b?.hasLogo ? `${this.base}/logo?v=${b.logoVersion}` : null;
  });

  /** Uygulama açılışında ve profil güncellendiğinde çağrılır. */
  load(): void {
    this.http.get<Branding>(this.base).subscribe({
      next: b => { this.branding.set(b); this.apply(b); },
      error: () => { /* public uç; hata olsa da varsayılan 'KYS' kullanılır */ }
    });
  }

  private apply(b: Branding): void {
    document.title = `KYS — ${b.companyName}`;
    if (b.hasLogo) {
      const href = `${this.base}/logo?v=${b.logoVersion}`;
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = href;
    }
  }
}
