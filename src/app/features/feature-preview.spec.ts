import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { appConfig } from '../app.config';
import { routes } from '../app.routes';
import { vi } from 'vitest';
import { MockOperationsRepository } from '../core/services/mock-operations.repository';
import { RecordEditor } from '../shared/components/record-editor';
import { By } from '@angular/platform-browser';

describe('Page workflows', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideRouter(routes)] });
  });
  it('renders every destination and missing delivery without crashing', async () => {
    const harness = await RouterTestingHarness.create();
    for (const path of [
      'dashboard',
      'tasks',
      'calendar',
      'deliveries',
      'inventory',
      'stock-movements',
      'customers',
      'suppliers',
      'finance',
      'notes',
      'documents',
      'activity',
      'settings',
      'deliveries/missing',
    ]) {
      await harness.navigateByUrl('/' + path);
      expect(harness.routeNativeElement?.querySelector('h1')).toBeTruthy();
    }
    expect(harness.routeNativeElement?.textContent).toContain('Η παράδοση δεν βρέθηκε');
  });
  it('edits a delivery from its list, saves without navigation and restores focus', async () => {
    const harness = await RouterTestingHarness.create('/deliveries');
    const repository = TestBed.inject(MockOperationsRepository);
    const button = harness.routeNativeElement!.querySelector<HTMLButtonElement>('.row-edit')!;
    button.focus();
    button.click();
    harness.detectChanges();
    const editor = harness.fixture.debugElement.query(By.directive(RecordEditor))
      .componentInstance as RecordEditor;
    expect(editor.form.controls['address'].value).toBe('Μύρινα, Λήμνος');
    expect(editor.form.controls['scheduled_at'].value).toBe('2026-10-03T08:30');
    editor.form.controls['address'].setValue('Νέα διεύθυνση');
    editor.form.controls['payment_status'].setValue('paid');
    await editor.save();
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(repository.deliveries()[0].address).toBe('Νέα διεύθυνση');
    expect(repository.transactions()[0].status).toBe('paid');
    expect(harness.routeNativeElement!.textContent).toContain('Οι αλλαγές αποθηκεύτηκαν');
    expect(harness.fixture.debugElement.query(By.directive(RecordEditor))).toBeNull();
    expect(document.activeElement).toBe(button);
  });
  it('blocks invalid submissions and cancels drafts without changing records', async () => {
    const harness = await RouterTestingHarness.create('/tasks');
    const repository = TestBed.inject(MockOperationsRepository);
    const before = repository.tasks();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.row-edit')!.click();
    harness.detectChanges();
    const editor = harness.fixture.debugElement.query(By.directive(RecordEditor))
      .componentInstance as RecordEditor;
    editor.form.controls['title'].setValue('   ');
    await editor.save();
    harness.detectChanges();
    expect(repository.tasks()).toBe(before);
    expect(harness.routeNativeElement!.textContent).toContain('Συμπληρώστε έγκυρη τιμή');
    editor.keyboard(new KeyboardEvent('keydown', { key: 'Escape' }));
    harness.detectChanges();
    expect(harness.fixture.debugElement.query(By.directive(RecordEditor))).toBeNull();
    expect(repository.tasks()).toBe(before);
  });
  it('initializes the appropriate editor on each editable page', async () => {
    const harness = await RouterTestingHarness.create();
    for (const [path, kind] of [
      ['tasks', 'task'],
      ['inventory', 'product'],
      ['customers', 'customer'],
      ['finance', 'transaction'],
      ['notes', 'note'],
      ['calendar', 'event'],
    ]) {
      await harness.navigateByUrl('/' + path);
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('.row-edit')!.click();
      harness.detectChanges();
      const editor = harness.fixture.debugElement.query(By.directive(RecordEditor))
        .componentInstance as RecordEditor;
      expect(editor.record().kind).toBe(kind);
      expect(editor.form.valid).toBe(true);
      editor.closed.emit();
      harness.detectChanges();
    }
  });
  it('filters by customer and status and reports empty results', async () => {
    const harness = await RouterTestingHarness.create('/deliveries');
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#page-search')!;
    input.value = 'παπαδοπουλος';
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('tbody tr')).toHaveLength(1);
    input.value = 'does not exist';
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Δεν βρέθηκαν εγγραφές');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    const select = harness.routeNativeElement!.querySelector<HTMLSelectElement>('#page-status')!;
    select.value = 'delivered';
    select.dispatchEvent(new Event('change'));
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(harness.routeNativeElement!.textContent).toContain('#1041');
  });
});
