import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  private nextId = 0;
  private recentAt = new Map<string, number>();
  private readonly recentTtlMs = 1500;

  get toastsSignal() {
    return this.toasts.asReadonly();
  }

  show(message: string, type: ToastType = 'success', title?: string) {
    // Prevent spamming identical toasts (common when multiple API calls fail at once).
    // Dedupe by `type + message` (ignore title) and throttle within a short window.
    const key = `${type}|${message}`;
    const now = Date.now();
    const lastAt = this.recentAt.get(key) ?? 0;
    if (now - lastAt < this.recentTtlMs) return;
    this.recentAt.set(key, now);

    // Cleanup old entries periodically.
    for (const [k, ts] of this.recentAt) {
      if (now - ts > this.recentTtlMs) this.recentAt.delete(k);
    }

    const exists = this.toasts().some((t) => t.type === type && t.message === message);
    if (exists) return;

    const id = this.nextId++;
    const toast: Toast = { id, type, message, title };
    this.toasts.update((current) => [...current, toast]);

    setTimeout(() => {
      this.remove(id);
    }, 4000); // Auto remove after 4s
  }

  success(message: string, title?: string) {
    this.show(message, 'success', title);
  }

  error(message: string, title?: string) {
    this.show(message, 'error', title);
  }

  warning(message: string, title?: string) {
    this.show(message, 'warning', title);
  }

  info(message: string, title?: string) {
    this.show(message, 'info', title);
  }

  remove(id: number) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
