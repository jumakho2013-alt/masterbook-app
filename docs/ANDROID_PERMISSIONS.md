---
layout: default
title: Android permissions — обоснования
permalink: /android-permissions/
---

# Android permissions — обоснования для Play Console

Этот файл — справка для заполнения Play Console form'ов (Data Safety,
Sensitive Permissions, Exact Alarms Declaration).

---

## SCHEDULE_EXACT_ALARM (Android 14+, API 34)

### Что это
Разрешение на запланированный `AlarmManager.setExactAndAllowWhileIdle()` — то есть
гарантия что будильник сработает в указанную минуту даже при Doze-режиме.

### Зачем нам
Локальное напоминание мастеру за 1 час до записи клиента. Это явное
user-initiated action: мастер сам создаёт запись, сам задаёт время визита.
Если уведомление сдвинется на 15–30 минут (inexact alarms), мастер либо
опоздает к клиенту, либо предупредит позже разумного — это ломает основной
JTBD приложения.

### Альтернативы (которые мы рассмотрели и отвергли)

| Подход | Почему не подходит |
|---|---|
| `setAndAllowWhileIdle` (inexact) | На Doze может задержаться на 15 мин — для "запись через 1 час" уведомление приходит за 45 мин или 1ч15мин, мастер не доверяет. |
| `USE_EXACT_ALARM` | Apple-style "правильное" разрешение, но Play Policy разрешает только календарным/будильным/часовым приложениям. CRM не подходит. |
| Server push в нужное время | Требует backend job scheduler, online-only, теряет надёжность в России (push-доставка нестабильна без Firebase). Локальный alarm — privacy-first и работает оффлайн. |

### Текст для Play Console "Exact Alarms" declaration

```
MasterBook is a calendar-style CRM for solo service masters. Users create
client appointments with specific start times (e.g. 14:30). The app
schedules a single local reminder one hour before each appointment, so the
master is reminded to prepare or be on-site.

Inexact alarms in Doze mode can drift by 15+ minutes. For a reminder
labeled "appointment in one hour", that drift makes the feature unreliable —
the master either gets the reminder too late (already late to client) or
too early (annoying). Exact alarm scheduling is required so the reminder
fires at the time the user explicitly set when creating the appointment.

The permission is only used by expo-notifications via
SchedulableTriggerInputTypes.DATE for user-created appointment reminders.
We do not use it for marketing, advertising, or any non-user-scheduled
event.
```

---

## POST_NOTIFICATIONS (Android 13+)

Стандартное разрешение для отображения локальных уведомлений. Запрашивается
при первом запуске через `expo-notifications` `requestPermissionsAsync()`.

---

## READ_MEDIA_IMAGES (Android 13+, API 33)

Замена `READ_EXTERNAL_STORAGE`. Нужно чтобы прикрепить фото работы к
записи (через `expo-image-picker`). Заблокированы все остальные media-
permissions через `blockedPermissions`.

### Текст для Play Console (если попросят)

```
Users attach before/after photos of their work to client appointments.
The permission is used solely through expo-image-picker on user tap
"Attach photo". No background photo access. No upload to third-party
servers — photos are stored locally (file://) and optionally synced to
the user's Supabase project (encrypted RLS-scoped row).
```

---

## VIBRATE

Для тактильной обратной связи (`expo-haptics`) и vibration pattern при
notification-канале `reminders`. Не требует декларации.

---

## Что мы НЕ просим (и блокируем явно через `blockedPermissions`)

- `RECORD_AUDIO`
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- `READ_CONTACTS`, `WRITE_CONTACTS`
- `READ_CALENDAR`, `WRITE_CALENDAR`
- `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`

Это явный отказ от любых ad/tracking permission'ов. Полезно упомянуть в
Data Safety form.
