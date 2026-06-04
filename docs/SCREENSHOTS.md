---
layout: default
title: Screenshots guide — MasterBook
permalink: /screenshots-guide/
---

# Скриншоты для App Store / Google Play

**Цель:** 5 качественных скриншотов на два размера устройств (6.9" + 6.5").
**Время:** ~15 минут если всё подготовлено.

---

## Что нужно

- ✅ Booted iOS Simulator с приложением MasterBook (через Expo Go)
- ✅ Demo-данные в приложении (флаг `EXPO_PUBLIC_DEV_PREVIEW=1`)
- ✅ Светлая тема (по умолчанию лучше читается на картинках в Store)

## 5 экранов для скриншотов

1. **«Сегодня»** — открывается сразу. Показывает forecast-карточки и «Сейчас идёт»
2. **«Календарь»** — таб Календарь. Недельный вид с точками записей
3. **«Клиенты»** — таб Клиенты. Список с тегами (VIP / Новый)
4. **«Финансы»** — таб Финансы. Графики и топ-клиенты
5. **«Безопасность и данные»** — Профиль → Безопасность и данные. Face ID switch + delete account

---

## Способ 1 — автоматический скрипт (рекомендуется)

```bash
# Запусти Metro
npx expo start --offline

# В отдельном терминале:
bash scripts/take-screenshots.sh
```

Скрипт:
1. Определит какой симулятор booted
2. Попросит открыть каждый из 5 экранов по очереди
3. Сохранит PNG в `store-screenshots/<device>/<n>-<name>.png`

Повтори для другого размера:
```bash
# Shutdown текущий, boot другой
xcrun simctl shutdown booted
xcrun simctl boot "iPhone 15 Plus"
open -a Simulator
# Подожди пока загрузится, открой Expo Go, подгрузи приложение
# Снова запусти скрипт
bash scripts/take-screenshots.sh
```

---

## Способ 2 — руками (Cmd+S в симуляторе)

Если скрипт не нравится:

1. В симуляторе открой нужный экран
2. **Cmd+S** (внутри Simulator app) → PNG сохранится на Desktop
3. Переименуй в `1-today.png`, `2-calendar.png`, и т.д.
4. Перемести в `store-screenshots/<device>/`

---

## Требуемые размеры Apple (на 2026-04)

| Simulator device | Resolution (points × pixels) | App Store категория |
|---|---|---|
| iPhone 17 Pro Max | 430×932 @3x = **1290×2796** | 6.9" iPhone (обязательно) |
| iPhone 15 Plus | 430×932 @3x = **1290×2796** | 6.5" iPhone (обязательно) |
| iPhone 17 / 17 Pro | 393×852 @3x = **1179×2556** | 6.1" iPhone (optional) |

**Важно:** Apple требует hash-match по размеру. Скриншот с iPhone 17 Pro не пройдёт проверку в 6.9" слоте — нужен именно 17 Pro Max.

## Требуемые размеры Google (на 2026-04)

Play Console принимает **любые** скриншоты 16:9 / 9:16 от 320×320 до 3840×3840 px.
Уже готовые iOS скриншоты (1290×2796) подойдут → Play примет их как «phone» screenshots.

---

## Советы по качеству

- **Светлая тема** — в Store живее читается
- **Русский язык интерфейса** — если целишься в RU-рынок
- **Заполненные данные** — демо-сид уже даёт 6 клиентов, 4 услуги, 5 записей
- **Без статус-бара проблем** — убедись что заряд 100%, сеть есть, время красивое (например 09:41 — Apple традиционно использует это время)
- **Dynamic Island не закрывает важное** — у iPhone 17 Pro Max острова нет если не в режиме активности

### Установить красивое время в симуляторе (09:41)

Apple сами показывают 09:41 на всех маркетинговых материалах.

```bash
# Для текущего booted симулятора:
xcrun simctl status_bar booted override \
  --time "9:41" \
  --batteryState charged \
  --batteryLevel 100 \
  --wifiBars 3 \
  --cellularBars 4 \
  --cellularMode active

# Снять override:
xcrun simctl status_bar booted clear
```

Добавил в скрипт уже. Запусти до снятия скриншотов.

---

## После снятия

1. **Проверь размеры:**
   ```bash
   for f in store-screenshots/**/*.png; do
     echo "$f: $(sips -g pixelWidth -g pixelHeight "$f" | tail -2 | tr -d ' ')"
   done
   ```
2. Залей в App Store Connect:
   - **My Apps → MasterBook → App Information → iOS App → 1.0 Prepare for Submission**
   - **iPhone 6.9" Display** → drag-drop все 5 PNG
   - **iPhone 6.5" Display** → повтори
3. Для Google Play Console:
   - **Main store listing → Phone screenshots** → drag-drop

---

## FAQ

### Скриншот получился 2580×5592 вместо 1290×2796
Retina display + Cmd+S может удвоить размер. Сделай `sips -Z 2796` чтобы уменьшить по высоте сохраняя aspect.

### Нужны video previews?
Optional, но повышают конверсию. Запиши через QuickTime → File → New Movie Recording → выбери симулятор как источник. 15-30 сек, показывай живой flow.

### Не могу получить 6.9" симулятор
Требуется iOS 18+ runtime. **Xcode → Settings → Components → iOS 18.x → Get**. После → **Xcode → Devices → + → iPhone 17 Pro Max**.

---

[← На главную](/)
