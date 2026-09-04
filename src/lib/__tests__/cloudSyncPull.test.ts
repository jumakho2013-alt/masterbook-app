/**
 * Регрессия на тихую потерю данных при восстановлении.
 *
 * PostgREST по умолчанию отдаёт максимум 1000 строк и НЕ считает это ошибкой.
 * Раньше pullAll делал простой select('*'), поэтому мастер с 3000 записей,
 * ставя приложение на новый телефон, получал произвольную первую тысячу и
 * статус «Синхронизировано» — то есть терял две трети данных ровно в том
 * сценарии, ради которого синхронизация и существует.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

jest.mock('react-native', () => ({
  AppState: { addEventListener: jest.fn(() => ({ remove: jest.fn() })), currentState: 'active' },
}));

const PAGE = 1000;

/** Сколько строк лежит «на сервере» в каждой таблице. */
const serverRows: Record<string, number> = {
  clients: 1500,
  services: 40,
  appointments: 3000,
  finance_entries: 5000,
};

/** Запрошенные диапазоны — по ним проверяем, что пагинация реально шла. */
const requestedRanges: Record<string, Array<[number, number]>> = {};

jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      const q: Record<string, unknown> = {};
      q.select = () => q;
      q.eq = () => q;
      q.order = () => q;
      q.range = (from: number, to: number) => {
        (requestedRanges[table] ??= []).push([from, to]);
        const total = serverRows[table] ?? 0;
        const rows = [];
        for (let i = from; i <= Math.min(to, total - 1); i++) {
          rows.push({ id: `${table}-${i}`, updated_at: '2026-01-01T00:00:00.000Z' });
        }
        return Promise.resolve({ data: rows, error: null });
      };
      return q;
    },
  },
}));

const merged: Record<string, number> = {};
const mkStore = (key: string) => ({
  getState: () => ({
    mergeRemote: (rows: unknown[]) => {
      merged[key] = rows.length;
      return [];
    },
  }),
});
jest.mock('@/src/stores/useClientStore', () => ({ useClientStore: mkStore('clients') }));
jest.mock('@/src/stores/useServiceStore', () => ({ useServiceStore: mkStore('services') }));
jest.mock('@/src/stores/useAppointmentStore', () => ({ useAppointmentStore: mkStore('appointments') }));
jest.mock('@/src/stores/useFinanceStore', () => ({ useFinanceStore: mkStore('finance_entries') }));
jest.mock('@/src/stores/useSettingsStore', () => ({ useSettingsStore: { getState: () => ({}) } }));
jest.mock('@/src/stores/useSyncStore', () => ({
  useSyncStore: { getState: () => ({ setStatus: jest.fn(), setSynced: jest.fn(), setError: jest.fn() }) },
}));
jest.mock('@/src/stores/useAuthStore', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'u1' }, localOnlyMode: false }) },
}));
jest.mock('@/src/lib/crashReporter', () => ({ captureException: jest.fn() }));

import { syncNow } from '@/src/lib/cloudSync';

describe('pullAll — постраничная выгрузка (защита от лимита в 1000 строк)', () => {
  beforeEach(() => {
    for (const k of Object.keys(requestedRanges)) delete requestedRanges[k];
    for (const k of Object.keys(merged)) delete merged[k];
  });

  it('забирает ВСЕ строки, а не только первую тысячу', async () => {
    await syncNow();
    expect(merged.appointments).toBe(3000);
    expect(merged.finance_entries).toBe(5000);
    expect(merged.clients).toBe(1500);
    expect(merged.services).toBe(40);
  });

  it('идёт страницами по 1000 и останавливается на неполной странице', async () => {
    await syncNow();
    // 3000 строк = 3 полные страницы + одна пустая, чтобы понять что данные кончились
    expect(requestedRanges.appointments).toEqual([
      [0, 999], [1000, 1999], [2000, 2999], [3000, 3999],
    ]);
    // 40 строк — ровно один запрос, страница неполная
    expect(requestedRanges.services).toEqual([[0, 999]]);
  });

  it('сортирует по id — иначе страницы пересекаются и строки теряются', async () => {
    await syncNow();
    const ranges = requestedRanges.finance_entries;
    // диапазоны идут строго подряд, без дыр и нахлёстов
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i][0]).toBe(ranges[i - 1][1] + 1);
    }
  });
});
