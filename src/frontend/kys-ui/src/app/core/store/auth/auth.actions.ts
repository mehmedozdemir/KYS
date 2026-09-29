import { createAction, props } from '@ngrx/store';
import { AuthUser } from '../../models/auth.models';

export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: AuthUser }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const logout = createAction('[Auth] Logout');

// Sayfa yenilendiğinde localStorage'daki kullanıcıyı store'a geri yükler.
export const restoreSession = createAction(
  '[Auth] Restore Session',
  props<{ user: AuthUser }>()
);

export const refreshToken = createAction('[Auth] Refresh Token');

export const refreshTokenSuccess = createAction(
  '[Auth] Refresh Token Success',
  props<{ accessToken: string; refreshToken: string }>()
);

export const refreshTokenFailure = createAction('[Auth] Refresh Token Failure');
