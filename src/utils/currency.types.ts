// Тип валюты вынесен отдельно от currency.ts чтобы избежать circular
// dependency: currency.ts импортирует useSettingsStore (для дефолта),
// а useSettingsStore хранит currency: CurrencyCode. Этот файл — общая
// зависимость без побочных импортов.

export const CURRENCY_CODES = ['RUB', 'KZT', 'UAH', 'BYN', 'USD', 'EUR', 'GEL', 'TRY'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = 'RUB';
