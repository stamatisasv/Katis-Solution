# Supabase database setup

Open your Supabase project's **SQL Editor → New query**, paste each script, and run
them in this order:

1. `01_schema.sql`: run once to create 14 tables, relations, constraints, indexes,
   update timestamps, and access policies. Intended for a fresh database; if a
   table already exists, the transaction fails without replacing it.
2. `02_demo_data.sql`: optionally import the fictional Greek demo records with
   multiple rows per INSERT. Repeatable: existing record IDs are skipped. The
   extra supplier, stock movement, and payment records fix missing relationships
   in the app's mock data. Document metadata stays empty until real files exist.
3. `03_bulk_import_example.sql`: a template for importing several actual customers
   at once. Replace its example values first. Re-running creates additional rows.

The scripts are provided for you to run; they have not been applied to the remote
Supabase project.

## Give staff access

Anonymous visitors cannot access any business table. Signed-in users need a
profile linked to their Supabase Auth account. All linked staff share read/write
access to business records; profiles are read-only through the browser API and
managed in the SQL Editor. The `role` field does not currently differentiate
business permissions between admins and employees.

After importing the demo, create your user under **Authentication → Users**, copy
its Auth UUID, and run this in the SQL Editor, replacing the placeholder:

```sql
update public.profiles
set user_id = 'YOUR_AUTH_USER_UUID'::uuid
where id = '00000000-0000-4000-8000-000000000001';
```

Without demo data, provision your profile directly instead:

```sql
insert into public.profiles (user_id, name, role)
values ('YOUR_AUTH_USER_UUID'::uuid, 'Σταμάτης Κατής', 'admin');
```

Profile IDs identify employees/drivers in business tables. `user_id` links an
employee to Auth; demo employees have no Auth account until you link them.
`created_by` defaults to the current linked profile for API inserts. Imports from
the SQL Editor may have a null creator, or you can explicitly supply a profile ID.

## Application integration

The Angular app still uses `MockOperationsRepository`. Running SQL alone will
not switch the screens to database data. The next step is implementing a Supabase
repository and sign-in flow. Table names use snake_case, including
`delivery_items`, `stock_movements`, `calendar_events`, and `activity_logs`.

Stock movements are history records; inserting one does not automatically change
`products.quantity`. Repository code or transactional database functions must
manage stock and linked delivery/payment/calendar changes. Delivery numbers and
stock movement numbers must be supplied by the caller and are unique.

`documents` stores metadata only. Storage buckets, uploads, and Storage access
policies require separate setup.

Access policy design follows the [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).
