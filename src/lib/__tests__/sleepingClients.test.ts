// Linking + Platform моки — sleepingClients.ts импортирует Linking из RN.
// Чистая логика (findSleepingClients, daysBetweenIsoDates,
// buildDraftMessages, phoneForWhatsApp) от RN не зависит, но import
// верхнего уровня всё равно нужно резолвить.

jest.mock('react-native', () => ({
  Linking: { canOpenURL: jest.fn(), openURL: jest.fn() },
  Platform: { OS: 'ios' },
}));

import {
  findSleepingClients,
  daysBetweenIsoDates,
  buildDraftMessages,
  phoneForWhatsApp,
  normalizePhoneForLink,
  DEFAULT_SLEEPING_THRESHOLD_DAYS,
} from '../sleepingClients';
import type { Client, Appointment } from '@/src/types';

function makeClient(over: Partial<Client> & { id: string }): Client {
  // id передаём ЯВНО и без префиксов чтобы избежать ловушки со spread
  // (раньше префикс затирался последующим `...over`).
  return {
    name: 'Мария',
    phone: '+79991234567',
    notes: '',
    tags: [],
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}
function makeAppt(over: Partial<Appointment> & { id?: string } = {}): Appointment {
  return {
    id: over.id ?? 'apt-x',
    clientId: 'cli-x',
    serviceId: 'svc-1',
    date: '2026-01-01',
    startTime: '10:00',
    endTime: '11:00',
    status: 'completed',
    price: 2500,
    ...over,
  };
}

describe('daysBetweenIsoDates', () => {
  it('same day returns 0', () => {
    expect(daysBetweenIsoDates('2026-06-15', '2026-06-15')).toBe(0);
  });
  it('1 day forward', () => {
    expect(daysBetweenIsoDates('2026-06-15', '2026-06-16')).toBe(1);
  });
  it('cross month', () => {
    expect(daysBetweenIsoDates('2026-05-30', '2026-06-02')).toBe(3);
  });
  it('cross year', () => {
    expect(daysBetweenIsoDates('2025-12-30', '2026-01-02')).toBe(3);
  });
  it('leap year February', () => {
    // 2024 — високосный: 29 февраля существует
    expect(daysBetweenIsoDates('2024-02-28', '2024-03-01')).toBe(2);
  });
  it('negative if to-date is earlier (defensive — not expected in caller)', () => {
    expect(daysBetweenIsoDates('2026-06-15', '2026-06-10')).toBe(-5);
  });
});

describe('findSleepingClients', () => {
  const todayKey = '2026-06-15';

  it('returns empty when no clients', () => {
    expect(
      findSleepingClients({ clients: [], appointments: [], todayKey }),
    ).toEqual([]);
  });

  it('excludes clients with no completed appointments', () => {
    const c = makeClient({ id: 'cli-1' });
    expect(
      findSleepingClients({ clients: [c], appointments: [], todayKey }),
    ).toEqual([]);
  });

  it('includes client with old completed appointment past threshold', () => {
    const c = makeClient({ id: 'cli-1' });
    // 70 дней назад
    const lastVisit = '2026-04-06';
    const result = findSleepingClients({
      clients: [c],
      appointments: [makeAppt({ clientId: 'cli-1', date: lastVisit })],
      todayKey,
      thresholdDays: 45,
    });
    expect(result).toHaveLength(1);
    expect(result[0].daysSince).toBe(70);
    expect(result[0].lastVisitDate).toBe(lastVisit);
  });

  it('excludes client below threshold', () => {
    const c = makeClient({ id: 'cli-1' });
    // 30 дней — меньше дефолта 45
    const result = findSleepingClients({
      clients: [c],
      appointments: [makeAppt({ clientId: 'cli-1', date: '2026-05-16' })],
      todayKey,
    });
    expect(result).toEqual([]);
  });

  it('excludes client with problematic tag (anti-pattern guard)', () => {
    const c = makeClient({ id: 'cli-1', tags: ['problematic'] });
    const result = findSleepingClients({
      clients: [c],
      appointments: [makeAppt({ clientId: 'cli-1', date: '2026-04-06' })],
      todayKey,
    });
    expect(result).toEqual([]);
  });

  it('excludes client with upcoming scheduled appointment', () => {
    const c = makeClient({ id: 'cli-1' });
    const result = findSleepingClients({
      clients: [c],
      appointments: [
        makeAppt({ id: 'a1', clientId: 'cli-1', date: '2026-04-06' }), // completed past
        makeAppt({ id: 'a2', clientId: 'cli-1', date: '2026-06-20', status: 'scheduled' }), // upcoming
      ],
      todayKey,
    });
    expect(result).toEqual([]);
  });

  it('uses MOST RECENT completed appointment for daysSince', () => {
    const c = makeClient({ id: 'cli-1' });
    const result = findSleepingClients({
      clients: [c],
      appointments: [
        makeAppt({ id: 'a1', clientId: 'cli-1', date: '2026-01-01' }), // old
        makeAppt({ id: 'a2', clientId: 'cli-1', date: '2026-04-15' }), // newer
      ],
      todayKey,
      thresholdDays: 45,
    });
    expect(result).toHaveLength(1);
    expect(result[0].lastVisitDate).toBe('2026-04-15');
    expect(result[0].daysSince).toBe(61); // 15 апр → 15 июн = 61 день
  });

  it('sorts by daysSince descending (longest absence first)', () => {
    const c1 = makeClient({ id: 'cli-1', name: 'A' });
    const c2 = makeClient({ id: 'cli-2', name: 'B' });
    const c3 = makeClient({ id: 'cli-3', name: 'C' });
    const result = findSleepingClients({
      clients: [c1, c2, c3],
      appointments: [
        makeAppt({ id: 'a1', clientId: 'cli-1', date: '2026-04-01' }), // 75 d
        makeAppt({ id: 'a2', clientId: 'cli-2', date: '2026-03-01' }), // 106 d
        makeAppt({ id: 'a3', clientId: 'cli-3', date: '2026-04-20' }), // 56 d
      ],
      todayKey,
      thresholdDays: 45,
    });
    expect(result.map((r) => r.client.id)).toEqual(['cli-2', 'cli-1', 'cli-3']);
  });

  it('resolves lastServiceName via callback', () => {
    const c = makeClient({ id: 'cli-1' });
    const result = findSleepingClients({
      clients: [c],
      appointments: [makeAppt({ clientId: 'cli-1', date: '2026-04-06', serviceId: 'svc-1' })],
      todayKey,
      serviceNameById: (id) => (id === 'svc-1' ? 'Маникюр' : undefined),
    });
    expect(result[0].lastServiceName).toBe('Маникюр');
  });

  it('default threshold is 45 days', () => {
    expect(DEFAULT_SLEEPING_THRESHOLD_DAYS).toBe(45);
  });
});

describe('buildDraftMessages', () => {
  it('produces 3 variants with first name', () => {
    const msgs = buildDraftMessages({
      clientName: 'Мария Иванова',
      daysSince: 60,
      lastServiceName: 'Маникюр',
      masterName: 'Анна',
    });
    expect(msgs).toHaveLength(3);
    for (const m of msgs) expect(m).toContain('Мария');
    expect(msgs[0]).toContain('60 дн.');
    expect(msgs[0]).toContain('маникюр');
    expect(msgs[0]).toContain('Анна');
  });

  it('omits service fragment when undefined', () => {
    const msgs = buildDraftMessages({ clientName: 'Иван', daysSince: 50 });
    expect(msgs[0]).not.toContain('()');
  });
});

describe('phoneForWhatsApp', () => {
  it('strips +, formatting, spaces', () => {
    expect(phoneForWhatsApp('+7 (999) 123-45-67')).toBe('79991234567');
    expect(phoneForWhatsApp('+79991234567')).toBe('79991234567');
  });
  it('converts leading 8 (RU domestic) to 7', () => {
    expect(phoneForWhatsApp('8 (999) 123-45-67')).toBe('79991234567');
    expect(phoneForWhatsApp('89991234567')).toBe('79991234567');
  });
  it('does not touch other 8-leading numbers (e.g. South Korea +82)', () => {
    // +82 10 1234 5678 — корейский номер. Не должен меняться.
    expect(phoneForWhatsApp('+821012345678')).toBe('821012345678');
  });
});

describe('normalizePhoneForLink', () => {
  it('keeps + sign and digits', () => {
    expect(normalizePhoneForLink('+7 (999) 123-45-67')).toBe('+79991234567');
  });
});
