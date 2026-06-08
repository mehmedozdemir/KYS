import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { environment } from '../../../../environments/environment';
import { LoginResponse, AuthUser } from '../../models/auth.models';
import { TokenService } from '../../services/token.service';
import { SessionTimeoutService } from '../../services/session-timeout.service';
import * as AuthActions from './auth.actions';

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private store = inject(Store);
  private sessionTimeout = inject(SessionTimeoutService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
          map(response => {
            const user: AuthUser = {
              personId: response.personId,
              fullName: response.fullName,
              permissions: response.permissions,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken
            };
            this.tokenService.setTokens(response.accessToken, response.refreshToken);
            this.tokenService.setUser(user);
            return AuthActions.loginSuccess({ user });
          }),
          catchError(err => of(AuthActions.loginFailure({
            error: err.error?.detail ?? 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.'
          })))
        )
      )
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => {
        this.router.navigate(['/dashboard']);
        this.sessionTimeout.schedule();
      })
    ), { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        this.sessionTimeout.cancel();
        this.tokenService.clearTokens();
        this.router.navigate(['/auth/login']);
      })
    ), { dispatch: false }
  );

  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      switchMap(() => {
        const rt = this.tokenService.getRefreshToken();
        if (!rt) return of(AuthActions.refreshTokenFailure());
        return this.http.post<RefreshTokenResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken: rt }).pipe(
          map(res => {
            this.tokenService.setTokens(res.accessToken, res.refreshToken);
            return AuthActions.refreshTokenSuccess({ accessToken: res.accessToken, refreshToken: res.refreshToken });
          }),
          catchError(() => of(AuthActions.refreshTokenFailure()))
        );
      })
    )
  );

  refreshTokenFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshTokenFailure),
      tap(() => {
        this.tokenService.clearTokens();
        this.router.navigate(['/auth/login']);
      })
    ), { dispatch: false }
  );
}
