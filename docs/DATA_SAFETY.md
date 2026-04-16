---
layout: default
title: Data Safety answers — MasterBook
permalink: /data-safety/
---

# Data Safety form — готовые ответы

Шпаргалка для заполнения **Google Play Console → App content → Data safety**.
Пройдись по разделам сверху вниз — все ответы ниже.

> **Принцип:** честно, но минимально. Play Console требует декларировать
> всё что собираем, не больше и не меньше. Если добавите аналитику или
> crash-reporter — обновите этот файл и форму.

---

## 1. Data collection and security

### Does your app collect or share any of the required user data types?
**Yes** — мы собираем email и имя для авторизации, бизнес-данные пользователя.

### Is all of the user data collected by your app encrypted in transit?
**Yes** — всё через HTTPS (Supabase, Apple/Google сервисы).

### Do you provide a way for users to request that their data be deleted?
**Yes** — встроенная кнопка «Удалить аккаунт» (Профиль → Безопасность и данные).
URL механизма удаления без входа (требуется Google): укажите email support — мастер обработает вручную за 7 дней.

---

## 2. Data types — что выбираем

### Personal info
- ✅ **Name** — Collected, not shared
  - Purpose: *App functionality* (отображение в профиле)
  - Optional: *Required* (нужно для onboarding)
- ✅ **Email address** — Collected, not shared
  - Purpose: *Account management*, *App functionality*
  - Optional: *Required*
- ❌ User IDs, Address, Phone number, Race/ethnicity, Political or religious beliefs, Sexual orientation, Other info — **НЕ собираем**

### Financial info
- ❌ User payment info, Purchase history, Credit score, Other — **НЕ собираем**
  (Доходы и расходы мастера хранятся только у него, мы их не анализируем и не передаём.)

### Health and fitness
- ❌ — **НЕ собираем**

### Messages
- ❌ — **НЕ собираем**. Заметки о клиентах — это данные самого мастера о его клиентах, не сообщения между пользователями.

### Photos and videos
- ✅ **Photos** — Collected, not shared
  - Purpose: *App functionality* (фото работ прикреплённые к записям)
  - Optional: *Optional*
  - **Ephemeral:** ✅ **Да, данные обрабатываются временно** — фото хранятся только локально на устройстве пользователя как URI, на сервер не отправляются.
  - *Если/когда добавите облачную синхронизацию фото — смените ephemeral на false и укажите что фото попадают в Supabase Storage.*
- ❌ Videos — **НЕ собираем**

### Audio files
- ❌ — **НЕ собираем**

### Files and docs
- ❌ — **НЕ собираем**

### Calendar
- ❌ — **НЕ собираем** (собственный календарь в приложении, без интеграции с системным)

### Contacts
- ❌ — **НЕ собираем**

### App activity
- ❌ App interactions, In-app search history, Installed apps, Other user-generated content — **НЕ собираем**
- ❌ Other actions — **НЕ собираем**
  *Важно: если подключим аналитику (Sentry, PostHog, Firebase) — включить эту категорию.*

### Web browsing
- ❌ — **НЕ собираем**

### App info and performance
- ❌ Crash logs, Diagnostics, Other — **НЕ собираем**
  *Важно: если подключим Sentry — добавить Crash logs + Diagnostics.*

### Device or other IDs
- ❌ — **НЕ собираем**
  *expo-device читает модель устройства, но никуда не шлёт — это чтение без сбора.*

---

## 3. Data usage and handling

Для каждого собираемого типа данных (Name, Email, Photos):

### Data is collected for which purposes?
- **Name, Email:** App functionality + Account management
- **Photos:** App functionality (только)

### Is this data shared with third parties?
**No** — ни один тип данных мы не передаём третьим сторонам для их собственных целей.

(Supabase обрабатывает данные как наш процессор по контракту — это НЕ считается sharing в терминах Play Console.)

### Is this data collection optional for users?
- **Name:** Required (нужно при регистрации)
- **Email:** Required (нужно для входа)
- **Photos:** Optional (пользователь сам решает прикреплять или нет)

### Is this data processed ephemerally?
- **Name:** No — сохраняется в профиле
- **Email:** No — сохраняется в Auth базе Supabase
- **Photos:** **Yes** — только на устройстве, не на сервере

---

## 4. Security practices

### Is your data encrypted in transit?
**Yes**

### Do you follow Google Play's Families Policy?
**Not applicable** — приложение для взрослых пользователей (18+).

### Has your app been independently validated against a global security standard?
**No** *(не проходили аудит на SOC 2 / ISO 27001 и т.д.)*

---

## 5. Что показывать пользователю в итоговой карточке

После заполнения Play Console создаст этот summary:

> **Данные этого приложения**
> - Собираемые: Имя, Email, Фото
> - Передача третьим лицам: нет
> - Шифрование в сети: да
> - Можно запросить удаление данных: да (в приложении)

Соответствует реальности. Если что-то из этого перестанет быть правдой — обновить форму в течение 14 дней (требование Play).

---

## Как обновлять

Когда добавите новую функцию, затрагивающую данные (аналитика, cloud photos, сторонний login), вернитесь сюда:

1. Обновите этот файл с новыми типами данных
2. Обновите PRIVACY_POLICY.md и docs/privacy.md с тем же текстом
3. В Play Console → Data safety → Edit и отразите изменения
4. Версионируйте в приложении — если изменения материальные, покажите пользователю при следующем запуске «Обновлена политика конфиденциальности» с кнопкой «Ознакомиться»

---

[← На главную](/)
