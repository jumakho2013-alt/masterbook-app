/**
 * Инкрементальная выгрузка: тянем только изменённое с прошлого раза.
 *
 * Цена ошибки тут выше, чем у пуша: пропущенная строка означает, что запись,
 * созданная на втором устройстве, просто НЕ приедет — и никто не заметит.
 * Поэтому тесты держат все места, где строка может потеряться навсегда:
 * фильтр, запас на гонку транзакций, протухшая метка, смена аккаунта.
 */

type Запрос = { table: string; since?: string };
const запросы: Запрос[] = [];
/** Что мок вернёт по таблице. */
let ответы: Record<string, any[]> = {};

jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      const q: any = {
        _since: undefined as string | undefined,
        select() { return q; },
        eq() { return q; },
        gte(_col: string, v: string) { q._since = v; return q; },
        order() { return q; },
        range(from: number) {
          запросы.push({ table, since: q._since });
          const все = ответы[table] ?? [];
          const страница = q._since
            ? все.filter((r) => new Date(r.server_updated_at).getTime() >= new Date(q._since).getTime())
            : все;
          return Promise.resolve({ data: from === 0 ? страница : [], error: null });
        },
        upsert() { return Promise.resolve({ error: null }); },
        update() { return { eq: () => ({ in: () => Promise.resolve({ error: null }) }) }; },
      };
      return q;
    },
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
      removeItem: jest.fn(async () => {}),
      multiSet: jest.fn(async () => {}),
      multiGet: jest.fn(async () => []),
    },
  };
});
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
import { syncNow } from '@/src/lib/sync/cloudSync';

const МАСТЕР = '11111111-1111-1111-1111-111111111111';

/** Отметки должны быть свежими: метка старше 30 дней намеренно приводит к
 *  полной выгрузке, и тест на инкремент проверял бы не то. */
const минутНазад = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const СЕЙЧАС = минутНазад(0);

function строкаКлиента(id: string, серверноеВремя: string) {
  return {
    id, user_id: МАСТЕР, name: 'К' + id, phone: '', notes: '', tags: [],
    created_at: серверноеВремя, updated_at: серверноеВремя,
    server_updated_at: серверноеВремя, deleted_at: null,
  };
}

const запросКлиентов = () => запросы.filter((z) => z.table === 'clients').pop();

beforeEach(() => {
  запросы.length = 0;
  ответы = {};
  useAuthStore.setState({ user: { id: МАСТЕР } as any, localOnlyMode: false } as any);
  useSyncStore.setState({ pushMarks: {}, pullMarks: {}, lastFullPullAt: {} });
  useClientStore.setState({ clients: [], tombstones: [] } as any);
  useServiceStore.setState({ services: [], tombstones: [] } as any);
  useAppointmentStore.setState({ appointments: [], tombstones: [] } as any);
  useFinanceStore.setState({ entries: [], tombstones: [] } as any);
});

describe('инкрементальная выгрузка', () => {
  it('первый синк тянет всё — фильтра нет', async () => {
    ответы.clients = [строкаКлиента('a', '2026-06-01T10:00:00.000Z')];
    await syncNow();
    expect(запросКлиентов()?.since).toBeUndefined();
    expect(useClientStore.getState().clients.map((c) => c.id)).toEqual(['a']);
  });

  it('второй синк фильтрует по серверной отметке', async () => {
    ответы.clients = [строкаКлиента('a', минутНазад(5))];
    await syncNow();

    // сутки не прошли → второй синк должен быть инкрементальным
    useSyncStore.setState({ lastFullPullAt: { [МАСТЕР]: СЕЙЧАС } });
    запросы.length = 0;
    await syncNow();
    expect(запросКлиентов()?.since).toBeDefined();
  });

  it('метка отматывается назад на запас — гонка транзакций не теряет строку', async () => {
    const отметка = минутНазад(5);
    ответы.clients = [строкаКлиента('a', отметка)];
    await syncNow();

    const метка = useSyncStore.getState().pullMarks[`${МАСТЕР}:clients`];
    const разница = new Date(отметка).getTime() - new Date(метка).getTime();
    expect(разница).toBe(60_000); // ровно минута запаса
  });

  it('строка, закоммиченная с отметкой чуть раньше максимума, всё равно приедет', async () => {
    // Транзакция стартовала до нашей выборки, а закоммитилась после: её
    // server_updated_at меньше максимума, который мы уже видели.
    ответы.clients = [строкаКлиента('быстрая', минутНазад(5))];
    await syncNow();
    useSyncStore.setState({ lastFullPullAt: { [МАСТЕР]: СЕЙЧАС } });

    ответы.clients = [
      строкаКлиента('быстрая', минутНазад(5)),
      строкаКлиента('опоздавшая', минутНазад(5.5)), // закоммитилась на 30 сек раньше
    ];
    await syncNow();
    expect(useClientStore.getState().clients.map((c) => c.id).sort())
      .toEqual(['быстрая', 'опоздавшая']);
  });

  it('протухшая метка (старше 30 дней) заставляет тянуть всё заново', async () => {
    const древняя = new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString();
    useSyncStore.setState({
      pullMarks: { [`${МАСТЕР}:clients`]: древняя },
      lastFullPullAt: { [МАСТЕР]: new Date().toISOString() },
    });
    ответы.clients = [строкаКлиента('a', минутНазад(5))];
    await syncNow();
    // фильтр не проставлен — значит выгрузка полная
    expect(запросКлиентов()?.since).toBeUndefined();
  });

  it('раз в сутки выгрузка полная, даже если метка свежая', async () => {
    ответы.clients = [строкаКлиента('a', минутНазад(5))];
    await syncNow();
    // lastFullPullAt проставился первым синком; отматываем на двое суток назад
    useSyncStore.setState({
      lastFullPullAt: { [МАСТЕР]: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
    });
    запросы.length = 0;
    await syncNow();
    expect(запросКлиентов()?.since).toBeUndefined();
  });

  it('метка привязана к аккаунту — другой мастер тянет с нуля', async () => {
    ответы.clients = [строкаКлиента('a', минутНазад(5))];
    await syncNow();

    const ДРУГОЙ = '22222222-2222-2222-2222-222222222222';
    useAuthStore.setState({ user: { id: ДРУГОЙ } as any } as any);
    useSyncStore.setState({ lastFullPullAt: { [ДРУГОЙ]: new Date().toISOString() } });
    запросы.length = 0;
    await syncNow();
    expect(запросКлиентов()?.since).toBeUndefined();
  });

  it('удаление приезжает своей строкой и применяется', async () => {
    ответы.clients = [строкаКлиента('a', минутНазад(5))];
    await syncNow();
    expect(useClientStore.getState().clients.map((c) => c.id)).toEqual(['a']);

    useSyncStore.setState({ lastFullPullAt: { [МАСТЕР]: СЕЙЧАС } });
    ответы.clients = [{
      ...строкаКлиента('a', минутНазад(1)),
      deleted_at: минутНазад(1),
    }];
    await syncNow();
    expect(useClientStore.getState().clients).toHaveLength(0);
  });

  it('выход стирает метки выгрузки', () => {
    useSyncStore.setState({
      pullMarks: { k: '2026-01-01T00:00:00.000Z' },
      lastFullPullAt: { u: '2026-01-01T00:00:00.000Z' },
    });
    useSyncStore.getState().clearSyncMarks();
    expect(useSyncStore.getState().pullMarks).toEqual({});
    expect(useSyncStore.getState().lastFullPullAt).toEqual({});
  });
});
