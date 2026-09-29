import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of, switchMap } from 'rxjs';
import { TokenService } from '../services/token.service';
import { SetupService } from '../services/setup.service';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const setupService = inject(SetupService);

  if (!tokenService.isLoggedIn()) {
    return setupService.getStatus().pipe(
      map(status => {
        if (!status.isInitialized) {
          return router.createUrlTree(['/setup']);
        }
        return router.createUrlTree(['/auth/login']);
      }),
      catchError(() => of(router.createUrlTree(['/auth/login'])))
    );
  }

  return of(true);
};

// Oturumu açık kullanıcıyı login sayfasından uygulamaya yönlendirir.
export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const expiry = tokenService.getTokenExpiryMs();
  const hasValidSession = tokenService.isLoggedIn() && (expiry === null || expiry > Date.now());
  return hasValidSession ? router.createUrlTree(['/dashboard']) : true;
};
