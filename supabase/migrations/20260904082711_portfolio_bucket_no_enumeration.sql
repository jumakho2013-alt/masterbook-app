-- Политика SELECT на бакете portfolio была `using (bucket_id = 'portfolio')`,
-- то есть ЛЮБОЙ мог получить список всех файлов любого мастера через
-- POST /storage/v1/object/list/portfolio (имена, размеры, даты). Проверено
-- пентестом: пользователь A видел файлы пользователя B.
--
-- Опасность не в самой галерее (она публична по замыслу), а в том, что в
-- бакете остаются осиротевшие файлы — фото, которые мастер загрузил и убрал
-- из профиля. Через перечисление их можно найти и скачать.
--
-- Важно: у публичного бакета отдача по /object/public/... НЕ требует этой
-- политики, поэтому галерея на сайте продолжит работать. Политика нужна
-- только для list/select через API — оставляем её владельцу файлов.
drop policy if exists "portfolio public read" on storage.objects;

create policy "portfolio owner can list"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
