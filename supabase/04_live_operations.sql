-- Run after 01_schema.sql. Repeatable; installs atomic save/create operations.
-- Uses invoker privileges: existing RLS and grants apply to every read and write.
begin;

create or replace function public.update_operation(p_kind text, p_id uuid, p_changes jsonb)
returns void language plpgsql security invoker set search_path = ''
as $$
declare
  v_table text;
  v_allowed text[];
  v_required text[];
  v_key text;
  v_columns text;
  v_id uuid;
  v_old_delivery public.deliveries;
  v_delivery public.deliveries;
  v_transaction public.transactions;
  v_link uuid;
  v_profile uuid := private.current_profile_id();
begin
  if v_profile is null then raise exception 'Δεν υπάρχει ενεργό προφίλ προσωπικού.'; end if;
  if p_changes is null or jsonb_typeof(p_changes) <> 'object' or p_changes = '{}'::jsonb then
    raise exception 'Δεν υπάρχουν έγκυρες αλλαγές.';
  end if;
  case p_kind
    when 'delivery' then
      v_table := 'deliveries';
      v_allowed := array['customer_id','address','scheduled_at','vehicle_id','driver_id','status','payment_status','fee','notes'];
      v_required := array['address','scheduled_at'];
      select * into v_old_delivery from public.deliveries where id = p_id for update;
      if not found then raise exception 'Η παράδοση δεν βρέθηκε.'; end if;
    when 'task' then
      v_table := 'tasks'; v_allowed := array['title','description','category','priority','status','employee_id','due_date'];
      v_required := array['title','due_date'];
    when 'product' then
      v_table := 'products'; v_allowed := array['name','quantity','minimum_stock','location','selling_price'];
      v_required := array['name','location'];
    when 'customer' then
      v_table := 'customers'; v_allowed := array['name','phone','email','address','vat_number','notes'];
      v_required := array['name','address'];
    when 'transaction' then
      v_table := 'transactions'; v_allowed := array['description','status','payment_method'];
      v_required := array['description'];
      -- Lock delivery before transaction, matching the delivery-save lock order.
      select delivery_id into v_link from public.transactions where id = p_id;
      if v_link is not null then perform id from public.deliveries where id = v_link for update; end if;
      select * into v_transaction from public.transactions where id = p_id for update;
      if not found then raise exception 'Η πληρωμή δεν βρέθηκε.'; end if;
      if v_transaction.delivery_id is not null and p_changes->>'status' = 'cancelled' then
        raise exception 'Η συνδεδεμένη πληρωμή δεν μπορεί να ακυρωθεί.';
      end if;
    when 'note' then
      v_table := 'notes'; v_allowed := array['title','body','category','pinned'];
      v_required := array['title','category'];
    when 'event' then
      v_table := 'calendar_events'; v_allowed := array['title','starts_at','ends_at','location'];
      v_required := array['title','starts_at','ends_at','location'];
      select delivery_id into v_link from public.calendar_events where id = p_id for update;
      if v_link is not null then raise exception 'Αλλάξτε την ώρα από την παράδοση.'; end if;
    else raise exception 'Μη έγκυρος τύπος εγγραφής.';
  end case;
  for v_key in select jsonb_object_keys(p_changes) loop
    if not (v_key = any(v_allowed)) then raise exception 'Μη επιτρεπτή αλλαγή: %', v_key; end if;
    if v_key = any(v_required) and (p_changes->>v_key is null or btrim(p_changes->>v_key) = '') then
      raise exception 'Συμπληρώστε τα υποχρεωτικά πεδία.';
    end if;
  end loop;
  -- Table/column identifiers come exclusively from the whitelist above.
  select string_agg(format('%I', key), ', ' order by key) into v_columns
    from jsonb_object_keys(p_changes) as keys(key);
  execute format('update public.%I set (%s) = (select %s from jsonb_populate_record(null::public.%I, $1)) where id = $2 returning id',
    v_table, v_columns, v_columns, v_table)
    using p_changes, p_id into v_id;
  if v_id is null then raise exception 'Η εγγραφή δεν βρέθηκε ή δεν έχετε πρόσβαση.'; end if;

  if p_kind = 'delivery' then
    select * into v_delivery from public.deliveries where id = p_id;
    if v_delivery.fee is distinct from v_old_delivery.fee
      or v_delivery.customer_id is distinct from v_old_delivery.customer_id
      or v_delivery.payment_status is distinct from v_old_delivery.payment_status then
      update public.transactions set amount = v_delivery.fee, customer_id = v_delivery.customer_id,
        status = v_delivery.payment_status where delivery_id = p_id;
      if not found then
        insert into public.transactions(type,category,description,amount,date,payment_method,status,customer_id,delivery_id)
        values ('income','Παράδοση','Πληρωμή παράδοσης #' || v_delivery.number,v_delivery.fee,
          (v_delivery.scheduled_at at time zone 'Europe/Athens')::date,'cash',v_delivery.payment_status,v_delivery.customer_id,p_id);
      end if;
    end if;
    update public.calendar_events set starts_at = v_delivery.scheduled_at,
      ends_at = ends_at + (v_delivery.scheduled_at - v_old_delivery.scheduled_at),
      location = (select name from public.customers where id = v_delivery.customer_id) || ' · ' || v_delivery.address
      where delivery_id = p_id;
  elsif p_kind = 'transaction' then
    select * into v_transaction from public.transactions where id = p_id;
    if v_transaction.delivery_id is not null then
      update public.deliveries set payment_status = v_transaction.status where id = v_transaction.delivery_id;
    end if;
  end if;
  insert into public.activity_logs(action,entity,entity_id)
    values ('ενημέρωσε μια εγγραφή', p_kind, p_id);
end;
$$;
revoke all on function public.update_operation(text,uuid,jsonb) from public, anon;
grant execute on function public.update_operation(text,uuid,jsonb) to authenticated;

create or replace function public.create_operation(p_kind text, p_title text, p_body text, p_due_date date default null)
returns uuid language plpgsql security invoker set search_path = ''
as $$
declare
  v_id uuid;
  v_profile uuid := private.current_profile_id();
begin
  if v_profile is null then raise exception 'Δεν υπάρχει ενεργό προφίλ προσωπικού.'; end if;
  if p_title is null or length(btrim(p_title)) < 3 or length(btrim(p_title)) > 160 then
    raise exception 'Ο τίτλος πρέπει να έχει 3 έως 160 χαρακτήρες.';
  end if;
  if p_kind = 'task' then
    if p_due_date is null then raise exception 'Συμπληρώστε την προθεσμία.'; end if;
    insert into public.tasks(title,description,due_date,employee_id)
      values (btrim(p_title),coalesce(p_body,''),p_due_date,v_profile) returning id into v_id;
  elsif p_kind = 'note' then
    insert into public.notes(title,body,pinned)
      values (btrim(p_title),coalesce(p_body,''),true) returning id into v_id;
  else raise exception 'Μη έγκυρος τύπος εγγραφής.';
  end if;
  insert into public.activity_logs(action,entity,entity_id)
    values ('δημιούργησε την εγγραφή «' || btrim(p_title) || '»',p_kind,v_id);
  return v_id;
end;
$$;
revoke all on function public.create_operation(text,text,text,date) from public, anon;
grant execute on function public.create_operation(text,text,text,date) to authenticated;

notify pgrst, 'reload schema';
commit;
