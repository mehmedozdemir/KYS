import { Injectable, signal } from '@angular/core';

interface PendingConfirm {
  message: string;
  resolve: (confirmed: boolean) => void;
}

/**
 * Tarayıcının native confirm() penceresi yerine uygulama temasıyla uyumlu onay diyaloğu.
 * Kullanım: `if (!(await this.confirmDialog.ask(mesaj))) return;`
 * Diyaloğun kendisi AppComponent'te tek bir yerde render edilir.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly pending = signal<PendingConfirm | null>(null);

  ask(message: string): Promise<boolean> {
    // Aynı anda tek diyalog: açık olan varsa iptal sayılır.
    this.pending()?.resolve(false);
    return new Promise<boolean>(resolve => this.pending.set({ message, resolve }));
  }

  close(confirmed: boolean): void {
    const current = this.pending();
    this.pending.set(null);
    current?.resolve(confirmed);
  }
}
