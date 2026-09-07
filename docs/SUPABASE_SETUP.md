---
layout: default
title: Supabase setup — MasterBook
permalink: /supabase-setup/
---

# Supabase — пошаговая настройка

**Время:** ~10 минут. **Без команд в терминале.** Только UI Supabase.

---

## 1. Создать проект

1. Зайди на <https://supabase.com/dashboard> (логин GitHub или email).
2. **New project** → название `masterbook` (или любое), регион ближайший к пользователям (для RU → Frankfurt), придумай database password (сохрани в passwords, пригодится).
3. Подожди 2 минуты пока проект разворачивается.

---

## 2. Применить схему БД

Схема живёт в `supabase/migrations/` — это единственный источник правды.
Файлы применяются **строго по возрастанию имени** (имя начинается с метки времени).

**Способ А — через Supabase CLI (рекомендуется):**

```bash
npx supabase link --project-ref <ref из URL дашборда>
npx supabase db push
```

**Способ Б — вручную, если CLI недоступен:**

1. В левом меню → **SQL Editor** → **New query**.
2. Открывай файлы из `supabase/migrations/` **по порядку**, от самого раннего
   к самому позднему, и выполняй каждый отдельно.
3. После каждого — зелёный `Success`. Порядок нарушать нельзя: поздние
   миграции опираются на таблицы и функции из ранних.

**Что получится:**
- Таблицы `profiles`, `clients`, `services`, `appointments`, `finance_entries`,
  `reviews`, `master_billing`, `payments`, `promotions`, `promotion_packages`
- Row Level Security — каждый мастер видит только свои строки; каталог
  публичен только для тех, кто сам нажал «Опубликовать»
- Колоночные гранты — мастер не может выписать себе премиум или рейтинг
- Триггер `handle_new_user` — профиль создаётся при регистрации
- RPC `delete_user()` — для кнопки «Удалить аккаунт»
- Крон-джобы `expire-premium` и `purge-tombstones`

> Подробности про сам каталог миграций и правила работы с ним —
> [`supabase/README.md`](../supabase/README.md).

---

## 3. Получить ключи для клиента

1. В левом меню → **Settings** (шестерёнка снизу) → **API**.
2. Скопируй:
   - **Project URL** → идёт в `EXPO_PUBLIC_SUPABASE_URL`
   - **Project API keys → `anon` `public`** → идёт в `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Открой в проекте файл `.env.local` и замени placeholder:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...длинная строка...

# ВАЖНО: для production убери или поставь 0.
# С =1 при запуске засеиваются демо-данные и auth обходится.
EXPO_PUBLIC_DEV_PREVIEW=0
```

4. Перезапусти Metro: в терминале Ctrl+C → снова `npx expo start`.

**⚠️ Никогда не коммить реальные ключи в git.** `.env.local` уже в `.gitignore`. Для EAS Build → задавай через EAS Secrets:
```
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..."
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
```

---

## 4. Включить Email auth

Обычно уже включён по умолчанию, но проверь:

1. **Authentication → Providers → Email**.
2. **Enable Email provider** = On.
3. **Confirm email** = Off *(можно включить позже когда будет production-домен для confirmation email)*.
4. **Secure email change** = On.
5. **Secure password change** = On.
6. **Save**.

---

## 5. (Опционально) Включить Apple Sign-In

Нужно только когда получишь Apple Developer аккаунт.

1. В Apple Developer Console:
   - **Identifiers** → твой bundle id → Edit → отметь **Sign In with Apple**.
   - **Identifiers** → **+ new** → Services IDs → создать `com.masterbook.app.signin` (пример).
   - У Services ID → включить Sign in with Apple → Configure → вписать **Return URL** из Supabase (шаг ниже).
   - **Keys** → **+ new** → Sign in with Apple → Save → скачать `.p8` (один раз, не повторится!).

