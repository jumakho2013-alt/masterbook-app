// Цены в каталоге — в сомони (TJ-first). Неразрывный пробел, чтобы число не
// отрывалось от валюты при переносе.
const NBSP = ' ';

export function formatPrice(n: number): string {
  const s = Math.round(n).toLocaleString('ru-RU').replace(/\s/g, NBSP);
  return `${s}${NBSP}сомони`;
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
