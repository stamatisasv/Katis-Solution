-- Run once in the SQL Editor to link the single existing Auth account as admin.
-- If there are multiple Auth users, use the explicit email alternative below.
begin;
do $$
declare
  v_user uuid;
  v_profile uuid;
  v_name text;
begin
  if (select count(*) from auth.users) <> 1 then
    raise exception 'Expected exactly one Auth account. Use the email-specific alternative in this file.';
  end if;
  select id, coalesce(nullif(raw_user_meta_data->>'name',''),email) into v_user,v_name from auth.users;
  select id into v_profile from public.profiles where user_id = v_user;
  if v_profile is not null then
    update public.profiles set role = 'admin' where id = v_profile;
  else
    select id into v_profile from public.profiles
      where role = 'admin' and user_id is null order by created_at,id limit 1;
    if v_profile is null then
      insert into public.profiles(user_id,name,role) values (v_user,v_name,'admin');
    else
      update public.profiles set user_id = v_user where id = v_profile;
    end if;
  end if;
end;
$$;
commit;

-- Multiple accounts? Replace the email and run this alternative separately:
-- insert into public.profiles(user_id,name,role)
-- select id, coalesce(nullif(raw_user_meta_data->>'name',''),email), 'admin'
-- from auth.users where email = 'YOUR_ADMIN_EMAIL'
-- on conflict (user_id) do update set role = 'admin';
