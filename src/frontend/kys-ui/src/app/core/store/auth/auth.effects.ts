import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LoginResponse, AuthUser } from '../../models/auth.models';
import { TokenService } from '../../services/token.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);

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
      tap(() => this.router.navigate(['/dashboard']))
    ), { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        this.tokenService.clearTokens();
        this.router.navigate(['/auth/login']);
      })
    ), { dispatch: false }
  );
}
