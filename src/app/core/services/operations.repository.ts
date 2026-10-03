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
  completeTask(id: string): Promise<void>;
  createTask(title: string, description: string, dueDate: string): Promise<void>;
  createNote(title: string, body: string): Promise<void>;
}
export const OPERATIONS_REPOSITORY = new InjectionToken<OperationsRepository>(
  'OperationsRepository',
);
