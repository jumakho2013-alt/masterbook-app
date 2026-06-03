import { formatCurrency, formatCurrencyShort } from '../currency';

// Тесты передают валюту явно, чтобы не зависеть от store-state (под jest
// useSettingsStore.getState() работает, но дефолт может меняться).

describe('formatCurrency (USD explicit)', () => {
  it('renders whole dollars without decimals', () => {
    expect(formatCurrency(0, 'USD')).toMatch(/\$0/);
    expect(formatCurrency(2500, 'USD')).toMatch(/\$2,500/);
    expect(formatCurrency(1500000, 'USD')).toMatch(/\$1,500,000/);
  });

  it('rounds fractional input (maximumFractionDigits: 0)', () => {
    expect(formatCurrency(9.4, 'USD')).toMatch(/\$9/);
    expect(formatCurrency(9.6, 'USD')).toMatch(/\$10/);
  });
});

describe('formatCurrencyShort (USD explicit)', () => {
  it('compacts millions', () => {
    expect(formatCurrencyShort(2_400_000, 'USD')).toBe('$2.4M');
    expect(formatCurrencyShort(1_000_000, 'USD')).toBe('$1.0M');
  });
  it('compacts thousands above 10k', () => {
    expect(formatCurrencyShort(12_500, 'USD')).toBe('$13K');
    expect(formatCurrencyShort(10_000, 'USD')).toBe('$10K');
  });
  it('keeps small numbers verbose', () => {
    expect(formatCurrencyShort(9_999, 'USD')).toBe('$9,999');
    expect(formatCurrencyShort(500, 'USD')).toBe('$500');
  });
});

describe('formatCurrency (RUB — default for CIS)', () => {
  it('renders rouble symbol as postfix per ru-RU locale', () => {
    // Intl.NumberFormat 'ru-RU' использует U+00A0 (NBSP) между числом
    // и знаком валюты. Регекс с \s покрывает оба варианта.
    expect(formatCurrency(2500, 'RUB')).toMatch(/2.500.+₽/);
    expect(formatCurrency(0, 'RUB')).toMatch(/0.+₽/);
  });
});

describe('formatCurrencyShort — postfix symbols for postsoviet/turkish/georgian', () => {
  it('rouble after number', () => {
    expect(formatCurrencyShort(12_500, 'RUB')).toBe('13K ₽');
  });
  it('tenge after number', () => {
    expect(formatCurrencyShort(2_400_000, 'KZT')).toBe('2.4M ₸');
  });
  it('hryvnia after number', () => {
    expect(formatCurrencyShort(50_000, 'UAH')).toBe('50K ₴');
  });
  it('lari after number', () => {
    expect(formatCurrencyShort(15_000, 'GEL')).toBe('15K ₾');
  });
  it('lira after number', () => {
    expect(formatCurrencyShort(15_000, 'TRY')).toBe('15K ₺');
  });
});

describe('formatCurrencyShort — Euro keeps symbol prefix', () => {
  it('Euro before number', () => {
    expect(formatCurrencyShort(15_000, 'EUR')).toBe('€15K');
  });
});
