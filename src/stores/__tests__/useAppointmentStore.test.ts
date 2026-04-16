// Mock-и native-зависимостей — jest работает в node, где нет AsyncStorage
// и нотификаций. Мокаем ДО импорта стора, иначе Zustand persist зачитает
// реальный AsyncStorage и упадёт.

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

// Капчурим вызовы cancelNotification — это то, что должно происходить
// при смене статуса и удалении записи.
const cancelNotificationMock = jest.fn(async (_id: string) => undefined);
jest.mock('@/src/lib/notifications', () => ({
  cancelNotification: (id: string) => cancelNotificationMock(id),
  // Остальные экспорты модуля не используются в сторе.
  scheduleAppointmentReminder: jest.fn(),
  scheduleMorningReminder: jest.fn(),
  cancelAllNotifications: jest.fn(),
  registerForPushNotifications: jest.fn(),
}));

import { useAppointmentStore } from '../useAppointmentStore';

function reset() {
  useAppointmentStore.setState({ appointments: [] });
  cancelNotificationMock.mockClear();
}

const baseData = {
  clientId: 'c1',
  serviceId: 's1',
  date: '2026-04-20',
  startTime: '10:00',
  endTime: '11:00',
  status: 'scheduled' as const,
  price: 2500,
  reminderNotificationId: 'notif-123',
};

describe('useAppointmentStore', () => {
  beforeEach(reset);

  it('addAppointment assigns id and prepends to list', () => {
    const a = useAppointmentStore.getState().addAppointment(baseData);
    expect(a.id).toMatch(/^\S+/);
    expect(useAppointmentStore.getState().appointments[0]).toEqual(a);
  });

  describe('setStatus', () => {
    it('cancels pending reminder when moving away from "scheduled"', async () => {
      const a = useAppointmentStore.getState().addAppointment(baseData);
      useAppointmentStore.getState().setStatus(a.id, 'completed');
      // cancelNotification вызван с тем reminderNotificationId, который
      // мы заводили. Сам cancel — fire-and-forget внутри стора.
      expect(cancelNotificationMock).toHaveBeenCalledTimes(1);
      expect(cancelNotificationMock).toHaveBeenCalledWith('notif-123');
    });

    it('clears reminderNotificationId on non-scheduled transitions', () => {
      const a = useAppointmentStore.getState().addAppointment(baseData);
      useAppointmentStore.getState().setStatus(a.id, 'cancelled');
      const updated = useAppointmentStore.getState().appointments.find((x) => x.id === a.id);
      expect(updated?.reminderNotificationId).toBeUndefined();
      expect(updated?.status).toBe('cancelled');
    });

    it('preserves reminderNotificationId if appointment stays scheduled', () => {
      const a = useAppointmentStore.getState().addAppointment(baseData);
      useAppointmentStore.getState().setStatus(a.id, 'scheduled');
      const updated = useAppointmentStore.getState().appointments.find((x) => x.id === a.id);
      expect(updated?.reminderNotificationId).toBe('notif-123');
      // Если остаёмся в scheduled — cancel не должен вызываться.
      expect(cancelNotificationMock).not.toHaveBeenCalled();
    });

    it('handles missing reminderNotificationId gracefully', () => {
      const a = useAppointmentStore.getState().addAppointment({
        ...baseData,
        reminderNotificationId: undefined,
      });
      useAppointmentStore.getState().setStatus(a.id, 'completed');
      // Если id не было — cancel НЕ вызывается (нечего отменять).
      expect(cancelNotificationMock).not.toHaveBeenCalled();
    });
  });

  describe('deleteAppointment', () => {
    it('removes appointment and cancels reminder', () => {
      const a = useAppointmentStore.getState().addAppointment(baseData);
      useAppointmentStore.getState().deleteAppointment(a.id);
      expect(useAppointmentStore.getState().appointments).toHaveLength(0);
      expect(cancelNotificationMock).toHaveBeenCalledWith('notif-123');
    });

    it('is a no-op for unknown id', () => {
      useAppointmentStore.getState().addAppointment(baseData);
      useAppointmentStore.getState().deleteAppointment('ghost');
      expect(useAppointmentStore.getState().appointments).toHaveLength(1);
      expect(cancelNotificationMock).not.toHaveBeenCalled();
    });
  });

  describe('getByDate / getByClient', () => {
    it('getByDate returns appointments on that date, sorted by startTime', () => {
      const store = useAppointmentStore.getState();
      store.addAppointment({ ...baseData, startTime: '14:00', endTime: '15:00' });
      store.addAppointment({ ...baseData, startTime: '09:00', endTime: '10:00' });
      store.addAppointment({ ...baseData, date: '2026-04-21', startTime: '11:00', endTime: '12:00' });

      const result = useAppointmentStore.getState().getByDate('2026-04-20');
      expect(result).toHaveLength(2);
      expect(result[0].startTime).toBe('09:00');
      expect(result[1].startTime).toBe('14:00');
    });

    it('getByClient returns appointments for client, sorted by date desc', () => {
      const store = useAppointmentStore.getState();
      store.addAppointment({ ...baseData, date: '2026-04-20' });
      store.addAppointment({ ...baseData, date: '2026-04-25' });
      store.addAppointment({ ...baseData, clientId: 'other', date: '2026-04-30' });

      const result = useAppointmentStore.getState().getByClient('c1');
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-04-25');
      expect(result[1].date).toBe('2026-04-20');
    });
  });
});
