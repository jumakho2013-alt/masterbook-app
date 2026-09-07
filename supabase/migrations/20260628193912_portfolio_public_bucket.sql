-- Публичный бакет для портфолио мастеров: сайт показывает фото через <img src>
-- напрямую (приватный bucket 'photos' с 120-сек signed URL для этого не годится).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Чтение — публичное (каталог открыт всем).
drop policy if exists "portfolio public read" on storage.objects;
create policy "portfolio public read"
  on storage.objects for select
  using (bucket_id = 'portfolio');

-- Запись/изменение/удаление — только в свою папку {auth.uid()}/...
drop policy if exists "portfolio owner insert" on storage.objects;
create policy "portfolio owner insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "portfolio owner update" on storage.objects;
create policy "portfolio owner update"
  on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "portfolio owner delete" on storage.objects;
create policy "portfolio owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
