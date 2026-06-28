// Цены в каталоге — в сомони (TJ-first). Неразрывный пробел, чтобы число не
// отрывалось от валюты при переносе.
const NBSP = ' ';

// Валюты мастеров (СНГ + базовые западные) — символ и позиция. Должно совпадать
// с приложением (src/utils/currency.ts). Дефолт — сомони (рынок запуска).
const CURRENCIES: Record<string, { symbol: string; prefix?: boolean }> = {
  TJS: { symbol: 'сом.' },
  RUB: { symbol: '₽' },
  KZT: { symbol: '₸' },
  UAH: { symbol: '₴' },
  BYN: { symbol: 'Br' },
  GEL: { symbol: '₾' },
  TRY: { symbol: '₺' },
  USD: { symbol: '$', prefix: true },
  EUR: { symbol: '€', prefix: true },
};

export function formatPrice(n: number, currency?: string | null): string {
  const s = Math.round(n).toLocaleString('ru-RU').replace(/\s/g, NBSP);
  const cur = CURRENCIES[(currency ?? 'TJS').toUpperCase()] ?? CURRENCIES.TJS;
  return cur.prefix ? `${cur.symbol}${s}` : `${s}${NBSP}${cur.symbol}`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** wa.me ссылка из произвольно записанного телефона (оставляем только цифры). */
export function whatsappLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${q}`;
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/** Русское склонение по числу: pluralRu(n, 'мастер', 'мастера', 'мастеров'). */
export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export const mastersWord = (n: number) => pluralRu(n, 'мастер', 'мастера', 'мастеров');
export const reviewsWord = (n: number) => pluralRu(n, 'отзыв', 'отзыва', 'отзывов');
