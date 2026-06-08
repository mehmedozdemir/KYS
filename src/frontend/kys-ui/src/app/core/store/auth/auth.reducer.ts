import { createReducer, on } from '@ngrx/store';
import { AuthUser } from '../../models/auth.models';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, state => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { user }) => ({ ...state, user, loading: false, error: null })),
  on(AuthActions.loginFailure, (state, { error }) => ({ ...state, user: null, loading: false, error })),
  on(AuthActions.logout, () => initialState),
  on(AuthActions.restoreSession, state => state),
  on(AuthActions.refreshTokenSuccess, (state, { accessToken, refreshToken }) =>
    state.user ? { ...state, user: { ...state.user, accessToken, refreshToken } } : state
  ),
  on(AuthActions.refreshTokenFailure, () => initialState)
);
