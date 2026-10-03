import {
  Component,
  ElementRef,
  OnInit,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EditableKind, OPERATIONS_REPOSITORY } from '../../core/services/operations.repository';

export interface EditorField {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'datetime-local' | 'checkbox';
  required?: boolean;
  options?: { value: string; label: string }[];
}
export interface EditorRecord {
  kind: EditableKind;
  id: string;
  title: string;
  values: Record<string, unknown>;
  fields: EditorField[];
}
@Component({
  selector: 'app-record-editor',
  imports: [ReactiveFormsModule],
  template: ` <div class="modal-overlay">
    <section
      #dialog
      class="form-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-title"
      (keydown)="keyboard($event)"
    >
      <header>
        <h2 id="edit-title">{{ record().title }}</h2>
        <button
          class="icon-button"
          type="button"
          aria-label="Κλείσιμο"
          [disabled]="busy()"
          (click)="closed.emit()"
        >
          ×
        </button>
      </header>
      <form [formGroup]="form" (ngSubmit)="save()">
        @for (field of record().fields; track field.key) {
          <label [for]="'edit-' + field.key"
            >{{ field.label }}{{ field.required ? ' *' : '' }}</label
          >
          @if (field.options) {
            <select [id]="'edit-' + field.key" [formControlName]="field.key">
              @for (option of field.options; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          } @else if (field.type === 'textarea') {
            <textarea [id]="'edit-' + field.key" [formControlName]="field.key" rows="3"></textarea>
          } @else {
            <input
              [id]="'edit-' + field.key"
              [type]="field.type || 'text'"
              [formControlName]="field.key"
              [attr.min]="field.type === 'number' ? 0 : null"
              [attr.step]="field.type === 'number' ? 'any' : null"
            />
          }
          @if (form.controls[field.key].touched && form.controls[field.key].invalid) {
            <small class="error-text">Συμπληρώστε έγκυρη τιμή για {{ field.label }}.</small>
          }
        }
        <p class="muted small">Οι αλλαγές διατηρούνται μόνο στην τρέχουσα συνεδρία.</p>
        @if (error()) {
          <p class="error-text" role="alert">{{ error() }}</p>
        }
        <footer>
          <button
            class="button secondary"
            type="button"
            [disabled]="busy()"
            (click)="closed.emit()"
          >
            Ακύρωση</button
          ><button class="button primary" [disabled]="busy()" type="submit">
            {{ busy() ? 'Αποθήκευση…' : 'Αποθήκευση' }}
          </button>
        </footer>
      </form>
    </section>
  </div>`,
})
export class RecordEditor implements OnInit {
  readonly record = input.required<EditorRecord>();
  readonly closed = output<void>();
  readonly saved = output<void>();
  readonly repository = inject(OPERATIONS_REPOSITORY);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  readonly form = new FormGroup<Record<string, FormControl>>({});
  constructor() {
    afterNextRender(() =>
      this.dialog()?.nativeElement.querySelector<HTMLElement>('input,select,textarea')?.focus(),
    );
  }
  ngOnInit() {
    for (const field of this.record().fields) {
      const validators = field.required
        ? [
            Validators.required,
            ...(field.type === 'text' || !field.type ? [Validators.pattern(/.*\S.*/)] : []),
          ]
        : [];
      if (field.type === 'number') validators.push(Validators.min(0));
      this.form.addControl(field.key, new FormControl(this.record().values[field.key], validators));
    }
  }
  keyboard(event: KeyboardEvent) {
    if (event.key === 'Escape' && !this.busy()) {
      event.stopPropagation();
      this.closed.emit();
    }
    if (event.key !== 'Tab') return;
    const nodes = Array.from(
      this.dialog()!.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]),input,select,textarea',
      ),
    );
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  async save() {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid || !Object.keys(this.form.controls).length) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const changes = this.form.getRawValue();
      for (const field of this.record().fields) {
        if (typeof changes[field.key] === 'string') changes[field.key] = changes[field.key].trim();
        if (field.type === 'datetime-local') changes[field.key] += ':00+03:00';
      }
      await this.repository.updateRecord(this.record().kind, this.record().id, changes);
      this.saved.emit();
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Η αποθήκευση απέτυχε. Δοκιμάστε ξανά.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
