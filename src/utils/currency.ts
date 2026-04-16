// Валюта — USD. Универсальная, понятна во всех регионах без локализации.
// Если в будущем потребуется мультивалютность — параметр currency прокинуть
// из настроек пользователя.
const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return usdFormatter.format(amount);
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 10_000) {
    return `$${Math.round(amount / 1_000)}K`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}
