import { formatCurrency, formatCurrencyShort } from '../currency';

describe('formatCurrency', () => {
  it('renders whole dollars without decimals', () => {
    expect(formatCurrency(0)).toMatch(/\$0/);
    expect(formatCurrency(2500)).toMatch(/\$2,500/);
    expect(formatCurrency(1500000)).toMatch(/\$1,500,000/);
  });

  it('rounds fractional input (maximumFractionDigits: 0)', () => {
    expect(formatCurrency(9.4)).toMatch(/\$9/);
    expect(formatCurrency(9.6)).toMatch(/\$10/);
  });
});

describe('formatCurrencyShort', () => {
  it('compacts millions', () => {
    expect(formatCurrencyShort(2_400_000)).toBe('$2.4M');
    expect(formatCurrencyShort(1_000_000)).toBe('$1.0M');
  });
  it('compacts thousands above 10k', () => {
    expect(formatCurrencyShort(12_500)).toBe('$13K');
    expect(formatCurrencyShort(10_000)).toBe('$10K');
  });
  it('keeps small numbers verbose', () => {
    expect(formatCurrencyShort(9_999)).toBe('$9,999');
    expect(formatCurrencyShort(500)).toBe('$500');
  });
});
