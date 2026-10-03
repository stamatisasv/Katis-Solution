import { InjectionToken, Signal } from '@angular/core';
import {
  ActivityLog,
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
export interface EditableRecords {
  delivery: Delivery;
  task: Task;
  product: Product;
  customer: Customer;
  transaction: Transaction;
  note: Note;
  event: CalendarEvent;
}
export type EditableKind = keyof EditableRecords;
export type RecordChanges<K extends EditableKind> = Partial<
  Omit<EditableRecords[K], keyof import('../models/entities').BaseRecord | 'number'>
>;
export interface OperationsRepository {
  readonly profiles: Signal<readonly Profile[]>;
  readonly customers: Signal<readonly Customer[]>;
  readonly deliveries: Signal<readonly Delivery[]>;
  readonly deliveryItems: Signal<readonly DeliveryItem[]>;
  readonly products: Signal<readonly Product[]>;
  readonly tasks: Signal<readonly Task[]>;
  readonly events: Signal<readonly CalendarEvent[]>;
  readonly transactions: Signal<readonly Transaction[]>;
  readonly notes: Signal<readonly Note[]>;
  readonly activities: Signal<readonly ActivityLog[]>;
  readonly vehicles: Signal<readonly Vehicle[]>;
  updateRecord<K extends EditableKind>(
    kind: K,
    id: string,
    changes: RecordChanges<K>,
  ): Promise<void>;
  completeTask(id: string): Promise<void>;
  createTask(title: string, description: string, dueDate: string): Promise<void>;
  createNote(title: string, body: string): Promise<void>;
}
export const OPERATIONS_REPOSITORY = new InjectionToken<OperationsRepository>(
  'OperationsRepository',
);
