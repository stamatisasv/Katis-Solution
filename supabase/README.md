# Supabase setup and live login

The Angular app now uses `SupabaseOperationsRepository` in production. Staff sign
in at `/login` with their existing Supabase Auth email/password. The SDK persists
and refreshes the session; protected routes require a linked staff profile.
Signing out clears loaded business data and returns to login.

## Existing database: run these two scripts

Open **Supabase → SQL Editor → New query** and run:

1. `04_live_operations.sql`: installs the atomic create/edit functions used by
   the app. Delivery edits synchronize linked payments and calendar events in the
   same transaction. Payment edits synchronize the delivery payment status. Every
   successful create/edit adds an activity entry. Repeatable.
2. `05_link_admin.sql`: links your single existing Auth account to the existing
   unlinked admin profile (or creates one if needed). Repeatable. It stops if there
   are multiple Auth accounts; use its email-specific alternative in that case.

These new scripts have been validated locally but have **not** been applied to
the remote Supabase project. The browser publishable key cannot run database DDL
or manage Auth accounts. Do not put a service-role key in the Angular app.

After running them, open `/login`, enter the email/password you created in
Supabase Auth, and sign in. If already signed in without a linked profile, use
**Επανέλεγχος πρόσβασης** after running `05_link_admin.sql`.

## New database only

1. Run `01_schema.sql` once: creates 14 tables, relationships, constraints,
   indexes, timestamp triggers, and row-level access policies. Existing tables
   cause a safe transaction failure; this does not replace them.
2. Optionally run `02_demo_data.sql`: inserts 48 fictional demo records with fixed
   IDs. Existing IDs are skipped. Demo dates are 3 October 2026.
3. Run `04_live_operations.sql` and `05_link_admin.sql` as above.

`03_bulk_import_example.sql` is a multi-row customer import template. Replace its
values with actual data first. Running it twice creates additional customers.

## Staff access

Anonymous visitors and Auth users without a linked profile cannot access business
records. All linked staff share read/write access. Profiles are read-only through
the browser API and provisioned in the SQL Editor. The admin/employee role is
displayed in the UI; it does not currently differentiate business permissions.

To add another staff account, create it in **Authentication → Users**, then link
its Auth UUID in the SQL Editor:

```sql
insert into public.profiles (user_id, name, role)
values ('YOUR_AUTH_USER_UUID'::uuid, 'Employee name', 'employee');
```

To link an existing employee instead:

```sql
update public.profiles
set user_id = 'YOUR_AUTH_USER_UUID'::uuid
where id = 'EXISTING_PROFILE_UUID'::uuid;
```

The profile ID identifies the employee/driver in business records. `user_id`
links that profile to Supabase Auth. API-created records automatically use the
current profile as `created_by`; new tasks default to that employee.

## Live data behavior

- All 14 tables load after staff verification, including suppliers, stock movement
  history, and document metadata. Reads are paginated so large tables are not
  silently cut off by PostgREST's row limit.
- Existing editors persist deliveries, tasks, products, customers, payments,
  notes, and calendar events. Quick create persists tasks and notes.
- Refresh after a successful save updates related screens. A failed reload is
  shown separately; a committed save is not reported as failed.
- A loading/retry state replaces silent failures. The app never falls back to
  mock data in production. Mock repositories are used only in isolated UI tests.
- Dashboard dates use the current date in Europe/Athens, including winter/summer
  time handling in date editors. Old demo deliveries will not appear as today's
  deliveries once the date changes.
- The refresh button reloads server data. Changes by other users are not pushed
  automatically through Realtime.

The existing feature scope is preserved: suppliers, stock movement history, and
document metadata have live read views. New delivery/customer/payment/product
forms, stock movement creation, and document uploads are separate workflows that
are not implemented yet. Stock history does not automatically change product
quantities. Supabase Storage buckets and upload/download policies need separate
setup before file handling is enabled.

## Verify with your actual account

1. Sign in and confirm your name and role in the top bar.
2. Verify customers/deliveries match your Supabase tables.
3. Create a task and a note, then reload the browser: both should remain.
4. Change a delivery payment status and verify the Finance page, calendar, and
   Activity page update together.
5. Sign out and open `/deliveries`: you should return to `/login`.

`npm test -- --watch=false` runs the local route, session, date, repository, and
existing workflow tests. Database functions have also been exercised locally in
PostgreSQL-compatible PGlite with RLS and atomic rollback checks. A real account
sign-in/write test still requires your own login and the two new SQL scripts.

Access policies follow the [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).
