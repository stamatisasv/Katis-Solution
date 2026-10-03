import { TestBed } from '@angular/core/testing';
import { OPERATIONS_REPOSITORY } from './operations.repository';
import { MockOperationsRepository } from './mock-operations.repository';
import { OperationsService } from './operations.service';
describe('Mock operations', () => {
  let repository: MockOperationsRepository;
  let operations: OperationsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: OPERATIONS_REPOSITORY, useExisting: MockOperationsRepository }],
    });
    repository = TestBed.inject(MockOperationsRepository);
    operations = TestBed.inject(OperationsService);
  });
  it('derives dashboard figures from related records', () => {
    expect(operations.todayDeliveries().length).toBe(4);
    expect(operations.lowStock().length).toBe(3);
    expect(operations.pendingAmount()).toBe(1130);
    expect(operations.search('Παπαδόπουλος').map((r) => r.type)).toEqual([
      'Πελάτης',
      'Παράδοση',
      'Εργασία',
      'Πληρωμή',
    ]);
  });
  it('completes a task and updates dashboard counts and audit history', async () => {
    const task = operations.overdueTasks()[0];
    await repository.completeTask(task.id);
    expect(operations.openTasks().length).toBe(6);
    expect(operations.overdueTasks().length).toBe(0);
    expect(repository.activities()[0].entity_id).toBe(task.id);
  });
  it('creates separate session records without modifying existing records', async () => {
    const existing = repository.tasks()[0];
    await repository.createTask('Έλεγχος παραλαβής', 'Παλέτες τσιμέντου', '2026-10-04');
    await repository.createNote('Παραλαβή αύριο', 'Να ελευθερωθεί η αποθήκη.');
    expect(operations.openTasks().length).toBe(8);
    expect(repository.tasks()[0].id).not.toBe(existing.id);
    expect(repository.tasks()[1]).toEqual(existing);
    expect(operations.pinnedNotes()[0].title).toBe('Παραλαβή αύριο');
  });
  it('edits deliveries and synchronizes payments, calendar and dashboard', async () => {
    const delivery = repository.deliveries()[0];
    const originalDuration =
      Date.parse(repository.events()[0].ends_at) - Date.parse(repository.events()[0].starts_at);
    await repository.updateRecord('delivery', delivery.id, {
      fee: 900,
      payment_status: 'paid',
      status: 'delivered',
      scheduled_at: '2026-10-04T10:00:00+03:00',
      address: 'Νέα διεύθυνση',
    });
    expect(operations.todayDeliveries()).toHaveLength(3);
    expect(operations.pendingAmount()).toBe(280);
    expect(repository.transactions()[0].amount).toBe(900);
    expect(repository.transactions()[0].status).toBe('paid');
    const event = repository.events()[0];
    expect(event.starts_at).toBe('2026-10-04T10:00:00+03:00');
    expect(Date.parse(event.ends_at) - Date.parse(event.starts_at)).toBe(originalDuration);
    expect(event.location).toContain('Νέα διεύθυνση');
    expect(repository.activities()[0].entity_id).toBe(delivery.id);
  });
  it('synchronizes a payment status back to its delivery', async () => {
    await repository.updateRecord('transaction', repository.transactions()[0].id, {
      status: 'paid',
    });
    expect(repository.deliveries()[0].payment_status).toBe('paid');
    expect(operations.pendingAmount()).toBe(280);
  });
  it('updates task assignment, inventory alerts, contacts and pinned notes', async () => {
    await repository.updateRecord('task', repository.tasks()[0].id, {
      status: 'completed',
      employee_id: repository.profiles()[1].id,
    });
    await repository.updateRecord('product', repository.products()[0].id, { quantity: 100 });
    await repository.updateRecord('customer', repository.customers()[0].id, {
      name: 'Νέος πελάτης',
    });
    await repository.updateRecord('note', repository.notes()[0].id, { pinned: false });
    expect(operations.overdueTasks()).toHaveLength(0);
    expect(operations.lowStock()).toHaveLength(2);
    expect(operations.customer(repository.customers()[0].id)).toBe('Νέος πελάτης');
    expect(operations.pinnedNotes()).toHaveLength(1);
  });
  it('rejects invalid changes atomically without an activity entry', async () => {
    const before = repository.deliveries();
    const audit = repository.activities();
    await expect(repository.updateRecord('delivery', before[0].id, { fee: -1 })).rejects.toThrow();
    await expect(
      repository.updateRecord('delivery', before[0].id, { customer_id: 'missing' }),
    ).rejects.toThrow();
    await expect(
      repository.updateRecord('delivery', before[0].id, { scheduled_at: 'invalid' }),
    ).rejects.toThrow();
    await expect(repository.completeTask('missing')).rejects.toThrow();
    expect(repository.deliveries()).toBe(before);
    expect(repository.activities()).toBe(audit);
  });
  it('rejects backwards events and directs linked events to delivery editing', async () => {
    await expect(
      repository.updateRecord('event', repository.events()[1].id, {
        ends_at: '2026-10-03T08:00:00+03:00',
      }),
    ).rejects.toThrow();
    await expect(
      repository.updateRecord('event', repository.events()[0].id, { title: 'Changed' }),
    ).rejects.toThrow();
    await repository.updateRecord('event', repository.events()[1].id, { title: 'Αυτοψία' });
    expect(repository.events()[1].title).toBe('Αυτοψία');
  });
  it('adds a missing ledger record when an existing paid delivery becomes pending', async () => {
    const delivery = repository.deliveries()[1];
    await repository.updateRecord('delivery', delivery.id, { payment_status: 'pending' });
    expect(operations.pendingAmount()).toBe(1550);
    expect(repository.transactions().find((t) => t.delivery_id === delivery.id)?.amount).toBe(420);
  });
  it('does not change payment state when only editing a delivery note', async () => {
    const transactions = repository.transactions();
    await repository.updateRecord('delivery', repository.deliveries()[0].id, {
      notes: 'Νέα οδηγία',
    });
    expect(repository.transactions()).toBe(transactions);
    await expect(
      repository.updateRecord('transaction', transactions[0].id, { status: 'cancelled' }),
    ).rejects.toThrow();
  });
});
