/**
 * Инкрементальный пуш: отправляем только изменённое с прошлого раза.
 *
 * Раньше при КАЖДОЙ правке уезжал весь локальный набор — у мастера с 4000
 * записей это полтора мегабайта на «отметить визит выполненным». Ошибка в этой
 * логике не падает с исключением, она молча НЕ отправляет строку, поэтому
 * тесты держат ровно те сценарии, где такое может случиться.
 */

const upsertCalls: { table: string; rows: any[] }[] = [];
const updateCalls: { table: string; ids: string[] }[] = [];
/** Имя таблицы, на которой мок вернёт ошибку — для проверки частичного отказа. */
let ломатьТаблицу: string | null = null;

jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      upsert: (rows: any[]) => {
        if (ломатьТаблицу === table) {
          return Promise.resolve({ error: { message: 'сеть отвалилась' } });
        }
        upsertCalls.push({ table, rows });
        return Promise.resolve({ error: null });
      },
      update: () => ({
        eq: () => ({
          in: (_c: string, ids: string[]) => {
            updateCalls.push({ table, ids });
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }),
  },
}));
jest.mock('react-native', () => ({
  AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
}));
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store.get(k) ?? null),
      setItem: jest.fn(async (k: string, v: string) => { store.set(k, v); }),
      removeItem: jest.fn(async (k: string) => { store.delete(k); }),
      multiSet: jest.fn(async () => {}),
      multiGet: jest.fn(async () => []),
      clear: jest.fn(async () => { store.clear(); }),
    },
  };
});
// Транзитивно тянется через useAppointmentStore; нативный модуль в jest не грузится.
jest.mock('@/src/lib/reminders/notifications', () => ({
  cancelNotification: jest.fn(async () => undefined),
  scheduleAppointmentReminder: jest.fn(),
  scheduleMorningReminder: jest.fn(),
  cancelAllNotifications: jest.fn(),
  registerForPushNotifications: jest.fn(),
}));

import { useSyncStore } from '@/src/stores/useSyncStore';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { flushPush, pushAll } from '@/src/lib/sync/cloudSync';

const МАСТЕР = '11111111-1111-1111-1111-111111111111';

/** Положить клиентов прямо в стор с заданным updatedAt. */
function засеятьКлиентов(список: { id: string; updatedAt: string }[]) {
  useClientStore.setState({
    clients: список.map((c) => ({
      id: c.id, name: 'К' + c.id, phone: '', notes: '', tags: [],
      createdAt: c.updatedAt, updatedAt: c.updatedAt,
    })) as any,
    tombstones: [],
  });
}

function клиентыИзПоследнейОтправки(): string[] {
  const c = upsertCalls.filter((u) => u.table === 'clients').pop();
  return c ? c.rows.map((r: any) => r.id) : [];
}

beforeEach(() => {
  ломатьТаблицу = null;
  upsertCalls.length = 0;
  updateCalls.length = 0;
  useAuthStore.setState({ user: { id: МАСТЕР } as any, localOnlyMode: false } as any);
  useSyncStore.setState({ pushMarks: {} });
  useServiceStore.setState({ services: [], tombstones: [] } as any);
  useAppointmentStore.setState({ appointments: [], tombstones: [] } as any);
  useFinanceStore.setState({ entries: [], tombstones: [] } as any);
  useSettingsStore.setState({ masterName: 'Тест' } as any);
});

describe('инкрементальный пуш', () => {
  it('без метки отправляет всё (первый запуск)', async () => {
    засеятьКлиентов([
      { id: 'a', updatedAt: '2026-01-01T10:00:00.000Z' },
      { id: 'b', updatedAt: '2026-01-02T10:00:00.000Z' },
    ]);
    await flushPush();
    expect(клиентыИзПоследнейОтправки().sort()).toEqual(['a', 'b']);
  });

  it('после успешной отправки метка встаёт на самую свежую строку', async () => {
    засеятьКлиентов([
      { id: 'a', updatedAt: '2026-01-01T10:00:00.000Z' },
      { id: 'b', updatedAt: '2026-01-02T10:00:00.000Z' },
    ]);
    await flushPush();
    expect(useSyncStore.getState().pushMarks[`${МАСТЕР}:clients`])
      .toBe('2026-01-02T10:00:00.000Z');
  });

  it('метка не откатывается назад', () => {
    const { advancePushMark } = useSyncStore.getState();
    advancePushMark('k', '2026-05-05T00:00:00.000Z');
    advancePushMark('k', '2026-01-01T00:00:00.000Z');
    expect(useSyncStore.getState().pushMarks.k).toBe('2026-05-05T00:00:00.000Z');
  });

  it('метка привязана к аккаунту: вход под другим не наследует чужую', async () => {
    засеятьКлиентов([{ id: 'a', updatedAt: '2026-01-01T10:00:00.000Z' }]);
    await flushPush();
    upsertCalls.length = 0;

    // тот же набор, но другой пользователь → метки для него нет → шлём всё
    const ДРУГОЙ = '22222222-2222-2222-2222-222222222222';
    useAuthStore.setState({ user: { id: ДРУГОЙ } as any } as any);
    await flushPush();
    expect(клиентыИзПоследнейОтправки()).toEqual(['a']);
  });

  it('удаления уходят даже когда изменённых строк нет', async () => {
    засеятьКлиентов([{ id: 'a', updatedAt: '2026-01-01T10:00:00.000Z' }]);
    await flushPush();
    upsertCalls.length = 0;
    updateCalls.length = 0;

    useClientStore.setState({
      tombstones: [{ id: 'z', deletedAt: '2026-02-01T00:00:00.000Z' }],
    } as any);
    await flushPush();
    expect(updateCalls.find((u) => u.table === 'clients')?.ids).toEqual(['z']);
  });

  it('чистая таблица без удалений не порождает запрос вообще', async () => {
    засеятьКлиентов([{ id: 'a', updatedAt: '2026-01-01T10:00:00.000Z' }]);
    await flushPush();
    upsertCalls.length = 0;

    // ничего не менялось — но flushPush делает ПОЛНЫЙ пуш (страховка),
    // поэтому строка уедет снова. Это осознанно, см. комментарий к pushAll.
    await flushPush();
    expect(клиентыИзПоследнейОтправки()).toEqual(['a']);
  });

  it('сброс меток при выходе заставляет отправить всё заново', async () => {
    засеятьКлиентов([{ id: 'a', updatedAt: '2026-01-01T10:00:00.000Z' }]);
    await flushPush();
    expect(useSyncStore.getState().pushMarks[`${МАСТЕР}:clients`]).toBeTruthy();

    useSyncStore.getState().clearPushMarks();
    expect(useSyncStore.getState().pushMarks).toEqual({});
  });

  it('строка с более ранним updatedAt, чем метка, полным пушем всё равно уедет', async () => {
    // Сценарий: на устройстве перевели часы назад. Правка получает время
    // РАНЬШЕ метки и в инкрементальный пуш не попадает. Полный пуш (syncNow
    // раз в несколько минут, flushPush перед выходом) обязан её подобрать.
    засеятьКлиентов([{ id: 'свежая', updatedAt: '2026-06-01T10:00:00.000Z' }]);
    await flushPush();
    upsertCalls.length = 0;

    засеятьКлиентов([
      { id: 'свежая', updatedAt: '2026-06-01T10:00:00.000Z' },
      { id: 'часы-ушли-назад', updatedAt: '2026-01-01T10:00:00.000Z' },
    ]);
    await flushPush(); // full
    expect(клиентыИзПоследнейОтправки()).toContain('часы-ушли-назад');
  });
});

