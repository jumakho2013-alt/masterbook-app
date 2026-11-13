/**
 * Восстановление профиля при входе на новом телефоне. Без него первый синк
 * затирал имя, онбординг дублировал услуги, «Опубликовать» менял ссылку.
 */
let serverRow: Record<string, unknown> | null = null;

jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: serverRow, error: null }) }),
      }),
    }),
  },
}));
jest.mock('@/src/lib/crashReporter', () => ({ captureException: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  },
}));

import { restoreProfileFromServer, settingsFromServer } from '../profileRestore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

const SERVER = {
  name: 'Мадина',
  profession_category: 'beauty',
  specialization_id: 'nails',
  city: 'Душанбе',
  district: 'Сино',
  bio: 'Маникюр',
  slug: 'madina-ab12',
  whatsapp: '+992900000000',
  public_phone: null,
  published: true,
  portfolio_photos: ['https://x/1.jpg'],
  currency: 'TJS',
  work_days: [1, 2, 3, 4, 5],
  work_hours_start: '10:00',
  work_hours_end: '19:00',
  break_enabled: false,
  break_start: '13:00',
  break_end: '14:00',
  buffer_minutes: 0,
};

beforeEach(() => {
  serverRow = { ...SERVER };
  useSettingsStore.getState().reset();
});

describe('settingsFromServer', () => {
  it('переносит публичный профиль и график', () => {
    expect(settingsFromServer(SERVER as any)).toMatchObject({
      masterName: 'Мадина', city: 'Душанбе', slug: 'madina-ab12', published: true,
      workDays: [1, 2, 3, 4, 5], workHours: { start: '10:00', end: '19:00' },
      breakTime: { enabled: false, start: '13:00', end: '14:00' }, bufferMinutes: 0, currency: 'TJS',
    });
  });

  it('мусор с сервера не попадает в настройки', () => {
    const out = settingsFromServer({ ...SERVER, currency: 'XXX', work_hours_start: '9', work_days: [] } as any);
    expect(out).not.toHaveProperty('currency');
    expect(out).not.toHaveProperty('workHours');
    expect(out).not.toHaveProperty('workDays');
  });
});

describe('restoreProfileFromServer', () => {
  it('новый телефон: профиль восстановлен, онбординг можно пропустить', async () => {
    const r = await restoreProfileFromServer('u1');
    expect(r).toEqual({ professionCategory: 'beauty', specializationId: 'nails' });
    const s = useSettingsStore.getState();
    expect(s.masterName).toBe('Мадина');
    expect(s.slug).toBe('madina-ab12');
    expect(s.workHours).toEqual({ start: '10:00', end: '19:00' });
    expect(s.firstUseAt).not.toBeNull();
  });

  it('телефон уже знает мастера — локальное не трогаем', async () => {
    useSettingsStore.setState({ masterName: 'Локальное имя', workHours: { start: '08:00', end: '12:00' } });
    await restoreProfileFromServer('u1');
    expect(useSettingsStore.getState().masterName).toBe('Локальное имя');
    expect(useSettingsStore.getState().workHours).toEqual({ start: '08:00', end: '12:00' });
  });

  it('онбординг не пройден на сервере (нет профессии) — null', async () => {
    serverRow = { ...SERVER, profession_category: null };
    expect(await restoreProfileFromServer('u1')).toBeNull();
  });

  it('профиля нет / сеть — null, без падения', async () => {
    serverRow = null;
    expect(await restoreProfileFromServer('u1')).toBeNull();
  });
});
