import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { SetupService } from '../services/setup.service';

// Redirects to /auth/login if system is already initialized
export const setupGuard: CanActivateFn = () => {
  const setupService = inject(SetupService);
  const router = inject(Router);

  return setupService.getStatus().pipe(
    map(status => {
      if (status.isInitialized) {
        return router.createUrlTree(['/auth/login']);
      }
      return true;
    }),
    catchError(() => of(true))
  );
};

// Redirects to /setup if system is NOT yet initialized
export const initializedGuard: CanActivateFn = () => {
  const setupService = inject(SetupService);
  const router = inject(Router);

  return setupService.getStatus().pipe(
    map(status => {
      if (!status.isInitialized) {
        return router.createUrlTree(['/setup']);
      }
      return true;
    }),
    catchError(() => of(true))
  );
};
