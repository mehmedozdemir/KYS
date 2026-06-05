import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectCurrentUser = createSelector(selectAuthState, s => s.user);
export const selectAuthLoading = createSelector(selectAuthState, s => s.loading);
export const selectAuthError = createSelector(selectAuthState, s => s.error);
export const selectIsLoggedIn = createSelector(selectAuthState, s => !!s.user);
export const selectPermissions = createSelector(selectAuthState, s => s.user?.permissions ?? []);
export const selectHasPermission = (permission: string) =>
  createSelector(selectPermissions, perms => perms.includes(permission));
