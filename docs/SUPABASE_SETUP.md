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

1. В левом меню → **SQL Editor** → **New query**.
2. Открой в репозитории файл `supabase-schema.sql`, скопируй целиком.
3. Вставь в SQL Editor → **Run** (Cmd/Ctrl + Enter).
4. Проверь что внизу нет ошибок — должен быть зелёный `Success. No rows returned`.

**Что это сделало:**
- Таблицы `profiles`, `clients`, `services`, `appointments`, `finance_entries`
- Row Level Security (RLS) — каждый пользователь видит только свои строки
- Триггер `handle_new_user` — автоматически создаёт профиль при регистрации
- RPC `delete_user()` — нужна для кнопки «Удалить аккаунт»

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
   - *Если строка не появилась — значит sync-слой ещё не реализован. Сейчас данные пишутся в AsyncStorage. Ждёт реализации Supabase sync.*

---

## 8. На будущее — синхронизация с Supabase

Сейчас сторы (Zustand) пишут только в AsyncStorage. Таблицы Supabase созданы и готовы — нужен слой sync:

1. После `signUp` / `signIn` → загрузить `clients`, `services`, `appointments`, `finance_entries` из Supabase в сторы
2. После каждого `add/update/delete` в сторе → upsert в Supabase
3. На случай offline — очередь операций в AsyncStorage, retry при восстановлении сети

Это отдельная фича, не в текущей версии.

---

## Проблемы

### `Invalid API key` при запуске
→ Проверь что в `.env.local` стоит `anon public` ключ, а не `service_role`. Последний нельзя использовать в клиенте.

### Регистрация не создаёт профиль в `profiles`
→ Триггер `handle_new_user` не сработал. Открой **Database → Functions** → убедись что функция создана. Если нет — запусти SQL из `supabase-schema.sql` ещё раз.

### `Permission denied for table clients`
→ RLS настроены, но у пользователя нет сессии. Проверь что `supabase.auth.getSession()` возвращает сессию перед запросом.

### Supabase RPC `delete_user` не работает
→ Запусти ту часть SQL ещё раз (или всю схему). RPC появилась в последней версии схемы.

---

[← На главную](/)