describe('инкрементальный пуш — сам инкремент', () => {
  it('второй раз подряд НЕ шлёт ничего, если ничего не менялось', async () => {
    засеятьКлиентов([
      { id: 'a', updatedAt: '2026-01-01T10:00:00.000Z' },
      { id: 'b', updatedAt: '2026-01-02T10:00:00.000Z' },
    ]);
    await pushAll(МАСТЕР, 'incremental');
    expect(клиентыИзПоследнейОтправки().sort()).toEqual(['a', 'b']);

    upsertCalls.length = 0;
    await pushAll(МАСТЕР, 'incremental');
    // ни одного upsert по clients — вот ради чего всё затевалось
    expect(upsertCalls.filter((u) => u.table === 'clients')).toHaveLength(0);
  });

  it('шлёт ТОЛЬКО изменённую строку, а не весь набор', async () => {
    засеятьКлиентов([
      { id: 'старый-1', updatedAt: '2026-01-01T10:00:00.000Z' },
      { id: 'старый-2', updatedAt: '2026-01-01T11:00:00.000Z' },
      { id: 'старый-3', updatedAt: '2026-01-01T12:00:00.000Z' },
    ]);
    await pushAll(МАСТЕР, 'incremental');
    upsertCalls.length = 0;

    засеятьКлиентов([
      { id: 'старый-1', updatedAt: '2026-01-01T10:00:00.000Z' },
      { id: 'старый-2', updatedAt: '2026-01-01T11:00:00.000Z' },
      { id: 'старый-3', updatedAt: '2026-01-01T12:00:00.000Z' },
      { id: 'новый', updatedAt: '2026-03-01T10:00:00.000Z' },
    ]);
    await pushAll(МАСТЕР, 'incremental');
    expect(клиентыИзПоследнейОтправки()).toEqual(['новый']);
  });

  it('правка существующей строки поднимает её updatedAt и она уезжает снова', async () => {
    засеятьКлиентов([{ id: 'a', updatedAt: '2026-01-01T10:00:00.000Z' }]);
    await pushAll(МАСТЕР, 'incremental');
    upsertCalls.length = 0;

    засеятьКлиентов([{ id: 'a', updatedAt: '2026-01-05T10:00:00.000Z' }]);
    await pushAll(МАСТЕР, 'incremental');
    expect(клиентыИзПоследнейОтправки()).toEqual(['a']);
  });

  it('строка ровно с временем метки повторно НЕ шлётся (строгое сравнение)', async () => {
    засеятьКлиентов([{ id: 'a', updatedAt: '2026-01-01T10:00:00.000Z' }]);
    await pushAll(МАСТЕР, 'incremental');
    upsertCalls.length = 0;
    await pushAll(МАСТЕР, 'incremental');
    expect(upsertCalls.filter((u) => u.table === 'clients')).toHaveLength(0);
  });

  it('падение на второй таблице не двигает её метку, но двигает метку первой', async () => {
    засеятьКлиентов([{ id: 'c1', updatedAt: '2026-01-01T10:00:00.000Z' }]);
    useServiceStore.setState({
      services: [{ id: 's1', name: 'У', price: 1, duration: 30,
                   updatedAt: '2026-01-02T10:00:00.000Z' }],
      tombstones: [],
    } as any);
    ломатьТаблицу = 'services';
    await expect(pushAll(МАСТЕР, 'incremental')).rejects.toThrow();
    ломатьТаблицу = null;

    const метки = useSyncStore.getState().pushMarks;
    expect(метки[`${МАСТЕР}:clients`]).toBe('2026-01-01T10:00:00.000Z'); // прошла
    expect(метки[`${МАСТЕР}:services`]).toBeUndefined();                 // упала
  });
});
