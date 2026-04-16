---
layout: default
title: Политика конфиденциальности — MasterBook
permalink: /privacy/
---

# Privacy Policy / Политика конфиденциальности

**Last updated: April 16, 2026**
**Последнее обновление: 16 апреля 2026**

[English](#english) · [Русский](#русский)

---

## English

### Introduction

MasterBook ("we", "our", or "the app") is a CRM application for private masters (beauty professionals, tutors, photographers, repair specialists, and others). This Privacy Policy explains how we collect, use, and protect your information.

### Information We Collect

**Account Information:**
- Email address (for authentication)
- Password (encrypted by Supabase — we never see it)
- Your name
- Your profession and specialization

**Business Data (stored on your device and optionally in the cloud):**
- Client information you add manually (name, phone, notes, preferences)
- Appointment records
- Service list and prices
- Financial records (income and expenses)
- Photos you attach to appointments — stored as device-local file URIs

**Technical Data:**
- Local notification identifiers (for appointment reminders on your device)
- Device type (iOS / Android) and app version for compatibility

**We do NOT collect:**
- Location
- Contacts, calendar, or other apps' data
- Advertising identifiers
- Analytics or tracking data
- Crash reports containing personal information

### How We Use Your Information

- **Authentication** — to let you log in and access your account
- **App functionality** — to show your clients, appointments, and finances
- **Local notifications** — to remind you about upcoming appointments (scheduled on your device, no server involved)

### Data Storage

Your data is stored in two places:
1. **On your device** — for offline access (AsyncStorage, encrypted by the OS)
2. **In Supabase cloud** (optional, only if you have an account) — for backup and cross-device sync

We use industry-standard encryption (HTTPS) for all network traffic and Row Level Security (RLS) on the database — each user can only access their own rows.

### What We DON'T Do

- We do NOT sell your data to third parties
- We do NOT share your client information with anyone
- We do NOT use your data for advertising
- We do NOT track you across apps or websites

### Third-Party Services

- **Supabase** — database and authentication ([privacy policy](https://supabase.com/privacy))
- **Expo / EAS** — app build and distribution infrastructure ([privacy policy](https://expo.dev/privacy))
- **Apple Sign-In** (optional on iOS) — provides identity token without sharing email if you choose "Hide my email"

### Your Rights

You have the right to:
- **Access** your data — visible inside the app
- **Export** your data — Profile → Security & Data → Export data (JSON file)
- **Delete** your account and all associated data — Profile → Security & Data → Delete account (this deletes everything from both your device and our servers, cannot be undone)
- **Withdraw consent** at any time — by deleting your account

### Children's Privacy

MasterBook is intended for users 18 years and older. We do not knowingly collect data from children.

### Changes to This Policy

We may update this policy. Changes will be posted on this page with an updated "Last updated" date. Material changes will be reflected in the app on the next launch.

### Contact Us

If you have questions about this Privacy Policy, contact us:
**Email:** support@masterbook.app

---

## Русский

### Введение

MasterBook («мы», «наш», «приложение») — это CRM-приложение для частных мастеров (бьюти-специалистов, репетиторов, фотографов, мастеров по ремонту и других). Эта Политика конфиденциальности объясняет, как мы собираем, используем и защищаем вашу информацию.

### Какую информацию мы собираем

**Данные аккаунта:**
- Email (для входа)
- Пароль (зашифрован в Supabase — мы его не видим)
- Ваше имя
- Профессия и специализация

**Бизнес-данные (хранятся на устройстве и опционально в облаке):**
- Информация о клиентах, которую вы добавляете вручную (имя, телефон, заметки, предпочтения)
- Записи на визиты
- Список услуг и цен
- Финансовые данные (доходы и расходы)
- Фото, прикреплённые к записям — хранятся как локальные URI на устройстве

**Технические данные:**
- Идентификаторы локальных уведомлений (для напоминаний на вашем же устройстве)
- Тип устройства (iOS / Android) и версия приложения для совместимости

**Мы НЕ собираем:**
- Геолокацию
- Контакты, календарь, данные других приложений
- Рекламные идентификаторы
- Трекинг и аналитику
- Crash-репорты с персональными данными

### Как мы используем информацию

- **Авторизация** — чтобы вы могли входить в аккаунт
- **Функциональность приложения** — показывать ваших клиентов, записи, финансы
- **Локальные уведомления** — напоминать о предстоящих записях (планируются прямо на устройстве, сервер не участвует)

### Хранение данных

Ваши данные хранятся в двух местах:
1. **На устройстве** — для офлайн-доступа (AsyncStorage, шифруется операционной системой)
2. **В облаке Supabase** (опционально, только при наличии аккаунта) — для бэкапа и синхронизации

Весь сетевой трафик шифруется (HTTPS). В базе включён Row Level Security (RLS) — каждый пользователь имеет доступ только к своим строкам.

### Что мы НЕ делаем

- НЕ продаём ваши данные третьим лицам
- НЕ делимся информацией о клиентах ни с кем
- НЕ используем ваши данные для рекламы
- НЕ трекаем вас между приложениями и сайтами

### Сторонние сервисы

- **Supabase** — база данных и авторизация ([политика](https://supabase.com/privacy))
- **Expo / EAS** — инфраструктура сборки и распространения ([политика](https://expo.dev/privacy))
- **Apple Sign-In** (опционально на iOS) — даёт identity token без раскрытия email если вы выбрали «Скрыть мой email»

### Ваши права

Вы имеете право:
- **Доступ** к своим данным — всё видно в приложении
- **Экспорт** данных — Профиль → Безопасность и данные → Экспорт данных (JSON-файл)
- **Удаление** аккаунта и всех связанных данных — Профиль → Безопасность и данные → Удалить аккаунт (стирает всё и с устройства, и с сервера, отменить нельзя)
- **Отзыв согласия** в любое время — через удаление аккаунта

### Конфиденциальность детей

MasterBook предназначен для пользователей 18+ лет. Мы не собираем данные от детей сознательно.

### Изменения в политике

Мы можем обновлять эту политику. Изменения будут опубликованы на этой странице с обновлённой датой. Существенные изменения появятся в приложении при следующем запуске.

### Связаться с нами

Если у вас есть вопросы:
**Email:** support@masterbook.app
