-- Run once in the Supabase SQL Editor on a new project.
-- All 14 tables match src/app/core/models/entities.ts.
-- No DROP statements: existing tables cause the transaction to fail safely.
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  role text not null default 'employee' check (role in ('admin', 'employee'))
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  vat_number text not null default '',
  notes text not null default ''
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  vat_number text not null default '',
  notes text not null default '',
  representative text not null default ''
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  name text not null,
  registration text not null unique
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  sku text not null unique,
  name text not null,
  category text not null default '',
  supplier_id uuid not null references public.suppliers(id),
  unit text not null default 'τεμ.',
  purchase_price numeric(14,2) not null default 0 check (purchase_price >= 0),
  selling_price numeric(14,2) not null default 0 check (selling_price >= 0),
  quantity numeric(14,3) not null default 0 check (quantity >= 0),
  minimum_stock numeric(14,3) not null default 0 check (minimum_stock >= 0),
  location text not null default '',
  active boolean not null default true
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  number text not null unique,
  customer_id uuid not null references public.customers(id),
  address text not null,
  scheduled_at timestamptz not null,
  vehicle_id uuid not null references public.vehicles(id),
  driver_id uuid not null references public.profiles(id),
  status text not null default 'scheduled' check (status in ('scheduled', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'partial')),
  fee numeric(14,2) not null default 0 check (fee >= 0),
  notes text not null default ''
);

