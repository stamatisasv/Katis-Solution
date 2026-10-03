import { Injectable, effect, inject, signal } from '@angular/core';
import {
  ActivityLog,
  CalendarEvent,
  Customer,
  Delivery,
  DeliveryItem,
  Document,
  Note,
  Product,
  Profile,
  StockMovement,
  Supplier,
  Task,
  Transaction,
  Vehicle,
} from '../models/entities';
import { EditableKind, OperationsRepository, RecordChanges } from './operations.repository';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class SupabaseOperationsRepository implements OperationsRepository {
  private readonly client = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);
  readonly profiles = signal<readonly Profile[]>([]);
  readonly customers = signal<readonly Customer[]>([]);
  readonly suppliers = signal<readonly Supplier[]>([]);
  readonly vehicles = signal<readonly Vehicle[]>([]);
  readonly deliveries = signal<readonly Delivery[]>([]);
  readonly deliveryItems = signal<readonly DeliveryItem[]>([]);
  readonly products = signal<readonly Product[]>([]);
  readonly tasks = signal<readonly Task[]>([]);
  readonly events = signal<readonly CalendarEvent[]>([]);
  readonly transactions = signal<readonly Transaction[]>([]);
  readonly notes = signal<readonly Note[]>([]);
  readonly activities = signal<readonly ActivityLog[]>([]);
  readonly stockMovements = signal<readonly StockMovement[]>([]);
  readonly documents = signal<readonly Document[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  private generation = 0;
  private readonly stores = {
    profiles: this.profiles,
    customers: this.customers,
    suppliers: this.suppliers,
    vehicles: this.vehicles,
    deliveries: this.deliveries,
    delivery_items: this.deliveryItems,
    products: this.products,
    tasks: this.tasks,
    calendar_events: this.events,
    transactions: this.transactions,
    notes: this.notes,
    activity_logs: this.activities,
    stock_movements: this.stockMovements,
    documents: this.documents,
  };
  constructor() {
    effect(() => {
      const profile = this.auth.profile();
      this.clear();
      if (profile) void this.refresh();
    });
  }
  private clear() {
    this.generation++;
    for (const store of Object.values(this.stores)) store.set([]);
    this.error.set('');
    this.loading.set(false);
  }
  async refresh(): Promise<void> {
    if (!this.auth.signedIn()) {
      this.clear();
      return;
    }
    const generation = ++this.generation;
    this.loading.set(true);
    this.error.set('');
    try {
      // Page all tables: PostgREST caps a single response to 1,000 rows by default.
      const results = await Promise.all(
        Object.keys(this.stores).map(async (table) => {
          const rows: unknown[] = [];
          for (let offset = 0; ; offset += 500) {
            const { data, error } = await this.client
              .from(table)
              .select('*')
              .order('created_at', { ascending: false })
              .order('id')
              .range(offset, offset + 499);
            if (error) throw error;
            rows.push(...data);
            if (data.length < 500) break;
          }
          return [table, rows] as const;
        }),
      );
      if (generation !== this.generation || !this.auth.signedIn()) return;
      for (const [table, rows] of results) {
        const store = this.stores[table as keyof typeof this.stores];
        // Each response originates from its matching table; the schema matches the model.
        store.set(rows as never);
      }
    } catch {
      if (generation === this.generation)
        this.error.set('Η φόρτωση δεδομένων απέτυχε. Ελέγξτε τη σύνδεση και την πρόσβασή σας.');
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }
  private ensureStaff() {
    if (!this.auth.signedIn()) throw new Error('Συνδεθείτε για να αποθηκεύσετε αλλαγές.');
  }
  private async write(functionName: string, parameters: Record<string, unknown>) {
    this.ensureStaff();
    const { error } = await this.client.rpc(functionName, parameters);
    if (error) {
      if (error.code === 'PGRST202')
        throw new Error('Η βάση χρειάζεται την ενημέρωση 04_live_operations.sql.');
      throw new Error(error.message);
    }
    // A committed write remains successful even when the follow-up read fails.
    // The shell shows a separate reload warning rather than prompting duplicate inserts.
    await this.refresh();
  }
  updateRecord<K extends EditableKind>(kind: K, id: string, changes: RecordChanges<K>) {
    return this.write('update_operation', { p_kind: kind, p_id: id, p_changes: changes });
  }
  completeTask(id: string) {
    return this.updateRecord('task', id, { status: 'completed' });
  }
  createTask(title: string, description: string, dueDate: string) {
    return this.write('create_operation', {
      p_kind: 'task',
      p_title: title,
      p_body: description,
      p_due_date: dueDate,
    });
  }
  createNote(title: string, body: string) {
    return this.write('create_operation', {
      p_kind: 'note',
      p_title: title,
      p_body: body,
      p_due_date: null,
    });
  }
}
