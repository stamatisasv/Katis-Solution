import { computed, inject, Injectable } from '@angular/core';
import { OPERATIONS_REPOSITORY } from './operations.repository';
import { APP_SETTINGS } from './app-settings';
@Injectable({ providedIn: 'root' })
export class OperationsService {
  readonly repository = inject(OPERATIONS_REPOSITORY);
  readonly todayDeliveries = computed(() =>
    this.repository.deliveries().filter((d) => d.scheduled_at.startsWith(APP_SETTINGS.demoDate)),
  );
  readonly openTasks = computed(() =>
    this.repository.tasks().filter((t) => !['completed', 'cancelled'].includes(t.status)),
  );
  readonly overdueTasks = computed(() =>
    this.openTasks().filter((t) => t.due_date < APP_SETTINGS.demoDate),
  );
  readonly deliveredToday = computed(() =>
    this.todayDeliveries().filter((d) => d.status === 'delivered'),
  );
  readonly lowStock = computed(() =>
    this.repository.products().filter((p) => p.active && p.quantity <= p.minimum_stock),
  );
  readonly pendingPayments = computed(() =>
    this.repository.transactions().filter((t) => ['pending', 'partial'].includes(t.status)),
  );
  readonly pendingAmount = computed(() =>
    this.pendingPayments().reduce((total, t) => total + t.amount, 0),
  );
  readonly pinnedNotes = computed(() => this.repository.notes().filter((n) => n.pinned));
  readonly todayEvents = computed(() =>
    this.repository
      .events()
      .filter((e) => e.starts_at.startsWith(APP_SETTINGS.demoDate))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
  );
  customer(id: string) {
    return this.repository.customers().find((c) => c.id === id)?.name ?? 'Άγνωστος πελάτης';
  }
  employee(id: string) {
    return this.repository.profiles().find((p) => p.id === id)?.name ?? 'Ομάδα Katis';
  }
  vehicle(id: string) {
    return this.repository.vehicles().find((v) => v.id === id)?.name ?? '—';
  }
  items(deliveryId: string) {
    return this.repository
      .deliveryItems()
      .filter((i) => i.delivery_id === deliveryId)
      .map((i) => {
        const product = this.repository.products().find((p) => p.id === i.product_id);
        return `${product?.name ?? 'Υλικό'} × ${i.quantity}`;
      })
      .join(' · ');
  }
  search(query: string) {
    const q = query.trim().toLocaleLowerCase('el');
    if (q.length < 2) return [];
    return [
      ...this.repository
        .customers()
        .map((c) => ({ title: c.name, type: 'Πελάτης', route: '/customers' })),
      ...this.repository
        .deliveries()
        .map((d) => ({
          title: `Παράδοση #${d.number} · ${this.customer(d.customer_id)}`,
          type: 'Παράδοση',
          route: '/deliveries/' + d.id,
        })),
      ...this.repository
        .tasks()
        .map((t) => ({
          title: t.title + (t.customer_id ? ' · ' + this.customer(t.customer_id) : ''),
          type: 'Εργασία',
          route: '/tasks',
        })),
      ...this.repository
        .products()
        .map((p) => ({ title: p.name, type: 'Προϊόν', route: '/inventory' })),
      ...this.repository
        .transactions()
        .map((t) => ({
          title: `${t.amount} € · ${t.description} · ${t.customer_id ? this.customer(t.customer_id) : ''}`,
          type: 'Πληρωμή',
          route: '/finance',
        })),
    ]
      .filter((r) => r.title.toLocaleLowerCase('el').includes(q))
      .slice(0, 8);
  }
}
