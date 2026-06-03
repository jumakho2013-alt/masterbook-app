jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store.get(k) ?? null),
      setItem: jest.fn(async (k: string, v: string) => {
        store.set(k, v);
      }),
      removeItem: jest.fn(async (k: string) => {
        store.delete(k);
      }),
      clear: jest.fn(async () => {
        store.clear();
      }),
    },
  };
});

jest.mock('@/src/lib/notifications', () => ({
  cancelNotification: jest.fn(async () => undefined),
  scheduleAppointmentReminder: jest.fn(),
  scheduleMorningReminder: jest.fn(),
  cancelAllNotifications: jest.fn(),
  registerForPushNotifications: jest.fn(),
}));

import { useClientStore } from '../useClientStore';
import { useAppointmentStore } from '../useAppointmentStore';
import type { RemoteChange } from '@/src/lib/syncMerge';
import type { Client, Appointment } from '@/src/types';

beforeEach(() => {
  useClientStore.setState({ clients: [], tombstones: [] });
  useAppointmentStore.setState({ appointments: [], tombstones: [] });
});

describe('client store sync metadata', () => {
  it('addClient stamps updatedAt', () => {
    const c = useClientStore.getState().addClient({
      name: 'Анна',
      phone: '+70000000000',
      notes: '',
      tags: [],
    });
    expect(c?.updatedAt).toBeTruthy();
  });

  it('deleteClient records a tombstone and removes the client', () => {
    const c = useClientStore.getState().addClient({
      name: 'Борис',
      phone: '+70000000001',
      notes: '',
      tags: [],
    })!;
    useClientStore.getState().deleteClient(c.id);
    expect(useClientStore.getState().clients).toHaveLength(0);
    expect(useClientStore.getState().tombstones.map((t) => t.id)).toContain(c.id);
  });

  it('clearTombstones removes only the given ids', () => {
    useClientStore.setState({
      tombstones: [
        { id: 'a', deletedAt: 'x' },
        { id: 'b', deletedAt: 'y' },
      ],
    });
    useClientStore.getState().clearTombstones(['a']);
    expect(useClientStore.getState().tombstones.map((t) => t.id)).toEqual(['b']);
  });

  it('mergeRemote applies a remote delete and reports it', () => {
    const c = useClientStore.getState().addClient({
      name: 'Вера',
      phone: '+70000000002',
      notes: '',
      tags: [],
    })!;
    const change: RemoteChange<Client> = {
      id: c.id,
      updatedAt: '2099-01-01T00:00:00.000Z',
      deletedAt: '2099-01-01T00:00:00.000Z',
      record: null,
    };
    const applied = useClientStore.getState().mergeRemote([change]);
    expect(applied).toEqual([c.id]);
    expect(useClientStore.getState().clients).toHaveLength(0);
  });
});

describe('appointment store sync — device-local fields preserved on merge', () => {
  it('keeps reminderNotificationId/calendarEventId when remote overwrites the record', () => {
    const a = useAppointmentStore.getState().addAppointment({
      clientId: 'c1',
      serviceId: 's1',
      date: '2026-04-20',
      startTime: '10:00',
      endTime: '11:00',
      status: 'scheduled',
      price: 1000,
      reminderNotificationId: 'notif-1',
      calendarEventId: 'cal-1',
    });

    // Remote версия новее, но БЕЗ device-local полей (они не синкаются).
    const change: RemoteChange<Appointment> = {
      id: a.id,
      updatedAt: '2099-01-01T00:00:00.000Z',
      deletedAt: null,
      record: {
        id: a.id,
        clientId: 'c1',
        serviceId: 's1',
        date: '2026-04-21', // изменилось на сервере
        startTime: '12:00',
        endTime: '13:00',
        status: 'scheduled',
        price: 1500,
        updatedAt: '2099-01-01T00:00:00.000Z',
      },
    };
    useAppointmentStore.getState().mergeRemote([change]);
    const merged = useAppointmentStore.getState().appointments.find((x) => x.id === a.id);
    expect(merged?.date).toBe('2026-04-21'); // remote data применилась
    expect(merged?.reminderNotificationId).toBe('notif-1'); // device-local сохранён
    expect(merged?.calendarEventId).toBe('cal-1');
  });
});
