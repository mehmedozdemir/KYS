import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

/** Yalnızca PlatformAdmin (tam yetki) erişebilir; aksi halde dashboard'a yönlendirir. */
export const adminGuard: CanActivateFn = () => {
  const permissions = inject(PermissionService);
  const router = inject(Router);

  return permissions.isAdmin() ? true : router.createUrlTree(['/dashboard']);
};
