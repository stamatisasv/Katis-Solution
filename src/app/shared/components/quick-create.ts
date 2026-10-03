import {
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OPERATIONS_REPOSITORY } from '../../core/services/operations.repository';
import { Icon } from './icon';
@Component({
  selector: 'app-quick-create',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './quick-create.html',
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class QuickCreate {
  readonly kind = input.required<'task' | 'note'>();
  readonly closed = output<void>();
  readonly saved = output<string>();
  readonly repository = inject(OPERATIONS_REPOSITORY);
  readonly busy = signal(false);
  readonly submitted = signal(false);
  readonly error = signal('');
  readonly titleField = viewChild<ElementRef<HTMLInputElement>>('titleField');
  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(160),
        Validators.pattern(/.*\S.*/),
      ],
    }),
    description: new FormControl('', { nonNullable: true }),
    dueDate: new FormControl('2026-10-03', { nonNullable: true, validators: Validators.required }),
  });
  constructor() {
    effect(() => this.titleField()?.nativeElement.focus());
  }
  async submit() {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    try {
      const v = this.form.getRawValue();
      if (this.kind() === 'task')
        await this.repository.createTask(v.title.trim(), v.description, v.dueDate);
      else await this.repository.createNote(v.title.trim(), v.description);
      this.saved.emit(
        this.kind() === 'task' ? 'Η εργασία δημιουργήθηκε.' : 'Η σημείωση αποθηκεύτηκε.',
      );
      this.closed.emit();
    } catch {
      this.error.set('Η αποθήκευση απέτυχε. Δοκιμάστε ξανά.');
    } finally {
      this.busy.set(false);
    }
  }
  trapFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const host = event.currentTarget as HTMLElement;
    const targets = Array.from(
      host.querySelectorAll<HTMLElement>('button:not([disabled]),input,textarea'),
    );
    const first = targets[0];
    const last = targets[targets.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
