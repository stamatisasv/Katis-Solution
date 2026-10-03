import { Component, input } from '@angular/core';
export const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Προγραμματισμένη',
  preparing: 'Προετοιμασία',
  ready: 'Έτοιμη',
  in_transit: 'Σε διαδρομή',
  delivered: 'Ολοκληρώθηκε',
  cancelled: 'Ακυρώθηκε',
  todo: 'Προς εκτέλεση',
  in_progress: 'Σε εξέλιξη',
  waiting: 'Σε αναμονή',
  completed: 'Ολοκληρώθηκε',
  pending: 'Εκκρεμεί',
  paid: 'Εξοφλήθηκε',
  partial: 'Μερική εξόφληση',
  urgent: 'Επείγον',
  high: 'Υψηλή',
  normal: 'Κανονική',
  low: 'Χαμηλή',
};
@Component({
  selector: 'app-status-badge',
  template: '<span class="badge" [class]="tone"><span class="badge-dot"></span>{{ label }}</span>',
})
export class StatusBadge {
  readonly status = input.required<string>();
  get label() {
    return STATUS_LABELS[this.status()] ?? this.status();
  }
  get tone() {
    return ['delivered', 'completed', 'paid'].includes(this.status())
      ? 'badge green'
      : ['in_transit', 'in_progress'].includes(this.status())
        ? 'badge blue'
        : ['urgent', 'high', 'cancelled'].includes(this.status())
          ? 'badge red'
          : 'badge amber';
  }
}