2. В Supabase:
   - **Authentication → Providers → Apple** → Enable.
   - **Services ID:** `com.masterbook.app.signin`
   - **Secret key (.p8):** открой скачанный файл текстовым редактором, скопируй содержимое целиком (с `-----BEGIN PRIVATE KEY-----` до `-----END`).
   - **Key ID:** из Apple Keys страницы.
   - **Team ID:** из Apple Developer membership.
   - **Callback URL (copy this):** → в Apple Services ID → Return URLs вставь этот URL.
   - **Save**.

3. В `app.json` уже стоит `usesAppleSignIn: true` и плагин — ничего менять не нужно.

4. В приложении на экране логина появится нативная кнопка «Войти через Apple» (рендерится только на iOS).

---

## 6. Настроить Email templates (для confirmation / reset password)

**Authentication → Email templates.** По умолчанию шаблоны английские и от Supabase — лучше заменить на русские.

### Reset password (пример)

```
Subject: Сброс пароля MasterBook

Привет!

Вы запросили сброс пароля в MasterBook. Нажмите ссылку ниже чтобы задать новый пароль:

{{ .ConfirmationURL }}

Если это были не вы — просто проигнорируйте письмо, пароль останется прежним.

— Команда MasterBook
```

### Confirm signup (если включишь confirm email)

```
Subject: Подтвердите email в MasterBook

Привет!

Нажмите ссылку чтобы подтвердить email:

{{ .ConfirmationURL }}

— Команда MasterBook
```

---

## 7. Проверить что всё работает

1. В `.env.local` поставь `EXPO_PUBLIC_DEV_PREVIEW=0`.
2. Запусти приложение.
3. На экране логина → нажми «Зарегистрироваться».
4. Введи email + пароль + имя → Зарегистрироваться.
5. В Supabase → **Authentication → Users** должен появиться новый пользователь.
6. **Table Editor → profiles** → появилась строка с твоим именем (это сработал триггер `handle_new_user`).
7. В приложении добавь клиента → проверь что в **Table Editor → clients** появилась строка с правильным `user_id`.
   - Строка появляется не мгновенно: пуш в облако идёт с задержкой (debounce),
     а полный синк — при возврате приложения из фона и по pull-to-refresh.
   - Если строки нет — смотри лог Metro на `permission denied`. Это почти всегда
     означает, что гранты в БД разошлись с тем, какие колонки шлёт
     `src/lib/cloudSync.ts` (см. миграции `fix_*_upsert_*`).

---

## 8. Как устроена синхронизация

Слой синка реализован в `src/lib/cloudSync.ts`. Коротко:

1. Сторы (Zustand) — источник правды на устройстве, пишут в AsyncStorage.
2. После каждой мутации — отложенный пуш в облако (debounce).
3. `syncNow()` = pull, затем push. Дёргается при входе, при возврате из фона
   (не чаще раза в 5 минут) и по pull-to-refresh.
4. Разрешение конфликтов — last-write-wins по `updated_at` (`src/lib/syncMerge.ts`).
   Удаления едут как tombstones (`deleted_at`), чтобы удаление не «воскресало»
   со второго устройства.

Чего пока нет: офлайн-очереди операций и инкрементальной выборки — при каждом
пуше уезжает весь локальный набор.

---

## Проблемы

### `Invalid API key` при запуске
→ Проверь что в `.env.local` стоит `anon public` ключ, а не `service_role`. Последний нельзя использовать в клиенте.

### Регистрация не создаёт профиль в `profiles`
→ Триггер `handle_new_user` не сработал. Открой **Database → Functions** → убедись что функция создана. Если нет — примени миграцию `supabase/migrations/*_fix_handle_new_user_search_path.sql`.

### `Permission denied for table clients`
→ RLS настроены, но у пользователя нет сессии. Проверь что `supabase.auth.getSession()` возвращает сессию перед запросом.

### Supabase RPC `delete_user` не работает
→ Применена ли миграция `*_masterbook_profile_trigger_and_delete_rpc.sql`, а следом `*_harden_function_grants.sql` (она оставляет право вызова только роли `authenticated`).

---

[← На главную](/)
