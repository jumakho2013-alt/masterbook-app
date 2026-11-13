import { findNewWebBookings } from '../webBookingDetect';

const NOW = Date.parse('2026-11-13T10:00:00Z');
const row = (over: Record<string, unknown> = {}) => ({
  id: 'web-1',
  status: 'scheduled',
  deleted_at: null,
  created_at: '2026-11-13T09:00:00Z',
  date: '2026-11-16',
  start_time: '17:00',
  notes: '🌐 Онлайн-запись с сайта\nКлиент: Мадина\nТелефон: +992 90 000 00 00\nУслуга: Маникюр',
  ...over,
});

describe('findNewWebBookings', () => {
  it('новая запись с сайта: имя и услуга из заметки', () => {
    expect(findNewWebBookings([row()], new Set(), NOW)).toEqual([
      { id: 'web-1', date: '2026-11-16', time: '17:00', name: 'Мадина', service: 'Маникюр' },
    ]);
  });

  it('уже известная телефону — не новая', () => {
    expect(findNewWebBookings([row()], new Set(['web-1']), NOW)).toEqual([]);
  });

  it('записи из приложения (не web-) не считаются', () => {
    expect(findNewWebBookings([row({ id: 'local-1' })], new Set(), NOW)).toEqual([]);
  });

  it('отменённая, удалённая, старая — пропускаются', () => {
    expect(findNewWebBookings([
      row({ id: 'web-c', status: 'cancelled' }),
      row({ id: 'web-d', deleted_at: '2026-11-13T09:30:00Z' }),
      row({ id: 'web-o', created_at: '2026-11-01T09:00:00Z' }),
      row({ id: 'web-x', created_at: 'мусор' }),
    ], new Set(), NOW)).toEqual([]);
  });

  it('заметку без полей не роняет — пустые строки', () => {
    const [b] = findNewWebBookings([row({ notes: null })], new Set(), NOW);
    expect(b.name).toBe('');
    expect(b.service).toBe('');
  });
});
