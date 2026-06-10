import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  kind: 'error' | 'info' | 'success';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 1;

  error(text: string) { this.push(text, 'error'); }
  info(text: string) { this.push(text, 'info'); }
  success(text: string) { this.push(text, 'success'); }

  dismiss(id: number) {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private push(text: string, kind: Toast['kind']) {
    const id = this.nextId++;
    this._toasts.update(list => [...list, { id, text, kind }]);
    setTimeout(() => this.dismiss(id), 5000);
  }
}
