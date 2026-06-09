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

  /** Belirli bir izne sahip mi (wildcard '*' her şeyi kapsar). */
  has(permission: string): boolean {
    const perms = this.permissions();
    return perms.includes('*') || perms.includes(permission);
  }

  /** PlatformAdmin (tam yetki) mi. */
  isAdmin(): boolean {
    return this.permissions().includes('*');
  }
}
