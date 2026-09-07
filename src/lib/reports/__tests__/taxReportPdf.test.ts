// Unit-тесты на collectTaxReportData + renderTaxReportHtml. Это
// налогово-релевантный код — если итоговая сумма врёт, мастер врёт ФНС.
// Поэтому тесты должны быть особенно дотошны на edge cases:
//   • пустой период
//   • границы периода inclusive
//   • валюта обрабатывается
//   • escape HTML работает на потенциально вредных именах клиентов
//   • НПД считается верно (4%)
//   • fallback на completed appointments когда finance.entries пустые

// expo-print и expo-sharing — native-модули, ESM, ts-jest их не разбирает.
// Подменяем на лёгкие моки. Тесты не вызывают printToFileAsync/shareAsync
// напрямую — только collectTaxReportData + renderTaxReportHtml.
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(async () => ({ uri: 'file:///tmp/report.pdf' })),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

// Замокать сторы — taxReportPdf достаёт state через getState().
const financeMock = jest.fn();
const appointmentMock = jest.fn();
const clientMock = jest.fn();
const serviceMock = jest.fn();
const settingsMock = jest.fn();

jest.mock('@/src/stores/useFinanceStore', () => ({
  useFinanceStore: { getState: () => financeMock() },
}));
jest.mock('@/src/stores/useAppointmentStore', () => ({
  useAppointmentStore: { getState: () => appointmentMock() },
}));
jest.mock('@/src/stores/useClientStore', () => ({
  useClientStore: { getState: () => clientMock() },
}));
jest.mock('@/src/stores/useServiceStore', () => ({
  useServiceStore: { getState: () => serviceMock() },
}));
jest.mock('@/src/stores/useSettingsStore', () => ({
  useSettingsStore: { getState: () => settingsMock() },
}));

import {
  collectTaxReportData,
  renderTaxReportHtml,
  currentMonthRange,
} from '../taxReportPdf';

describe('collectTaxReportData', () => {
  beforeEach(() => {
    settingsMock.mockReturnValue({ masterName: 'Анна', currency: 'RUB' });
    clientMock.mockReturnValue({ clients: [] });
    serviceMock.mockReturnValue({ services: [] });
    appointmentMock.mockReturnValue({ appointments: [] });
    financeMock.mockReturnValue({ entries: [] });
  });

  it('returns empty rows + zero totals for empty stores', () => {
    const data = collectTaxReportData({ start: '2026-06-01', end: '2026-06-30' });
    expect(data.rows).toEqual([]);
    expect(data.totalIncome).toBe(0);
    expect(data.count).toBe(0);
    expect(data.taxIndicative).toBe(0);
    expect(data.masterName).toBe('Анна');
  });

  it('falls back to "Самозанятый мастер" when masterName empty', () => {
    settingsMock.mockReturnValue({ masterName: '', currency: 'RUB' });
    const data = collectTaxReportData({ start: '2026-06-01', end: '2026-06-30' });
    expect(data.masterName).toBe('Самозанятый мастер');
  });

  it('sums income entries within range (inclusive both ends)', () => {
    financeMock.mockReturnValue({
      entries: [
        { id: '1', type: 'income', amount: 2500, description: 'Маникюр', date: '2026-06-01' }, // start inclusive
        { id: '2', type: 'income', amount: 3500, description: 'Брови', date: '2026-06-15' },
        { id: '3', type: 'income', amount: 4000, description: 'Стрижка', date: '2026-06-30' }, // end inclusive
        { id: '4', type: 'income', amount: 9999, description: 'За пределами', date: '2026-07-01' }, // out
        { id: '5', type: 'income', amount: 9999, description: 'До', date: '2026-05-31' }, // out
        { id: '6', type: 'expense', amount: 500, description: 'Расход', date: '2026-06-10' }, // excluded by type
      ],
    });
    const data = collectTaxReportData({ start: '2026-06-01', end: '2026-06-30' });
    expect(data.count).toBe(3);
    expect(data.totalIncome).toBe(10000);
  });

  it('computes НПД 4% indicative tax correctly', () => {
    financeMock.mockReturnValue({
      entries: [
        { id: '1', type: 'income', amount: 50000, description: 'x', date: '2026-06-15' },
      ],
    });
    const data = collectTaxReportData({ start: '2026-06-01', end: '2026-06-30' });
    expect(data.taxRate).toBe(0.04);
    expect(data.taxIndicative).toBe(2000); // 50000 × 0.04
  });

  it('sorts rows by date ascending', () => {
    financeMock.mockReturnValue({
      entries: [
        { id: '1', type: 'income', amount: 100, description: 'C', date: '2026-06-20' },
        { id: '2', type: 'income', amount: 200, description: 'A', date: '2026-06-05' },
        { id: '3', type: 'income', amount: 300, description: 'B', date: '2026-06-10' },
      ],
    });
    const data = collectTaxReportData({ start: '2026-06-01', end: '2026-06-30' });
    expect(data.rows.map((r) => r.date)).toEqual(['2026-06-05', '2026-06-10', '2026-06-20']);
  });

  it('falls back to completed appointments when no finance.income entries', () => {
    clientMock.mockReturnValue({
      clients: [{ id: 'cli1', name: 'Мария', phone: '', notes: '', createdAt: '' }],
    });
    serviceMock.mockReturnValue({
      services: [{ id: 'svc1', name: 'Маникюр', price: 2500, duration: 60 }],
    });
    appointmentMock.mockReturnValue({
      appointments: [
        {
          id: 'apt1',
          clientId: 'cli1',
          serviceId: 'svc1',
          date: '2026-06-15',
          startTime: '10:00',
          endTime: '11:00',
          status: 'completed',
          price: 2500,
        },
        {
          id: 'apt2',
          clientId: 'cli1',
          serviceId: 'svc1',
          date: '2026-06-20',
          startTime: '10:00',
          endTime: '11:00',
          status: 'scheduled', // не completed — игнор
          price: 2500,
        },
        {
          id: 'apt3',
          clientId: 'cli1',
          serviceId: 'svc1',
          date: '2026-05-30', // вне периода
          startTime: '10:00',
          endTime: '11:00',
          status: 'completed',
          price: 2500,
        },
      ],
    });
    financeMock.mockReturnValue({ entries: [] }); // нет явных доходов

    const data = collectTaxReportData({ start: '2026-06-01', end: '2026-06-30' });
    expect(data.count).toBe(1);
    expect(data.totalIncome).toBe(2500);
    expect(data.rows[0].clientName).toBe('Мария');
    expect(data.rows[0].serviceName).toBe('Маникюр');
  });

  it('does NOT use appointment fallback if finance has income (avoid double-counting)', () => {
    // Сценарий: мастер ВНЁС доход и пометил appointment completed. Чтобы не
    // удвоить сумму — берём только finance entries.
    appointmentMock.mockReturnValue({
      appointments: [
        {
          id: 'apt1',
          clientId: 'cli1',
          serviceId: 'svc1',
          date: '2026-06-15',
          startTime: '10:00',
          endTime: '11:00',
          status: 'completed',
          price: 2500,
        },
      ],
    });
    financeMock.mockReturnValue({
      entries: [
        { id: '1', type: 'income', amount: 2500, description: 'Маникюр', date: '2026-06-15', appointmentId: 'apt1' },
      ],
    });
    const data = collectTaxReportData({ start: '2026-06-01', end: '2026-06-30' });
    // Только 1 запись (из finance), не 2.
    expect(data.count).toBe(1);
    expect(data.totalIncome).toBe(2500);
  });
});

