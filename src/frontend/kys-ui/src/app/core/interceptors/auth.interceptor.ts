import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const notifications = inject(NotificationService);

  const token = tokenService.getAccessToken();

  // Tell the backend which language to localize messages in (tr default).
  const lang = localStorage.getItem('kys-lang') ?? 'tr';
  const headers: Record<string, string> = { 'Accept-Language': lang };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const authReq = req.clone({ setHeaders: headers });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        tokenService.clearTokens();
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        notifications.error(error.error?.detail ?? 'Bu işlem için yetkiniz yok.');
      }
      return throwError(() => error);
    })
  );
};
