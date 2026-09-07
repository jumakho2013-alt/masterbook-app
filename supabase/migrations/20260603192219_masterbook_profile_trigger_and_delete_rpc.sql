-- Auto-create a profile row when a new auth user signs up. clients/services/
-- appointments/finance all FK to profiles(id), so the profile must exist before
-- any business row can be inserted.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill profiles for any existing auth users without one.
insert into profiles (id, name)
select u.id, coalesce(u.raw_user_meta_data->>'name', '')
from auth.users u
left join profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Account deletion RPC (App Store Guideline 5.1.1(v)). Deletes the auth user;
-- cascade through profiles.id removes all business rows.
create or replace function delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function delete_user() from public;
grant execute on function delete_user() to authenticated;
