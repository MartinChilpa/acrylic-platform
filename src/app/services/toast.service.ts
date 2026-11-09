import { Injectable, signal } from '@angular/core';
import { SAVE_DESTINATIONS_CONFIG } from '../constants/save-destinations.config';

export interface ToastAction {
  label: string;
  run: () => void;
  /** White button; the rest are dark. */
  primary?: boolean;
}

export interface Toast {
  id: number;
  title: string;
  body?: string;
  actions: ToastAction[];
  /** Also run by Cmd/Ctrl+Z while the toast is visible. */
  undo?: () => void;
  tone?: 'default' | 'error';
}

/**
 * Toasts with actions (Undo, Go to projects, Retry). One at a time: a new
 * toast replaces the previous one, whose undo window then closes.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private remainingMs = 0;
  private startedAt = 0;

  readonly current = signal<Toast | null>(null);

  show(toast: Omit<Toast, 'id'>, durationMs: number = SAVE_DESTINATIONS_CONFIG.toastDurationMs): number {
    const id = this.nextId++;
    this.current.set({ ...toast, id });
    this.remainingMs = durationMs;
    this.resume();
    return id;
  }

  dismiss(id?: number): void {
    const toast = this.current();
    if (!toast || (id !== undefined && toast.id !== id)) { return; }
    this.clearTimer();
    this.current.set(null);
  }

  /** Runs an action and closes the toast it belongs to. */
  run(action: ToastAction): void {
    const toast = this.current();
    this.dismiss(toast?.id);
    action.run();
  }

  /** Cmd/Ctrl+Z: undo what the visible toast reports, if it can be undone. */
  undo(): boolean {
    const toast = this.current();
    if (!toast?.undo) { return false; }
    this.dismiss(toast.id);
    toast.undo();
    return true;
  }

  /** Hover or focus keeps the toast open so its actions stay reachable. */
  pause(): void {
    if (!this.timer) { return; }
    this.remainingMs -= Date.now() - this.startedAt;
    this.clearTimer();
  }

  resume(): void {
    const toast = this.current();
    if (!toast || this.timer) { return; }
    this.startedAt = Date.now();
    this.timer = setTimeout(() => this.dismiss(toast.id), Math.max(1000, this.remainingMs));
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
