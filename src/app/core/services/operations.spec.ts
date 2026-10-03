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
});
