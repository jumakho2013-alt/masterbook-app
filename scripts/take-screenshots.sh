#!/usr/bin/env bash
# Снятие App Store скриншотов с загруженного iOS Simulator.
#
# Использование:
#   1. Запусти Metro:                  npx expo start --offline
#   2. Открой Expo Go в симуляторе и загрузи приложение.
#   3. В отдельном терминале:          bash scripts/take-screenshots.sh
#   4. Следуй подсказкам — открывай нужный экран, жми Enter.
#
# Выход: store-screenshots/<device>/<n>-<screen>.png
# Скрипт также выставляет красивый 9:41 / 100% battery на статус-баре,
# и снимает override в конце.

set -euo pipefail

cd "$(dirname "$0")/.."

OUT_ROOT="store-screenshots"
mkdir -p "$OUT_ROOT"

# Список экранов для App Store — порядок важен, именно в таком виде
# они появятся на странице приложения.
declare -a SCREENS=(
  "1-today:Сегодня с forecast карточками и «Сейчас идёт»"
  "2-calendar:Календарь — недельный вид"
  "3-clients:Клиенты — список с тегами"
  "4-finances:Финансы — графики и топ-клиенты"
  "5-security:Безопасность — Face ID и удаление"
)

booted=$(xcrun simctl list devices booted | awk -F '[()]' '/Booted/ {print $2; exit}')
if [[ -z "$booted" ]]; then
  echo "❌ Нет booted симулятора. Запусти нужный через Xcode → Simulator → Device."
  exit 1
fi

# Имя устройства (для subfolder).
current_name=$(xcrun simctl list devices booted | sed -n 's/.*\(iPhone[^()]*\)(.*/\1/p' | head -1 | xargs)
current_name_clean=$(echo "$current_name" | tr ' ' '_' | tr -d '()')

echo "🎬 Снимаю скриншоты на: $current_name ($booted)"
echo ""

# Выставляем красивый статус-бар — Apple всегда использует 9:41 на
# маркетинговых материалах.
echo "⏰ Выставляю статус-бар (9:41, 100% battery, full signal)..."
xcrun simctl status_bar "$booted" override \
  --time "9:41" \
  --batteryState charged \
  --batteryLevel 100 \
  --wifiBars 3 \
  --cellularBars 4 \
  --cellularMode active > /dev/null
echo ""

# При выходе — снимаем override, чтобы симулятор вернулся к обычному состоянию.
cleanup() {
  echo ""
  echo "🧹 Снимаю override статус-бара..."
  xcrun simctl status_bar "$booted" clear > /dev/null 2>&1 || true
}
trap cleanup EXIT

outdir="$OUT_ROOT/$current_name_clean"
mkdir -p "$outdir"

echo "📝 Будет сделано ${#SCREENS[@]} снимков. Открывай нужный экран и жми Enter."
echo ""

for entry in "${SCREENS[@]}"; do
  filename="${entry%%:*}"
  description="${entry##*:}"

  echo -n ">> $filename — $description"
  read -r _
  path="$outdir/${filename}.png"
  xcrun simctl io "$booted" screenshot "$path"
  # Размер — для быстрой проверки что попали в требуемый формат Apple.
  size=$(sips -g pixelWidth -g pixelHeight "$path" 2>/dev/null | tail -2 | awk '{print $2}' | paste -sd '×' -)
  echo "   ✓ $path ($size)"
done

echo ""
echo "✅ Готово. Все скриншоты в $outdir/"
echo ""
echo "Дальше:"
echo "  - Проверь размеры ⟶ должны совпадать с ожидаемыми Apple для этого device size"
echo "  - Загрузи в App Store Connect → Version → Media"
echo "  - Повтори для другого размера (shutdown + boot iPhone 15 Plus, например)"
