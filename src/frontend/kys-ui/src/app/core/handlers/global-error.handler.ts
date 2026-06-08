import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private router = inject(Router);
  private ngZone = inject(NgZone);

  handleError(error: unknown): void {
    const err = error as { status?: number; message?: string; rejection?: { status?: number } };
    const status = err.status ?? err.rejection?.status;

    console.error('[GlobalErrorHandler]', error);

    if (status === 401) {
      this.ngZone.run(() => this.router.navigate(['/auth/login']));
      return;
    }

    if (status === 403) {
      this.ngZone.run(() => this.router.navigate(['/dashboard'], { queryParams: { error: 'forbidden' } }));
      return;
    }

    // Chunk load error (lazy-loaded route failed after deploy) — reload once
    const msg = err.message ?? '';
    if (msg.includes('ChunkLoadError') || msg.includes('Loading chunk')) {
      sessionStorage.setItem('chunkReload', '1');
      window.location.reload();
      return;
    }
  }
}
