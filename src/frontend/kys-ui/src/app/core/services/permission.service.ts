import { Injectable, inject } from '@angular/core';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private token = inject(TokenService);

  permissions(): string[] {
    try {
      return this.token.getUser<{ permissions?: string[] }>()?.permissions ?? [];
    } catch {
      return [];
    }
  }

  /** Belirli bir yeteneğe sahip mi. '*' her şeyi, 'alan:*' o alanı kapsar. */
  has(capability: string): boolean {
    const perms = this.permissions();
    if (perms.includes('*') || perms.includes(capability)) return true;
    // alan:* wildcard (ör. "customer:*" -> "customer:create")
    const colon = capability.indexOf(':');
    if (colon > 0) {
      const domainWildcard = capability.slice(0, colon + 1) + '*';
      if (perms.includes(domainWildcard)) return true;
    }
    return false;
  }

  /** PlatformAdmin (tam yetki) mi. */
  isAdmin(): boolean {
    return this.permissions().includes('*');
  }
}
