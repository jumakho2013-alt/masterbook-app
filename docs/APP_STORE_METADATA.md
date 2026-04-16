---
layout: default
title: App Store Connect metadata — MasterBook
permalink: /app-store-metadata/
---

# App Store Connect — готовая метадата

Копируй блоки ниже при заполнении App Store Connect → **App Information** и **Version Information**.

---

## App Information

### Primary language
**Russian**

### Bundle ID
`com.masterbook.app`

### SKU
`masterbook-ios-2026`

### Primary category
**Business**

### Secondary category
**Productivity**

### Content Rights
☑️ Does not contain, show, or access third-party content

### Age Rating
- **4+** (no restricted content)
- Complete ESRB / PEGI questionnaire: все «None»

---

## Pricing and Availability

- **Price:** Free *(если решишь делать PRO через IAP, настрой отдельно In-App Purchases)*
- **Availability:** All countries or select по рынкам
- **App distribution methods:** Public on the App Store

---

## Version Information (per language)

### Russian (основной язык)

**Name (30 chars max):**
```
MasterBook — CRM для мастеров
```

**Subtitle (30 chars max):**
```
Записи, клиенты, финансы
```

**Promotional text (170 chars max, можно менять без ревью):**
```
Веди клиентскую базу, планируй записи и следи за доходами в одном приложении. Face ID защита, экспорт данных, тёмная тема.
```

**Description (4000 chars max):**
```
MasterBook — CRM-приложение для частных мастеров. Маникюр, парикмахерская, репетиторство, фотография, ремонт — если работаешь с клиентами, это приложение держит всё под рукой.

ВОЗМОЖНОСТИ

• Календарь записей — добавляй визиты за пару тапов, смотри загрузку на неделю вперёд
• Локальные напоминания — за час до визита получишь уведомление, никого не пропустишь
• База клиентов — имена, телефоны, заметки, теги (VIP, новый, проблемный)
• Финансовая статистика — доход по дням, неделям, месяцам, топ-клиенты и услуги
• Мои услуги — названия, длительность, цены, цвета для календаря
• Рабочее время и перерывы — приложение не даст записать клиента вне твоего графика

БЕЗОПАСНОСТЬ

• Face ID / Touch ID защита — никто не увидит твоих клиентов открыв твой iPhone
• Экспорт данных в JSON — данные всегда с тобой, а не только в нашем облаке
• Удаление аккаунта одной кнопкой — прозрачно и необратимо
• Шифрование в сети (HTTPS) и Row-Level Security в базе

ДИЗАЙН

• Liquid Glass — живой интерфейс в духе iOS
• Тёмная и светлая темы, следит за системной
• Русский язык

Работает полностью офлайн. Синхронизация между устройствами — в следующих обновлениях.

БЕСПЛАТНАЯ ВЕРСИЯ
До 20 клиентов.

PRO (в разработке)
Безлимит клиентов, экспорт в PDF, онлайн-запись, финансовые отчёты.

ПОДДЕРЖКА
support@masterbook.app
```

**Keywords (100 chars max, разделены запятой без пробелов):**
```
CRM,мастер,записи,клиенты,календарь,маникюр,парикмахер,репетитор,финансы,бьюти,салон,график
```

**Support URL:**
```
https://USERNAME.github.io/masterbook/support/
```

**Marketing URL (optional):**
```
https://USERNAME.github.io/masterbook/
```

**Privacy Policy URL (REQUIRED):**
```
https://USERNAME.github.io/masterbook/privacy/
```

---

### English (secondary, опционально)

**Name:**
```
MasterBook — CRM for masters
```

**Subtitle:**
```
Bookings, clients, finances
```

**Promotional text:**
```
Manage your clients, schedule appointments, track income — all in one app. Face ID lock, data export, dark mode.
```