create table public.delivery_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(14,3) not null check (quantity > 0)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  title text not null,
  description text not null default '',
  category text not null default 'Γενική',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'waiting', 'completed', 'cancelled')),
  employee_id uuid not null references public.profiles(id),
  customer_id uuid references public.customers(id),
  delivery_id uuid references public.deliveries(id),
  due_date date not null
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  number text not null unique,
  type text not null check (type in ('in', 'out', 'transfer', 'adjustment')),
  product_id uuid not null references public.products(id),
  quantity numeric(14,3) not null check (quantity <> 0),
  from_location text not null default '',
  to_location text not null default '',
  delivery_id uuid references public.deliveries(id),
  notes text not null default '',
  check (type = 'adjustment' or quantity > 0)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  type text not null check (type in ('income', 'expense')),
  category text not null default '',
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  date date not null default current_date,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'bank_transfer', 'card', 'other')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'partial', 'cancelled')),
  customer_id uuid references public.customers(id),
  supplier_id uuid references public.suppliers(id),
  delivery_id uuid references public.deliveries(id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  title text not null,
  body text not null default '',
  category text not null default 'Γενική',
  pinned boolean not null default false,
  reminder timestamptz,
  customer_id uuid references public.customers(id),
  supplier_id uuid references public.suppliers(id),
  delivery_id uuid references public.deliveries(id),
  task_id uuid references public.tasks(id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  name text not null,
  storage_path text not null unique,
  mime_type text not null,
  customer_id uuid references public.customers(id),
  supplier_id uuid references public.suppliers(id),
  delivery_id uuid references public.deliveries(id),
  transaction_id uuid references public.transactions(id),
  product_id uuid references public.products(id),
  task_id uuid references public.tasks(id)
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  title text not null,
  type text not null check (type in ('delivery', 'earthworks', 'pickup', 'supplier', 'meeting', 'task')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text not null default '',
  delivery_id uuid references public.deliveries(id),
  task_id uuid references public.tasks(id),
  check (ends_at > starts_at)
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid not null
);

alter table public.profiles add constraint profiles_created_by_fkey
  foreign key (created_by) references public.profiles(id);

-- The Auth ID is separate from the profile ID so demo employees need no fake Auth users.
-- Profiles are provisioned only by a trusted administrator in the SQL Editor.
create function private.current_profile_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select id from public.profiles where user_id = (select auth.uid());
$$;
revoke all on function private.current_profile_id() from public, anon;
grant execute on function private.current_profile_id() to authenticated;

create function private.set_record_timestamps()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if TG_OP = 'UPDATE' then
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
    NEW.updated_at := now();
  end if;
  return NEW;
end;
$$;
revoke all on function private.set_record_timestamps() from public, anon, authenticated;

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
create policy staff_read on public.profiles
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.profiles
  for each row execute function private.set_record_timestamps();
create index profiles_created_by_idx on public.profiles(created_by);

alter table public.customers enable row level security;
revoke all on table public.customers from anon, authenticated;
grant select on table public.customers to authenticated;
create policy staff_read on public.customers
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.customers
  for each row execute function private.set_record_timestamps();
create index customers_created_by_idx on public.customers(created_by);

alter table public.customers alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.customers to authenticated;
create policy staff_insert on public.customers
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.customers
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.customers
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

alter table public.suppliers enable row level security;
revoke all on table public.suppliers from anon, authenticated;
grant select on table public.suppliers to authenticated;
create policy staff_read on public.suppliers
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.suppliers
  for each row execute function private.set_record_timestamps();
create index suppliers_created_by_idx on public.suppliers(created_by);

alter table public.suppliers alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.suppliers to authenticated;
create policy staff_insert on public.suppliers
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.suppliers
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.suppliers
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

alter table public.vehicles enable row level security;
revoke all on table public.vehicles from anon, authenticated;
grant select on table public.vehicles to authenticated;
create policy staff_read on public.vehicles
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.vehicles
  for each row execute function private.set_record_timestamps();
create index vehicles_created_by_idx on public.vehicles(created_by);

alter table public.vehicles alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.vehicles to authenticated;
create policy staff_insert on public.vehicles
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.vehicles
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.vehicles
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

alter table public.products enable row level security;
revoke all on table public.products from anon, authenticated;
grant select on table public.products to authenticated;
create policy staff_read on public.products
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.products
  for each row execute function private.set_record_timestamps();
create index products_created_by_idx on public.products(created_by);

alter table public.products alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.products to authenticated;
create policy staff_insert on public.products
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.products
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.products
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

create index products_supplier_id_idx on public.products(supplier_id);

alter table public.deliveries enable row level security;
revoke all on table public.deliveries from anon, authenticated;
grant select on table public.deliveries to authenticated;
create policy staff_read on public.deliveries
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.deliveries
  for each row execute function private.set_record_timestamps();
create index deliveries_created_by_idx on public.deliveries(created_by);

alter table public.deliveries alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.deliveries to authenticated;
create policy staff_insert on public.deliveries
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.deliveries
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.deliveries
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

create index deliveries_customer_id_idx on public.deliveries(customer_id);

create index deliveries_vehicle_id_idx on public.deliveries(vehicle_id);

create index deliveries_driver_id_idx on public.deliveries(driver_id);

alter table public.delivery_items enable row level security;
revoke all on table public.delivery_items from anon, authenticated;
grant select on table public.delivery_items to authenticated;
create policy staff_read on public.delivery_items
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.delivery_items
  for each row execute function private.set_record_timestamps();
create index delivery_items_created_by_idx on public.delivery_items(created_by);

alter table public.delivery_items alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.delivery_items to authenticated;
create policy staff_insert on public.delivery_items
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.delivery_items
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.delivery_items
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

create index delivery_items_delivery_id_idx on public.delivery_items(delivery_id);

create index delivery_items_product_id_idx on public.delivery_items(product_id);

alter table public.tasks enable row level security;
revoke all on table public.tasks from anon, authenticated;
grant select on table public.tasks to authenticated;
create policy staff_read on public.tasks
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.tasks
  for each row execute function private.set_record_timestamps();
create index tasks_created_by_idx on public.tasks(created_by);

alter table public.tasks alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.tasks to authenticated;
create policy staff_insert on public.tasks
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.tasks
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.tasks
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

create index tasks_employee_id_idx on public.tasks(employee_id);

create index tasks_customer_id_idx on public.tasks(customer_id);

create index tasks_delivery_id_idx on public.tasks(delivery_id);

alter table public.stock_movements enable row level security;
revoke all on table public.stock_movements from anon, authenticated;
grant select on table public.stock_movements to authenticated;
create policy staff_read on public.stock_movements
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.stock_movements
  for each row execute function private.set_record_timestamps();
create index stock_movements_created_by_idx on public.stock_movements(created_by);

alter table public.stock_movements alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.stock_movements to authenticated;
create policy staff_insert on public.stock_movements
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.stock_movements
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.stock_movements
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

create index stock_movements_product_id_idx on public.stock_movements(product_id);

create index stock_movements_delivery_id_idx on public.stock_movements(delivery_id);

alter table public.transactions enable row level security;
revoke all on table public.transactions from anon, authenticated;
grant select on table public.transactions to authenticated;
create policy staff_read on public.transactions
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.transactions
  for each row execute function private.set_record_timestamps();
create index transactions_created_by_idx on public.transactions(created_by);

alter table public.transactions alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.transactions to authenticated;
create policy staff_insert on public.transactions
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.transactions
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.transactions
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

create index transactions_customer_id_idx on public.transactions(customer_id);

create index transactions_supplier_id_idx on public.transactions(supplier_id);

create index transactions_delivery_id_idx on public.transactions(delivery_id);

alter table public.notes enable row level security;
revoke all on table public.notes from anon, authenticated;
grant select on table public.notes to authenticated;
create policy staff_read on public.notes
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.notes
  for each row execute function private.set_record_timestamps();
create index notes_created_by_idx on public.notes(created_by);

alter table public.notes alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.notes to authenticated;
create policy staff_insert on public.notes
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.notes
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.notes
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

create index notes_customer_id_idx on public.notes(customer_id);

create index notes_supplier_id_idx on public.notes(supplier_id);

create index notes_delivery_id_idx on public.notes(delivery_id);

create index notes_task_id_idx on public.notes(task_id);

alter table public.documents enable row level security;
revoke all on table public.documents from anon, authenticated;
grant select on table public.documents to authenticated;
create policy staff_read on public.documents
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.documents
  for each row execute function private.set_record_timestamps();
create index documents_created_by_idx on public.documents(created_by);

alter table public.documents alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.documents to authenticated;
create policy staff_insert on public.documents
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.documents
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.documents
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

create index documents_customer_id_idx on public.documents(customer_id);

create index documents_supplier_id_idx on public.documents(supplier_id);

create index documents_delivery_id_idx on public.documents(delivery_id);

create index documents_transaction_id_idx on public.documents(transaction_id);

create index documents_product_id_idx on public.documents(product_id);

create index documents_task_id_idx on public.documents(task_id);

alter table public.calendar_events enable row level security;
revoke all on table public.calendar_events from anon, authenticated;
grant select on table public.calendar_events to authenticated;
create policy staff_read on public.calendar_events
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.calendar_events
  for each row execute function private.set_record_timestamps();
create index calendar_events_created_by_idx on public.calendar_events(created_by);

alter table public.calendar_events alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.calendar_events to authenticated;
create policy staff_insert on public.calendar_events
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.calendar_events
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.calendar_events
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

create index calendar_events_delivery_id_idx on public.calendar_events(delivery_id);

create index calendar_events_task_id_idx on public.calendar_events(task_id);

alter table public.activity_logs enable row level security;
revoke all on table public.activity_logs from anon, authenticated;
grant select on table public.activity_logs to authenticated;
create policy staff_read on public.activity_logs
  for select to authenticated
  using ((select private.current_profile_id()) is not null);
create trigger set_record_timestamps before update on public.activity_logs
  for each row execute function private.set_record_timestamps();
create index activity_logs_created_by_idx on public.activity_logs(created_by);

alter table public.activity_logs alter column created_by set default private.current_profile_id();
grant insert, update, delete on table public.activity_logs to authenticated;
create policy staff_insert on public.activity_logs
  for insert to authenticated
  with check ((select private.current_profile_id()) is not null
    and created_by = (select private.current_profile_id()));
create policy staff_update on public.activity_logs
  for update to authenticated
  using ((select private.current_profile_id()) is not null)
  with check ((select private.current_profile_id()) is not null);
create policy staff_delete on public.activity_logs
  for delete to authenticated
  using ((select private.current_profile_id()) is not null);

create index deliveries_scheduled_at_idx on public.deliveries(scheduled_at);
create index tasks_due_date_idx on public.tasks(due_date);
create index transactions_date_idx on public.transactions(date);
create index calendar_events_starts_at_idx on public.calendar_events(starts_at);
create index activity_logs_entity_idx on public.activity_logs(entity, entity_id);

-- Documents store metadata only; Storage buckets and policies are configured separately.
-- Stock movements do not automatically change product quantity.
-- Linked delivery, calendar, and payment updates must be implemented in the repository/RPC.
notify pgrst, 'reload schema';
commit;
