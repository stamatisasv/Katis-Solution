import { Injectable, signal } from '@angular/core';
import {
  ActivityLog,
  BaseRecord,
  CalendarEvent,
  Customer,
  Delivery,
  DeliveryItem,
  Note,
  Product,
  Profile,
  Task,
  Transaction,
  Vehicle,
} from '../models/entities';
import {
  EditableKind,
  EditableRecords,
  RecordChanges,
  OperationsRepository,
} from './operations.repository';
export const mockId = (n: number): string =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const base = (n: number): BaseRecord => ({
  id: mockId(n),
  created_at: '2026-10-03T07:00:00+03:00',
  updated_at: '2026-10-03T07:00:00+03:00',
  created_by: mockId(1),
});
@Injectable({ providedIn: 'root' })
export class MockOperationsRepository implements OperationsRepository {
  readonly profiles = signal<readonly Profile[]>([
    { ...base(1), name: 'Σταμάτης Κατής', role: 'admin' },
    { ...base(2), name: 'Δημήτρης Κατής', role: 'employee' },
    { ...base(3), name: 'Νίκος Μάρκου', role: 'employee' },
  ]);
  readonly customers = signal<readonly Customer[]>(
    ['Γιώργος Παπαδόπουλος', 'Αλέξανδρος Μακρής', 'Ελένη Γεωργίου', 'Τεχνική Λήμνου Ο.Ε.'].map(
      (name, i) => ({
        ...base(10 + i),
        name,
        phone: '22540 2' + (3100 + i),
        email: '',
        address: ['Μύρινα', 'Μούδρος', 'Κοντιάς', 'Κότσινας'][i],
        vat_number: '',
        notes: 'Δοκιμαστική εγγραφή',
      }),
    ),
  );
  readonly vehicles = signal<readonly Vehicle[]>([
    { ...base(20), name: 'Φορτηγό 01', registration: 'ΛΗΜ 2041' },
    { ...base(21), name: 'Φορτηγό 02', registration: 'ΛΗΜ 3082' },
  ]);
  readonly deliveries = signal<readonly Delivery[]>([
    {
      ...base(30),
      number: '1042',
      customer_id: mockId(10),
      address: 'Μύρινα, Λήμνος',
      scheduled_at: '2026-10-03T08:30:00+03:00',
      vehicle_id: mockId(21),
      driver_id: mockId(2),
      status: 'in_transit',
      payment_status: 'pending',
      fee: 850,
      notes: 'Τηλεφώνημα 30 λεπτά πριν την άφιξη.',
    },
    {
      ...base(31),
      number: '1043',
      customer_id: mockId(11),
      address: 'Μούδρος, Λήμνος',
      scheduled_at: '2026-10-03T13:00:00+03:00',
      vehicle_id: mockId(20),
      driver_id: mockId(3),
      status: 'preparing',
      payment_status: 'paid',
      fee: 420,
      notes: 'Παράδοση στην είσοδο της οικοδομής.',
    },
    {
      ...base(32),
      number: '1044',
      customer_id: mockId(12),
      address: 'Κοντιάς, Λήμνος',
      scheduled_at: '2026-10-03T14:00:00+03:00',
      vehicle_id: mockId(21),
      driver_id: mockId(2),
      status: 'scheduled',
      payment_status: 'pending',
      fee: 280,
      notes: 'Πρόσβαση από τον κεντρικό δρόμο.',
    },
    {
      ...base(33),
      number: '1041',
      customer_id: mockId(13),
      address: 'Κότσινας, Λήμνος',
      scheduled_at: '2026-10-03T07:30:00+03:00',
      vehicle_id: mockId(20),
      driver_id: mockId(3),
      status: 'delivered',
      payment_status: 'paid',
      fee: 620,
      notes: 'Η παράδοση ολοκληρώθηκε.',
    },
  ]);
  readonly products = signal<readonly Product[]>(
    [
      'Τσιμέντο 25 kg',
      'Άμμος λατομείου',
      'Μονωτικές πλάκες XPS',
      'Πέλλετ ξύλου 15 kg',
      'Χρώμα ακρυλικό 10 L',
    ].map((name, i) => ({
      ...base(40 + i),
      name,
      sku: 'KAT-' + (100 + i),
      category: ['Δομικά υλικά', 'Αδρανή', 'Μόνωση', 'Θέρμανση', 'Χρώματα'][i],
      supplier_id: mockId(90),
      unit: ['σακιά', 'm³', 'τεμ.', 'σακιά', 'τεμ.'][i],
      purchase_price: 5 + i,
      selling_price: 8 + i,
      quantity: [18, 42, 8, 12, 34][i],
      minimum_stock: [30, 10, 15, 20, 10][i],
      location: 'Κεντρική αποθήκη',
      active: true,
    })),
  );
  readonly deliveryItems = signal<readonly DeliveryItem[]>([
    { ...base(50), delivery_id: mockId(30), product_id: mockId(40), quantity: 30 },
    { ...base(51), delivery_id: mockId(30), product_id: mockId(41), quantity: 2 },
    { ...base(52), delivery_id: mockId(31), product_id: mockId(42), quantity: 20 },
    { ...base(53), delivery_id: mockId(32), product_id: mockId(43), quantity: 15 },
    { ...base(54), delivery_id: mockId(33), product_id: mockId(41), quantity: 6 },
  ]);
  readonly tasks = signal<readonly Task[]>(
    [
      'Επικοινωνία με προμηθευτή τσιμέντου',
      'Έλεγχος υδραυλικών στο Φορτηγό 02',
      'Προετοιμασία παραγγελίας Μακρή',
      'Υπενθύμιση πληρωμής Παπαδόπουλου',
      'Καταμέτρηση αποθήκης μονωτικών',
      'Προσφορά για έργο στον Κοντιά',
      'Παραλαβή παλετών από προμηθευτή',
    ].map((title, i) => ({
      ...base(60 + i),
      title,
      description: 'Συντονισμός με την ομάδα και ενημέρωση της εγγραφής.',
      category: [
        'Προμηθευτής',
        'Όχημα',
        'Αποθήκη',
        'Πληρωμή',
        'Αποθήκη',
        'Χωματουργικά',
        'Προμηθευτής',
      ][i],
      priority: i < 2 ? 'high' : 'normal',
      status: i === 2 ? 'in_progress' : 'todo',
      employee_id: mockId((i % 2) + 1),
      customer_id: i === 3 ? mockId(10) : null,
      delivery_id: null,
      due_date: i === 0 ? '2026-10-02' : '2026-10-03',
    })),
  );
  readonly events = signal<readonly CalendarEvent[]>([
    {
      ...base(70),
      title: 'Παράδοση υλικών',
      type: 'delivery',
      starts_at: '2026-10-03T08:30:00+03:00',
      ends_at: '2026-10-03T09:30:00+03:00',
      location: 'Γ. Παπαδόπουλος · Μύρινα',
      delivery_id: mockId(30),
      task_id: null,
    },
    {
      ...base(71),
      title: 'Εκσκαφή οικοπέδου',
      type: 'earthworks',
      starts_at: '2026-10-03T10:00:00+03:00',
      ends_at: '2026-10-03T12:00:00+03:00',
      location: 'Συνεργείο Δημήτρη · Κοντιάς',
      delivery_id: null,
      task_id: null,
    },
    {
      ...base(72),
      title: 'Άφιξη προμηθευτή',
      type: 'supplier',
      starts_at: '2026-10-03T11:30:00+03:00',
      ends_at: '2026-10-03T12:00:00+03:00',
      location: 'Δομική Αιγαίου · Αποθήκη',
      delivery_id: null,
      task_id: null,
    },
    {
      ...base(73),
      title: 'Παράδοση μονωτικών',
      type: 'delivery',
      starts_at: '2026-10-03T13:00:00+03:00',
      ends_at: '2026-10-03T14:00:00+03:00',
      location: 'Α. Μακρής · Μούδρος',
      delivery_id: mockId(31),
      task_id: null,
    },
    {
      ...base(74),
      title: 'Παράδοση πέλλετ',
      type: 'delivery',
      starts_at: '2026-10-03T14:00:00+03:00',
      ends_at: '2026-10-03T15:00:00+03:00',
      location: 'Ε. Γεωργίου · Κοντιάς',
      delivery_id: mockId(32),
      task_id: null,
    },
  ]);
  readonly transactions = signal<readonly Transaction[]>(
    [850, 280].map((amount, i) => ({
      ...base(80 + i),
      type: 'income',
      category: 'Παράδοση',
      description: 'Πληρωμή παράδοσης #' + (1042 + i * 2),
      amount,
      date: '2026-10-03',
      payment_method: 'cash',
      status: 'pending',
      customer_id: mockId(10 + i * 2),
      supplier_id: null,
      delivery_id: mockId(30 + i * 2),
    })),
  );
  readonly notes = signal<readonly Note[]>([
    {
      ...base(85),
      title: 'Παραλαβή τσιμέντου τη Δευτέρα',
      body: 'Αναμένονται 4 παλέτες από τη Δομική Αιγαίου. Να μείνει ελεύθερος ο χώρος δίπλα στην αποθήκη.',
      category: 'Προμηθευτής',
      pinned: true,
      reminder: null,
      customer_id: null,
      supplier_id: mockId(90),
      delivery_id: null,
      task_id: null,
    },
    {
      ...base(86),
      title: 'Έργο στον Κοντιά',
      body: 'Ο πελάτης ζήτησε να περάσουμε από το οικόπεδο πριν ξεκινήσουν οι εργασίες.',
      category: 'Χωματουργικά',
      pinned: true,
      reminder: null,
      customer_id: mockId(12),
      supplier_id: null,
      delivery_id: null,
      task_id: null,
    },
  ]);
  readonly activities = signal<readonly ActivityLog[]>([
    {
      ...base(100),
      created_at: '2026-10-03T10:42:00+03:00',
      action: 'ενημέρωσε την παράδοση #1042',
      entity: 'delivery',
      entity_id: mockId(30),
    },
    {
      ...base(101),
      created_by: mockId(2),
      created_at: '2026-10-03T10:31:00+03:00',
      action: 'δημιούργησε μια νέα εργασία',
      entity: 'task',
      entity_id: mockId(61),
    },
    {
      ...base(102),
      created_by: mockId(3),
      created_at: '2026-10-03T09:58:00+03:00',
      action: 'κατέγραψε έξοδο 25 σακιών τσιμέντου',
      entity: 'stock_movement',
      entity_id: mockId(110),
    },
    {
      ...base(103),
      created_at: '2026-10-03T09:20:00+03:00',
      action: 'κατέγραψε πληρωμή 620 €',
      entity: 'transaction',
      entity_id: mockId(111),
    },
  ]);
  private log(action: string, entity: string, id: string) {
    const now = new Date().toISOString();
    this.activities.update((rows) => [
      {
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
        created_by: mockId(1),
        action,
        entity,
        entity_id: id,
      },
      ...rows,
    ]);
  }
  async updateRecord<K extends EditableKind>(
    kind: K,
    id: string,
    changes: RecordChanges<K>,
  ): Promise<void> {
    const stores = {
      delivery: this.deliveries,
      task: this.tasks,
      product: this.products,
      customer: this.customers,
      transaction: this.transactions,
      note: this.notes,
      event: this.events,
    };
    const store = stores[kind];
    const existing = store().find((row) => row.id === id);
    if (!existing) throw new Error('Η εγγραφή δεν βρέθηκε.');
    const allowed: Record<EditableKind, string[]> = {
      delivery: [
        'customer_id',
        'address',
        'scheduled_at',
        'vehicle_id',
        'driver_id',
        'status',
        'payment_status',
        'fee',
        'notes',
      ],
      task: ['title', 'description', 'category', 'priority', 'status', 'employee_id', 'due_date'],
      product: ['name', 'quantity', 'minimum_stock', 'location', 'selling_price'],
      customer: ['name', 'phone', 'email', 'address', 'vat_number', 'notes'],
      transaction: ['description', 'status', 'payment_method'],
      note: ['title', 'body', 'category', 'pinned'],
      event: ['title', 'starts_at', 'ends_at', 'location'],
    };
    if (Object.keys(changes).some((key) => !allowed[kind].includes(key)))
      throw new Error('Μη επιτρεπτή αλλαγή.');
    const next = { ...existing, ...changes } as EditableRecords[K];
    const record = next as unknown as Record<string, unknown>;
    const required: Record<EditableKind, string[]> = {
      delivery: ['address', 'scheduled_at'],
      task: ['title', 'due_date'],
      product: ['name', 'location'],
      customer: ['name', 'address'],
      transaction: ['description'],
      note: ['title', 'category'],
      event: ['title', 'starts_at', 'ends_at', 'location'],
    };
    for (const key of required[kind]) {
      if (key in record && (typeof record[key] !== 'string' || !String(record[key]).trim()))
        throw new Error('Συμπληρώστε τα υποχρεωτικά πεδία.');
    }
    for (const key of ['fee', 'quantity', 'minimum_stock', 'selling_price']) {
      if (
        key in record &&
        (typeof record[key] !== 'number' ||
          !Number.isFinite(record[key]) ||
          Number(record[key]) < 0)
      )
        throw new Error('Το ποσό πρέπει να είναι μη αρνητικό.');
    }
    const choices: Record<string, readonly string[]> = {
      'delivery.status': [
        'scheduled',
        'preparing',
        'ready',
        'in_transit',
        'delivered',
        'cancelled',
      ],
      'delivery.payment_status': ['pending', 'partial', 'paid'],
      'task.status': ['todo', 'in_progress', 'waiting', 'completed', 'cancelled'],
      'task.priority': ['low', 'normal', 'high', 'urgent'],
      'transaction.status': ['pending', 'partial', 'paid', 'cancelled'],
      'transaction.payment_method': ['cash', 'bank_transfer', 'card', 'other'],
    };
    for (const [key, value] of Object.entries(changes)) {
      const values = choices[kind + '.' + key];
      if (values && !values.includes(String(value))) throw new Error('Μη έγκυρη επιλογή.');
    }
    for (const key of ['scheduled_at', 'starts_at', 'ends_at', 'due_date']) {
      if (key in record && !Number.isFinite(Date.parse(String(record[key]))))
        throw new Error('Μη έγκυρη ημερομηνία.');
    }
    const relations = {
      customer_id: this.customers(),
      vehicle_id: this.vehicles(),
      driver_id: this.profiles(),
      employee_id: this.profiles(),
    };
    for (const [key, rows] of Object.entries(relations)) {
      if (key in record && record[key] !== null && !rows.some((row) => row.id === record[key]))
        throw new Error('Η σχετική εγγραφή δεν βρέθηκε.');
    }
    if (
      kind === 'event' &&
      Date.parse(String(record['ends_at'])) <= Date.parse(String(record['starts_at']))
    )
      throw new Error('Η λήξη πρέπει να είναι μετά την έναρξη.');
    if (kind === 'event' && (existing as CalendarEvent).delivery_id)
      throw new Error('Αλλάξτε την ώρα από την παράδοση.');
    if (
      kind === 'transaction' &&
      (next as Transaction).delivery_id &&
      (next as Transaction).status === 'cancelled'
    )
      throw new Error('Η συνδεδεμένη πληρωμή πρέπει να παραμείνει εκκρεμής, μερική ή εξοφλημένη.');
    const now = new Date().toISOString();
    // All validation precedes writes; related views observe the same operation.
    const writable = store as import('@angular/core').WritableSignal<readonly EditableRecords[K][]>;
    writable.update((rows) =>
      rows.map((row) => (row.id === id ? { ...next, updated_at: now } : row)),
    );
    if (kind === 'delivery') {
      const d = next as Delivery;
      const old = existing as Delivery;
      if (
        d.fee !== old.fee ||
        d.customer_id !== old.customer_id ||
        d.payment_status !== old.payment_status
      ) {
        this.transactions.update((rows) => {
          if (rows.some((row) => row.delivery_id === id))
            return rows.map((row) =>
              row.delivery_id === id
                ? {
                    ...row,
                    amount: d.fee,
                    customer_id: d.customer_id,
                    status: d.payment_status,
                    updated_at: now,
                  }
                : row,
            );
          return [
            {
              ...base(0),
              id: crypto.randomUUID(),
              created_at: now,
              updated_at: now,
              type: 'income',
              category: 'Παράδοση',
              description: 'Πληρωμή παράδοσης #' + d.number,
              amount: d.fee,
              date: d.scheduled_at.slice(0, 10),
              payment_method: 'cash',
              status: d.payment_status,
              customer_id: d.customer_id,
              supplier_id: null,
              delivery_id: id,
            },
            ...rows,
          ];
        });
      }
      const shift = Date.parse(d.scheduled_at) - Date.parse(old.scheduled_at);
      this.events.update((rows) =>
        rows.map((row) =>
          row.delivery_id === id
            ? {
                ...row,
                starts_at: d.scheduled_at,
                ends_at: new Date(Date.parse(row.ends_at) + shift).toISOString(),
                location:
                  this.customers().find((c) => c.id === d.customer_id)?.name + ' · ' + d.address,
                updated_at: now,
              }
            : row,
        ),
      );
    }
    if (kind === 'transaction') {
      const t = next as Transaction;
      const paymentStatus = t.status;
      if (t.delivery_id && paymentStatus !== 'cancelled')
        this.deliveries.update((rows) =>
          rows.map((row) =>
            row.id === t.delivery_id
              ? { ...row, payment_status: paymentStatus, updated_at: now }
              : row,
          ),
        );
    }
    this.log('ενημέρωσε μια εγγραφή', kind, id);
  }
  async completeTask(id: string): Promise<void> {
    await this.updateRecord('task', id, { status: 'completed' });
  }
  async createTask(title: string, description: string, dueDate: string): Promise<void> {
    const record = {
      ...base(0),
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      title,
      description,
      due_date: dueDate,
      category: 'Γενική',
      priority: 'normal' as const,
      status: 'todo' as const,
      employee_id: mockId(1),
      customer_id: null,
      delivery_id: null,
    };
    this.tasks.update((rows) => [record, ...rows]);
    this.log('δημιούργησε την εργασία «' + title + '»', 'task', record.id);
  }
  async createNote(title: string, body: string): Promise<void> {
    const record = {
      ...base(0),
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      title,
      body,
      category: 'Γενική',
      pinned: true,
      reminder: null,
      customer_id: null,
      supplier_id: null,
      delivery_id: null,
      task_id: null,
    };
    this.notes.update((rows) => [record, ...rows]);
    this.log('πρόσθεσε τη σημείωση «' + title + '»', 'note', record.id);
  }
}