**Description (short version for initial launch):**
```
MasterBook is a CRM for private masters — nail techs, hairdressers, tutors, photographers, repairers, anyone who works with clients one-on-one.

FEATURES
• Appointment calendar with local reminders
• Client database with tags (VIP, new, problematic)
• Financial statistics — daily, weekly, monthly income
• Services with custom prices, durations, colors
• Work hours & breaks configuration

SECURITY
• Face ID / Touch ID lock
• Export your data as JSON, anytime
• One-tap account deletion
• HTTPS encryption + Row-Level Security

DESIGN
• Liquid Glass UI
• Light & dark themes
• Russian and English

Works fully offline. Cross-device sync coming in next updates.

FREE tier: up to 20 clients.

Contact: support@masterbook.app
```

**Keywords:**
```
CRM,appointments,clients,calendar,beauty,salon,nail,tutor,freelance,booking,schedule,income
```

---

## App Review Information

**Sign-in required:** ☑️ Yes

**Demo account для ревьюера (создай в Supabase и впиши сюда):**
```
Email: reviewer@masterbook.app
Password: <придумай и сохрани в 1Password>
```

**Notes for reviewer:**
```
Привет,

MasterBook — CRM для частных мастеров. Всё тестируется с demo-аккаунтом выше.

Функции которые хорошо показать:
1. Логин с demo-аккаунтом → главный экран «Сегодня» с записями
2. Профиль → Безопасность и данные → Удалить аккаунт (Guideline 5.1.1(v), работает)
3. Профиль → Безопасность и данные → Экспорт данных (JSON в Share sheet)
4. Профиль → Тема → переключение

Apple Sign-In доступен на экране логина как альтернативный метод.

Спасибо!
```

**Contact information:**
- First name, last name — твои
- Phone number — твой
- Email — support@masterbook.app

---

## Screenshots (нужны для каждого языка)

### Требуемые размеры iOS

| Display | Required | Simulator device |
|---|---|---|
| 6.9" iPhone | ✅ (обязательно) | iPhone 17 Pro Max |
| 6.5" iPhone | ✅ (обязательно) | iPhone 15 Plus |
| 6.1" iPhone | Optional | iPhone 17 / 17 Pro |
| 5.5" iPhone | ❌ (deprecated) | - |
| iPad 12.9" | Только если поддерживаешь iPad | - |

У нас `supportsTablet: false` → iPad не нужен.

### Рекомендуемый набор (5 скриншотов):

1. **Сегодня** — главный экран с forecast-карточками и «Сейчас идёт»
2. **Календарь** — недельный вид с точками записей
3. **Клиенты** — список с тегами и поиском
4. **Финансы** — графики и топ-клиенты
5. **Безопасность** — Face ID переключатель и удаление

### Как снять в Simulator

1. В симуляторе открой нужный экран приложения.
2. **Cmd+S** → PNG сохраняется на рабочий стол.
3. Проверь размер PNG — должен быть 1290×2796 (6.9") или 1242×2688 (6.5").
4. Если симулятор не того размера — **Device → iOS 26 → iPhone 17 Pro Max** → `xcrun simctl boot "iPhone 17 Pro Max"` → запусти Expo Go там.

Скрипт-хелпер: см. `docs/SCREENSHOTS.md`.

---

## What's new in this version

### Version 1.0.0 (первый релиз)
```
Первая версия MasterBook!

• Календарь записей
• База клиентов
• Финансовая статистика
• Face ID / Touch ID защита
• Экспорт данных
• Удаление аккаунта
• Liquid Glass дизайн
• Тёмная тема

Приятной работы!
```

---

## Promotional assets (Apple позже попросит для «New Apps We Love»)

- **App icon** 1024×1024 PNG без прозрачности и закруглений (iOS добавит сам)
- **App preview video** 15-30 сек (optional, повышает конверсию на +30%)

---

## После публикации

Когда приложение одобрено:
1. Обнови `docs/index.md` → раскомментируй реальные ссылки на App Store
2. Добавь App Store badge на лендинг
3. Мониторь **App Store Connect → Sales & Trends** и **Ratings & Reviews**

---

[← На главную](/)
