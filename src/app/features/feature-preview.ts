import {
  Component,
  computed,
  inject,
  signal,
  effect,
  afterNextRender,
  Injector,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OperationsService } from '../core/services/operations.service';
import { QuickCreateService } from '../core/services/quick-create.service';
import { PageHeader } from '../shared/components/page-header';
import { StatusBadge } from '../shared/components/status-badge';
import { Icon } from '../shared/components/icon';
import { RecordEditor, EditorRecord, EditorField } from '../shared/components/record-editor';
import { EditableKind } from '../core/services/operations.repository';
import { BaseRecord } from '../core/models/entities';
@Component({
  selector: 'app-feature-preview',
  imports: [RecordEditor, PageHeader, StatusBadge, Icon, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './feature-preview.html',
})
export class FeaturePreview {
  readonly query = signal('');
  readonly statusFilter = signal('');
  readonly filterOptions = computed(() => {
    const rows = this.pageRows();
    return [
      ...new Set(
        rows
          .map((row) => String((row as unknown as Record<string, unknown>)['status'] ?? ''))
          .filter(Boolean),
      ),
    ];
  });
  pageRows(): readonly BaseRecord[] {
    const repo = this.ops.repository;
    switch (this.feature()) {
      case 'tasks':
        return repo.tasks();
      case 'deliveries':
        return repo.deliveries();
      case 'inventory':
        return repo.products();
      case 'customers':
        return repo.customers();
      case 'finance':
        return repo.transactions();
      case 'notes':
        return repo.notes();
      default:
        return [];
    }
  }
  filtered<T extends BaseRecord>(rows: readonly T[]): readonly T[] {
    const normalize = (text: string) =>
      text
        .toLocaleLowerCase('el')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const query = normalize(this.query().trim());
    return rows.filter((row) => {
      const data = row as unknown as Record<string, unknown>;
      const customer = data['customer_id'] ? this.ops.customer(String(data['customer_id'])) : '';
      const employee = data['employee_id'] ? this.ops.employee(String(data['employee_id'])) : '';
      return (
        (!this.statusFilter() || data['status'] === this.statusFilter()) &&
        normalize(Object.values(data).join(' ') + ' ' + customer + ' ' + employee).includes(query)
      );
    });
  }
  statusLabel(status: string): string {
    return (
      (
        {
          todo: 'Προς εκτέλεση',
          in_progress: 'Σε εξέλιξη',
          waiting: 'Αναμονή',
          completed: 'Ολοκληρώθηκε',
          cancelled: 'Ακυρώθηκε',
          scheduled: 'Προγραμματισμένη',
          preparing: 'Προετοιμασία',
          ready: 'Έτοιμη',
          in_transit: 'Σε μεταφορά',
          delivered: 'Παραδόθηκε',
          pending: 'Εκκρεμεί',
          partial: 'Μερική',
          paid: 'Πληρώθηκε',
        } as Record<string, string>
      )[status] || status
    );
  }
  constructor() {
    effect(() => {
      this.feature();
      this.query.set('');
      this.statusFilter.set('');
      this.editing.set(null);
      this.message.set('');
    });
  }
  readonly editing = signal<EditorRecord | null>(null);
  readonly message = signal('');
  private readonly injector = inject(Injector);
  private trigger: HTMLElement | null = null;
  readonly subtitles: Record<string, string> = {
    tasks: 'Ανάθεση, προθεσμίες και ολοκλήρωση εργασιών από αυτή τη σελίδα.',
    deliveries: 'Προγραμματισμός, στοιχεία και κατάσταση παραδόσεων από αυτή τη σελίδα.',
    'delivery-detail': 'Στοιχεία παράδοσης, οδηγός και πληρωμή.',
    inventory: 'Έλεγχος και διόρθωση αποθέματος, τιμών και θέσης προϊόντων.',
    customers: 'Στοιχεία επικοινωνίας και διευθύνσεις πελατών.',
    finance: 'Παρακολούθηση και ενημέρωση πληρωμών.',
    notes: 'Δημιουργία, επεξεργασία και καρφίτσωμα σημειώσεων.',
    calendar: 'Ημερήσιο πρόγραμμα. Οι ώρες παραδόσεων αλλάζουν από την αντίστοιχη παράδοση.',
    suppliers: 'Κατάλογος προμηθευτών, επαφές και στοιχεία συνεργασίας · Υπό κατασκευή.',
    'stock-movements': 'Παραλαβές, έξοδοι και μεταφορές αποθέματος · Υπό κατασκευή.',
    documents: 'Αρχεία και έγγραφα συνδεδεμένα με τις εγγραφές · Υπό κατασκευή.',
    activity: 'Ιστορικό ενεργειών και αλλαγών.',
    settings: 'Πληροφορίες του δοκιμαστικού περιβάλλοντος.',
  };
  edit(kind: EditableKind, row: BaseRecord, title: string) {
    const options = (values: string[], labels: string[]) =>
      values.map((value, i) => ({ value, label: labels[i] }));
    const field = (
      key: string,
      label: string,
      type: EditorField['type'] = 'text',
      required = true,
    ): EditorField => ({ key, label, type, required });
    const select = (
      key: string,
      label: string,
      choices: { value: string; label: string }[],
    ): EditorField => ({ key, label, options: choices, required: true });
    const employees = this.ops.repository.profiles().map((p) => ({ value: p.id, label: p.name }));
    const fields: Record<EditableKind, EditorField[]> = {
      delivery: [
        select(
          'customer_id',
          'Πελάτης',
          this.ops.repository.customers().map((c) => ({ value: c.id, label: c.name })),
        ),
        field('address', 'Διεύθυνση'),
        field('scheduled_at', 'Άφιξη (ώρα Ελλάδας)', 'datetime-local'),
        select(
          'vehicle_id',
          'Όχημα',
          this.ops.repository.vehicles().map((v) => ({ value: v.id, label: v.name })),
        ),
        select('driver_id', 'Οδηγός', employees),
        select(
          'status',
          'Κατάσταση',
          options(
            ['scheduled', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled'],
            [
              'Προγραμματισμένη',
              'Προετοιμασία',
              'Έτοιμη',
              'Σε μεταφορά',
              'Παραδόθηκε',
              'Ακυρώθηκε',
            ],
          ),
        ),
        select(
          'payment_status',
          'Πληρωμή',
          options(['pending', 'partial', 'paid'], ['Εκκρεμεί', 'Μερική', 'Πληρώθηκε']),
        ),
        field('fee', 'Αξία (€)', 'number'),
        field('notes', 'Σημειώσεις', 'textarea', false),
      ],
      task: [
        field('title', 'Τίτλος'),
        field('description', 'Περιγραφή', 'textarea', false),
        field('due_date', 'Προθεσμία', 'date'),
        select('employee_id', 'Υπεύθυνος', employees),
        select(
          'priority',
          'Προτεραιότητα',
          options(
            ['low', 'normal', 'high', 'urgent'],
            ['Χαμηλή', 'Κανονική', 'Υψηλή', 'Επείγουσα'],
          ),
        ),
        select(
          'status',
          'Κατάσταση',
          options(
            ['todo', 'in_progress', 'waiting', 'completed', 'cancelled'],
            ['Προς εκτέλεση', 'Σε εξέλιξη', 'Αναμονή', 'Ολοκληρώθηκε', 'Ακυρώθηκε'],
          ),
        ),
      ],
      product: [
        field('name', 'Προϊόν'),
        field('quantity', 'Απόθεμα', 'number'),
        field('minimum_stock', 'Ελάχιστο απόθεμα', 'number'),
        field('selling_price', 'Τιμή πώλησης (€)', 'number'),
        field('location', 'Θέση'),
      ],
      customer: [
        field('name', 'Όνομα'),
        field('phone', 'Τηλέφωνο', 'text', false),
        field('email', 'Email', 'text', false),
        field('address', 'Διεύθυνση'),
        field('vat_number', 'ΑΦΜ', 'text', false),
        field('notes', 'Σημειώσεις', 'textarea', false),
      ],
      transaction: [
        field('description', 'Περιγραφή'),
        select(
          'status',
          'Κατάσταση',
          options(
            ['pending', 'partial', 'paid', 'cancelled'],
            ['Εκκρεμεί', 'Μερική', 'Πληρώθηκε', 'Ακυρώθηκε'],
          ),
        ),
        select(
          'payment_method',
          'Τρόπος πληρωμής',
          options(
            ['cash', 'bank_transfer', 'card', 'other'],
            ['Μετρητά', 'Τραπεζική μεταφορά', 'Κάρτα', 'Άλλο'],
          ),
        ),
      ],
      note: [
        field('title', 'Τίτλος'),
        field('body', 'Κείμενο', 'textarea', false),
        field('category', 'Κατηγορία'),
        field('pinned', 'Καρφιτσωμένη', 'checkbox', false),
      ],
      event: [
        field('title', 'Τίτλος'),
        field('starts_at', 'Έναρξη (ώρα Ελλάδας)', 'datetime-local'),
        field('ends_at', 'Λήξη (ώρα Ελλάδας)', 'datetime-local'),
        field('location', 'Τοποθεσία'),
      ],
    };
    if (kind === 'transaction' && (row as unknown as Record<string, unknown>)['delivery_id']) {
      const status = fields.transaction.find((field) => field.key === 'status')!;
      status.options = status.options!.filter((option) => option.value !== 'cancelled');
    }
    const values = { ...row } as unknown as Record<string, unknown>;
    for (const f of fields[kind])
      if (f.type === 'datetime-local') {
        const date = new Date(String(values[f.key]));
        values[f.key] = new Date(date.getTime() + 3 * 3600000).toISOString().slice(0, 16);
      }
    this.trigger = document.activeElement as HTMLElement;
    this.message.set('');
    this.editing.set({ kind, id: row.id, title, values, fields: fields[kind] });
  }
  closeEditor(saved = false) {
    this.editing.set(null);
    if (saved) this.message.set('Οι αλλαγές αποθηκεύτηκαν.');
    afterNextRender(() => this.trigger?.focus(), { injector: this.injector });
  }
  readonly route = inject(ActivatedRoute);
  readonly data = toSignal(this.route.data);
  readonly params = toSignal(this.route.paramMap);
  readonly ops = inject(OperationsService);
  readonly quick = inject(QuickCreateService);
  readonly title = computed(() => String(this.data()?.['title'] ?? ''));
  readonly feature = computed(() => String(this.data()?.['feature'] ?? ''));
  readonly delivery = computed(() =>
    this.ops.repository.deliveries().find((d) => d.id === this.params()?.get('id')),
  );
}
