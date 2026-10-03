import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class QuickCreateService {
  readonly kind = signal<'task' | 'note' | null>(null);
  private trigger: HTMLElement | null = null;
  open(kind: 'task' | 'note') {
    this.trigger = document.activeElement as HTMLElement;
    this.kind.set(kind);
  }
  close() {
    this.kind.set(null);
    this.trigger?.focus();
  }
}
