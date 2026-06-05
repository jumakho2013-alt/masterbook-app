import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { type CurrencyCode, DEFAULT_CURRENCY } from '@/src/utils/currency.types';

export { type CurrencyCode, DEFAULT_CURRENCY } from '@/src/utils/currency.types';

/** Поддерживаемые валюты — оптимизировано под СНГ + базовые западные.
 *  Порядок осознанный: первая в списке — default для нового аккаунта в СНГ. */
export const SUPPORTED_CURRENCIES: ReadonlyArray<{
  code: CurrencyCode;
  locale: string;
  symbol: string;
  name: string;
}> = [
  { code: 'RUB', locale: 'ru-RU', symbol: '₽', name: 'Российский рубль' },
  { code: 'KZT', locale: 'kk-KZ', symbol: '₸', name: 'Тенге' },
  { code: 'UAH', locale: 'uk-UA', symbol: '₴', name: 'Гривна' },
  { code: 'BYN', locale: 'be-BY', symbol: 'Br', name: 'Белорусский рубль' },
  { code: 'USD', locale: 'en-US', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', locale: 'en-IE', symbol: '€', name: 'Euro' },
  { code: 'GEL', locale: 'ka-GE', symbol: '₾', name: 'Лари' },
  { code: 'TRY', locale: 'tr-TR', symbol: '₺', name: 'Турецкая лира' },
];

// Intl.NumberFormat дорогой к созданию (~5 мс на iOS Hermes); кэшируем
// per currency-code. В течение сессии не растёт больше чем число
// поддерживаемых валют.
const formatterCache = new Map<CurrencyCode, Intl.NumberFormat>();

function getFormatter(currency: CurrencyCode): Intl.NumberFormat {
  const cached = formatterCache.get(currency);
  if (cached) return cached;
  const meta = SUPPORTED_CURRENCIES.find((c) => c.code === currency) ?? SUPPORTED_CURRENCIES[0];
  const fmt = new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: meta.code,
    maximumFractionDigits: 0,
  });
  formatterCache.set(currency, fmt);
  return fmt;
}

function getCurrencyMeta(currency: CurrencyCode) {
  return SUPPORTED_CURRENCIES.find((c) => c.code === currency) ?? SUPPORTED_CURRENCIES[0];
}

/** Резолюция валюты:
 *  1. Явный аргумент (используется в тестах / при экспорте PDF за прошлый период).
 *  2. Настройка пользователя из useSettingsStore.
 *  3. DEFAULT_CURRENCY ('RUB') — для очень ранних рендеров до гидратации store.
 *
 *  Доступ через getState() безопасен из не-React контекста и не подписывает
 *  компонент на ререндер. Если в будущем нужно реактивно обновлять формат
 *  на смене валюты — компоненты сами подпишутся на useSettingsStore. */
function resolveCurrency(currency?: CurrencyCode): CurrencyCode {
  if (currency) return currency;
  return useSettingsStore.getState().currency ?? DEFAULT_CURRENCY;
}

// Atelier (хэндофф, шаг 3): все пробелы в сумме — НЕРАЗРЫВНЫЕ ( ). Иначе
// «14 800 ₽» переносится по строкам. \s в Intl-выводе ru-RU — это обычный или
// узкий пробел; нормализуем в U+00A0, чтобы число и символ держались вместе.
const NBSP = String.fromCharCode(0xA0); // U+00A0 неразрывный пробел

export function formatCurrency(amount: number, currency?: CurrencyCode): string {
  return getFormatter(resolveCurrency(currency)).format(amount).replace(/\s/g, NBSP);
}

export function formatCurrencyShort(amount: number, currency?: CurrencyCode): string {
  const c = resolveCurrency(currency);
  const meta = getCurrencyMeta(c);
  // Позиция символа: в постсоветских + турецкой/грузинской — после числа
  // через неразрывный пробел, в долларе/евро — перед без пробела.
  const isPostfix = c === 'RUB' || c === 'KZT' || c === 'UAH' || c === 'BYN' || c === 'GEL' || c === 'TRY';
  const fmt = (n: string) => (isPostfix ? `${n}${NBSP}${meta.symbol}` : `${meta.symbol}${n}`);

  if (amount >= 1_000_000) {
    return fmt(`${(amount / 1_000_000).toFixed(1)}M`);
  }
  if (amount >= 10_000) {
    return fmt(`${Math.round(amount / 1_000)}K`);
  }
  return fmt(amount.toLocaleString(meta.locale).replace(/\s/g, NBSP));
}
