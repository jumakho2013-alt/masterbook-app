create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
exception
  when others then
    -- Никогда не блокируем создание auth-пользователя из-за ошибки профиля:
    -- профиль всё равно апсертится клиентом при первой облачной синхронизации.
    raise warning '[handle_new_user] profile insert failed: %', sqlerrm;
    return new;
end;
$function$;
