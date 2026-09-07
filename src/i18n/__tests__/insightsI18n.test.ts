/**
 * Регрессия на локализацию экрана «Аналитика».
 *
 * До этого весь экран был захардкожен по-русски — англоязычный мастер видел
 * русский текст. Тест держит три вещи разом:
 *   1) ключи insights.* существуют в обеих локалях и реально переводятся;
 *   2) русские формы множественного числа (1 визит / 2 визита / 5 визитов);
 *   3) регистрация плюрализатора не сломала обычные строки с %{count}.
 */

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'ru' }] }));

import { applyLanguage, t } from '@/src/i18n';
import { getWeekdayName } from '@/src/utils/date';

describe('локализация экрана аналитики', () => {
  it('переводит все ключи экрана на оба языка (нет missing translation)', () => {
    const keys = [
      'insights.title',
      'insights.empty',
      'insights.revenueMonth',
      'insights.newClients',
      'insights.visitsDone',
      'insights.avgCheck',
      'insights.sleeping',
      'insights.topServices',
    ];
    for (const lang of ['ru', 'en'] as const) {
      applyLanguage(lang);
      for (const key of keys) {
        const value = t(key);
        expect(value).not.toMatch(/missing/i);
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('русский и английский заголовки различаются (значит en реально применяется)', () => {
    applyLanguage('ru');
    const ruTitle = t('insights.title');
    applyLanguage('en');
    expect(t('insights.title')).not.toBe(ruTitle);
  });

  it('подставляет параметры в строки с плейсхолдерами', () => {
    applyLanguage('ru');
    expect(t('insights.deltaVsLastMonth', { pct: '+12' })).toBe('+12% к прошлому месяцу');
    expect(t('insights.bestDay', { day: 'Пятница' })).toContain('Пятница');
    expect(t('insights.bestDayRevenue', { amount: '500 c.' })).toContain('500 c.');
  });

  it('склоняет визиты по русским правилам', () => {
    applyLanguage('ru');
    const форма = (n: number) => t('insights.visits', { count: n });
    expect(форма(1)).toBe('1 визит');
    expect(форма(2)).toBe('2 визита');
    expect(форма(4)).toBe('4 визита');
    expect(форма(5)).toBe('5 визитов');
    expect(форма(0)).toBe('0 визитов');
    // Ловушки второго десятка: 11–14 всегда «визитов», несмотря на 1/2/3/4 в конце.
    expect(форма(11)).toBe('11 визитов');
    expect(форма(12)).toBe('12 визитов');
    expect(форма(14)).toBe('14 визитов');
    expect(форма(21)).toBe('21 визит');
    expect(форма(22)).toBe('22 визита');
    expect(форма(25)).toBe('25 визитов');
    expect(форма(101)).toBe('101 визит');
    expect(форма(111)).toBe('111 визитов');
  });

  it('английские формы — простые one/other', () => {
    applyLanguage('en');
    expect(t('insights.visits', { count: 1 })).toBe('1 visit');
    expect(t('insights.visits', { count: 2 })).toBe('2 visits');
    expect(t('insights.visits', { count: 0 })).toBe('0 visits');
  });

  it('плюрализатор не трогает обычные строки с %{count}', () => {
    // Эти ключи — плоские строки, а не объекты форм. Регистрация русского
    // плюрализатора не должна была превратить их в «missing translation».
    applyLanguage('ru');
    expect(t('clients.totalCount', { count: 5 })).toBe('5 всего');
    expect(t('clients.daysShort', { count: 3 })).toBe('3 дн.');
    applyLanguage('en');
    expect(t('clients.totalCount', { count: 5 })).toBe('5 total');
  });

  it('название дня недели следует за языком', () => {
    applyLanguage('ru');
    expect(getWeekdayName(0)).toBe('воскресенье');
    expect(getWeekdayName(1)).toBe('понедельник');
    expect(getWeekdayName(6)).toBe('суббота');
    applyLanguage('en');
    expect(getWeekdayName(0)).toBe('Sunday');
    expect(getWeekdayName(1)).toBe('Monday');
    expect(getWeekdayName(6)).toBe('Saturday');
  });
});
