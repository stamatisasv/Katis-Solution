export type UUID = string;
export interface BaseRecord {
  id: UUID;
  created_at: string;
  updated_at: string;
  created_by: UUID;
}
export interface Profile extends BaseRecord {
  name: string;
  role: 'admin' | 'employee';
}
export interface Customer extends BaseRecord {
  name: string;
  phone: string;
  email: string;
  address: string;
  vat_number: string;
  notes: string;
}
export interface Supplier extends Customer {
  representative: string;
}
export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';
export interface Task extends BaseRecord {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: TaskStatus;
  employee_id: UUID;
  customer_id: UUID | null;
  delivery_id: UUID | null;
  due_date: string;
}
export type DeliveryStatus =
  'scheduled' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled';
export interface Delivery extends BaseRecord {
  number: string;
  customer_id: UUID;
  address: string;
  scheduled_at: string;
  vehicle_id: UUID;
  driver_id: UUID;
  status: DeliveryStatus;
  payment_status: 'pending' | 'paid' | 'partial';
  fee: number;
  notes: string;
}
export interface DeliveryItem extends BaseRecord {
  delivery_id: UUID;
  product_id: UUID;
  quantity: number;
}
export interface Product extends BaseRecord {
  sku: string;
  name: string;
  category: string;
  supplier_id: UUID;
  unit: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  minimum_stock: number;
  location: string;
  active: boolean;
}
export interface StockMovement extends BaseRecord {
  number: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  product_id: UUID;
  quantity: number;
  from_location: string;
  to_location: string;
  delivery_id: UUID | null;
  notes: string;
}
export interface Transaction extends BaseRecord {
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'other';
  status: 'pending' | 'paid' | 'partial' | 'cancelled';
  customer_id: UUID | null;
  supplier_id: UUID | null;
  delivery_id: UUID | null;
}
export interface Note extends BaseRecord {
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  reminder: string | null;
  customer_id: UUID | null;
  supplier_id: UUID | null;
  delivery_id: UUID | null;
  task_id: UUID | null;
}
export interface Document extends BaseRecord {
  name: string;
  storage_path: string;
  mime_type: string;
  customer_id: UUID | null;
  supplier_id: UUID | null;
  delivery_id: UUID | null;
  transaction_id: UUID | null;
  product_id: UUID | null;
  task_id: UUID | null;
}
export interface CalendarEvent extends BaseRecord {
  title: string;
  type: 'delivery' | 'earthworks' | 'pickup' | 'supplier' | 'meeting' | 'task';
  starts_at: string;
  ends_at: string;
  location: string;
  delivery_id: UUID | null;
  task_id: UUID | null;
}
export interface ActivityLog extends BaseRecord {
  action: string;
  entity: string;
  entity_id: UUID;
}
export interface Vehicle extends BaseRecord {
  name: string;
  registration: string;
}