describe('renderTaxReportHtml', () => {
  const baseData = {
    masterName: 'Анна',
    range: { start: '2026-06-01', end: '2026-06-30' },
    rows: [
      { date: '2026-06-15', clientName: 'Мария', serviceName: 'Маникюр', amount: 2500 },
    ],
    totalIncome: 2500,
    count: 1,
    taxRate: 0.04,
    taxIndicative: 100,
    generatedAt: '2026-06-30T12:00:00Z',
  };

  beforeEach(() => {
    settingsMock.mockReturnValue({ masterName: 'Анна', currency: 'RUB' });
  });

  it('produces valid HTML with masterName and date range', () => {
    const html = renderTaxReportHtml(baseData);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Анна');
    expect(html).toContain('01.06.2026');
    expect(html).toContain('30.06.2026');
  });

  it('escapes HTML in client/service names (XSS guard for HTML→PDF pipeline)', () => {
    const html = renderTaxReportHtml({
      ...baseData,
      rows: [
        { date: '2026-06-15', clientName: '<script>alert(1)</script>', serviceName: 'X & Y', amount: 1000 },
      ],
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('X &amp; Y');
  });

  it('shows fallback message for empty period', () => {
    const html = renderTaxReportHtml({ ...baseData, rows: [], count: 0, totalIncome: 0, taxIndicative: 0 });
    expect(html).toContain('За указанный период доходов не зарегистрировано');
  });

  it('contains the required tax disclaimer (legal guard)', () => {
    const html = renderTaxReportHtml(baseData);
    // Критично: документ должен явно говорить что это НЕ замена справки ФНС.
    expect(html).toContain('не заменяет официальную');
    expect(html).toContain('Мой Налог');
  });
});

describe('currentMonthRange', () => {
  it('produces YYYY-MM-DD first and last day of given month', () => {
    // Июнь 2026 — 30 дней.
    const r = currentMonthRange(new Date(2026, 5, 15)); // месяц 5 = июнь
    expect(r.start).toBe('2026-06-01');
    expect(r.end).toBe('2026-06-30');
  });

  it('correctly handles February in leap years', () => {
    const r = currentMonthRange(new Date(2024, 1, 10)); // февраль 2024 (високосный)
    expect(r.start).toBe('2024-02-01');
    expect(r.end).toBe('2024-02-29');
  });

  it('correctly handles February in non-leap years', () => {
    const r = currentMonthRange(new Date(2026, 1, 10));
    expect(r.start).toBe('2026-02-01');
    expect(r.end).toBe('2026-02-28');
  });

  it('correctly handles December (year transition)', () => {
    const r = currentMonthRange(new Date(2026, 11, 25));
    expect(r.start).toBe('2026-12-01');
    expect(r.end).toBe('2026-12-31');
  });
});
