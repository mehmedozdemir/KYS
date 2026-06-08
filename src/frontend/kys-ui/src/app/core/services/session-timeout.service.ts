import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TokenService } from './token.service';
import * as AuthActions from '../store/auth/auth.actions';

const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutes before expiry

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService implements OnDestroy {
  private tokenService = inject(TokenService);
  private store = inject(Store);

  readonly showWarning = signal(false);
  readonly secondsRemaining = signal(0);

  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  schedule(): void {
    this.cancel();
    const expiryMs = this.tokenService.getTokenExpiryMs();
    if (!expiryMs) return;

    const nowMs = Date.now();
    const msUntilExpiry = expiryMs - nowMs;
    const msUntilWarning = msUntilExpiry - WARNING_BEFORE_MS;

    if (msUntilWarning <= 0) {
      // Token expires in less than 2 minutes — show warning immediately
      this.startWarning(Math.max(0, Math.floor(msUntilExpiry / 1000)));
    } else {
      this.warningTimer = setTimeout(() => {
        this.startWarning(Math.floor(WARNING_BEFORE_MS / 1000));
      }, msUntilWarning);
    }
  }

  cancel(): void {
    if (this.warningTimer) { clearTimeout(this.warningTimer); this.warningTimer = null; }
    this.stopCountdown();
    this.showWarning.set(false);
  }

  extendSession(): void {
    this.cancel();
    this.store.dispatch(AuthActions.refreshToken());
    // Re-schedule after a tick so new token expiry is in place
    setTimeout(() => this.schedule(), 500);
  }

  logout(): void {
    this.cancel();
    this.store.dispatch(AuthActions.logout());
  }

  ngOnDestroy(): void {
    this.cancel();
  }

  private startWarning(seconds: number): void {
    this.secondsRemaining.set(seconds);
    this.showWarning.set(true);
    this.countdownInterval = setInterval(() => {
      const remaining = this.secondsRemaining() - 1;
      if (remaining <= 0) {
        this.stopCountdown();
        this.showWarning.set(false);
        this.store.dispatch(AuthActions.logout());
      } else {
        this.secondsRemaining.set(remaining);
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
  }
}
