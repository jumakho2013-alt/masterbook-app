-- Отзывы от клиентов. Раньше их не мог оставить никто, кроме самого мастера
-- (и эту дыру закрыли): 0 отзывов, рейтинг на сайте ничего не значил.
-- Теперь: мастер у ЗАВЕРШЁННОЙ записи просит отзыв → получает одноразовую
-- ссылку → отправляет клиенту → клиент ставит оценку на сайте. Один визит —
-- один отзыв; ссылка работает один раз.
create table if not exists public.review_requests (
  token text primary key,
  appointment_id text not null unique,
  master_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null default '',
  service_name text not null default '',
  visit_date text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
create index if not exists idx_review_requests_master on public.review_requests(master_id);
alter table public.review_requests enable row level security;
revoke all on public.review_requests from anon, authenticated;

create unique index if not exists idx_reviews_one_per_visit
  on public.reviews(appointment_id) where appointment_id is not null;

-- Мастер: ссылка на отзыв для своей завершённой записи (повторный вызов
-- отдаёт ту же ссылку).
create or replace function public.request_review_link(p_appointment_id text)
returns text language plpgsql security definer set search_path = public as $$
declare
  a public.appointments%rowtype;
  v_token text;
  v_client text;
  v_service text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into a from public.appointments
   where id = p_appointment_id and user_id = auth.uid() and deleted_at is null;
  if not found then raise exception 'appointment not found'; end if;
  if a.status <> 'completed' then raise exception 'not completed'; end if;

  select token into v_token from public.review_requests where appointment_id = a.id;
  if v_token is not null then return v_token; end if;

  select name into v_client from public.clients where id = a.client_id and user_id = a.user_id;
  select name into v_service from public.services where id = a.service_id and user_id = a.user_id;
  v_token := replace(gen_random_uuid()::text, '-', '');
  insert into public.review_requests (token, appointment_id, master_id, client_name, service_name, visit_date)
  values (v_token, a.id, a.user_id, split_part(coalesce(v_client, ''), ' ', 1), coalesce(v_service, ''), a.date);
  return v_token;
end $$;

-- Страница отзыва: что показать клиенту по ссылке (без телефонов и прочего).
create or replace function public.review_request_info(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when r.token is null then jsonb_build_object('status', 'not_found')
    else jsonb_build_object(
      'status', case when r.used_at is not null then 'used' else 'ok' end,
      'client_name', r.client_name,
      'service', r.service_name,
      'date', r.visit_date,
      'master_name', p.name,
      'slug', case when p.published then p.slug end)
    end
  from (select 1) one
  left join public.review_requests r on r.token = p_token
  left join public.profiles p on p.id = r.master_id
$$;

-- Отправка отзыва клиентом. Одноразово: под блокировкой строки запроса.
create or replace function public.submit_review(p_token text, p_rating int, p_comment text, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare
  r public.review_requests%rowtype;
  v_name text;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then return 'bad_rating'; end if;
  select * into r from public.review_requests where token = p_token for update;
  if not found then return 'not_found'; end if;
  if r.used_at is not null then return 'used'; end if;
  v_name := left(nullif(trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), ''), 40);
  insert into public.reviews (master_id, appointment_id, client_name, rating, comment, published)
  values (r.master_id, r.appointment_id, coalesce(v_name, nullif(r.client_name, ''), 'Клиент'),
          p_rating, left(nullif(trim(coalesce(p_comment, '')), ''), 1000), true);
  update public.review_requests set used_at = now() where token = r.token;
  return 'ok';
end $$;

revoke all on function public.request_review_link(text) from public, anon;
grant execute on function public.request_review_link(text) to authenticated;
revoke all on function public.review_request_info(text) from public;
grant execute on function public.review_request_info(text) to anon, authenticated;
revoke all on function public.submit_review(text, int, text, text) from public;
grant execute on function public.submit_review(text, int, text, text) to anon, authenticated;
