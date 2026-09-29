import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TokenService } from './token.service';
import * as AuthActions from '../store/auth/auth.actions';

const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutes before expiry
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;  // son 5 dk'da etkileşim varsa kullanıcı aktif sayılır
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService implements OnDestroy {
  private tokenService = inject(TokenService);
  private store = inject(Store);

  readonly showWarning = signal(false);
  readonly secondsRemaining = signal(0);

  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // Aktif çalışan kullanıcıyı uyarıyla bölme: token sessizce yenilenir.
  // Uyarı (ve süre dolunca çıkış) yalnızca boşta kalan oturumlar için gösterilir.
  private lastActivityAt = Date.now();
  private readonly onActivity = () => { this.lastActivityAt = Date.now(); };

  constructor() {
    for (const e of ACTIVITY_EVENTS) document.addEventListener(e, this.onActivity, { passive: true, capture: true });
  }

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
        if (Date.now() - this.lastActivityAt < ACTIVE_WINDOW_MS) {
          this.extendSession();
        } else {
          this.startWarning(Math.floor(WARNING_BEFORE_MS / 1000));
        }
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
    // Yeniden planlama refreshTokenSuccess effect'inde, yeni token yerleştikten sonra yapılır.
    this.store.dispatch(AuthActions.refreshToken());
  }

  logout(): void {
    this.cancel();
    this.store.dispatch(AuthActions.logout());
  }

  ngOnDestroy(): void {
    this.cancel();
    for (const e of ACTIVITY_EVENTS) document.removeEventListener(e, this.onActivity, { capture: true });
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
