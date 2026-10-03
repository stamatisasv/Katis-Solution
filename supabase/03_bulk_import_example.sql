-- Run in the Supabase SQL Editor after 01_schema.sql.
-- Replace these example rows with your actual customers before running.
-- This is a multi-row insert: all rows succeed together or none are inserted.
-- Re-running adds new rows because every row receives a new UUID.
begin;

insert into public.customers
  (name, phone, email, address, vat_number, notes)
values
  ('Νέος πελάτης Α', '22540 30001', 'customer-a@example.com', 'Μύρινα, Λήμνος', '', 'Πρώτη εισαγωγή'),
  ('Νέος πελάτης Β', '22540 30002', 'customer-b@example.com', 'Μούδρος, Λήμνος', '', 'Πρώτη εισαγωγή'),
  ('Νέος πελάτης Γ', '22540 30003', 'customer-c@example.com', 'Κοντιάς, Λήμνος', '', 'Πρώτη εισαγωγή')
returning id, name;

commit;

-- When importing products or deliveries, use existing supplier/customer/profile/
-- vehicle IDs for their foreign keys. 02_demo_data.sql shows related bulk inserts.
