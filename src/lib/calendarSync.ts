/**
 * Calendar sync — синхронизация записей MasterBook в системный календарь
 * (iOS Calendar / Google Calendar).
 *
 * Зачем: мастер видит свои записи везде где открывает календарь — в iPhone
 * Calendar, на Apple Watch, в Google Calendar на компьютере. Это самый
 * sticky habit-forming эффект — MasterBook становится частью ежедневного
 * ритуала.
 *
 * Архитектура:
 *   • При создании записи → createEvent → сохраняем eventId в
 *     appointment.calendarEventId (новое поле в типе)
 *   • При обновлении → updateEvent по сохранённому eventId
 *   • При удалении / отмене → deleteEvent
 *   • Отдельный «MasterBook» календарь системы — все наши события туда.
 *     Юзер может скрыть его в системных настройках, не теряя данные.
 *
 * Permission UX: спрашиваем только когда юзер впервые включил sync в settings.
 * До этого — sync неактивен, операции no-op.
 *
 * Безопасно вызывается из любого места — если permission denied, разрешения
 * нет или sync отключён в настройках — функции тихо возвращают null.
 */

import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { captureException } from '@/src/lib/crashReporter';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import type { Appointment } from '@/src/types';

const MB_CALENDAR_TITLE = 'MasterBook';
const MB_CALENDAR_COLOR = '#7C5DFA';

/** Cached id of our calendar — чтобы не делать getCalendars при каждой операции. */
let cachedCalendarId: string | null = null;

/** Полный запрос разрешения. Возвращает true если разрешено и mb-календарь
 *  существует/создан. UI должен вызывать это явно когда юзер тапает toggle. */
export async function requestCalendarSync(): Promise<boolean> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') return false;

    // На Android для записи событий нужно дополнительное разрешение reminders/events.
    if (Platform.OS === 'android') {
      const rem = await Calendar.requestRemindersPermissionsAsync();
      if (rem.status !== 'granted') {
        // На некоторых устройствах reminders нет — это не блокер.
      }
    }

    const id = await ensureMasterBookCalendar();
    return id !== null;
  } catch (err) {
    captureException(err, { tag: 'calendarSync.request' });
    return false;
  }
}

/** Находит/создаёт MasterBook-календарь и возвращает его id. */
async function ensureMasterBookCalendar(): Promise<string | null> {
  if (cachedCalendarId) return cachedCalendarId;
  try {
    const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const existing = cals.find((c) => c.title === MB_CALENDAR_TITLE);
    if (existing) {
      cachedCalendarId = existing.id;
      return existing.id;
    }

    // Создаём новый. На iOS нужен defaultCalendarSource; на Android — accountName.
    let source: Calendar.Source | undefined;
    if (Platform.OS === 'ios') {
      const defaultCal = await Calendar.getDefaultCalendarAsync();
      source = defaultCal.source;
    } else {
      // Android — берём первый writable source (обычно Google).
      const writable = cals.find((c) => c.allowsModifications);
      if (writable?.source) source = writable.source;
    }
    if (!source) return null;

    const newId = await Calendar.createCalendarAsync({
      title: MB_CALENDAR_TITLE,
      color: MB_CALENDAR_COLOR,
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: Platform.OS === 'ios' ? source.id : undefined,
      source: Platform.OS === 'android' ? source : undefined,
      name: 'masterbook',
      ownerAccount: source.name,
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    cachedCalendarId = newId;
    return newId;
  } catch (err) {
    captureException(err, { tag: 'calendarSync.ensureCalendar' });
    return null;
  }
}

/** Гет sync включён ли в настройках. */
function syncEnabled(): boolean {
  return !!useSettingsStore.getState().calendarSyncEnabled;
}

/** Парсит YYYY-MM-DD + HH:MM в Date. */
function parseDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

/** Создать событие в системном календаре. Возвращает eventId или null. */
export async function syncCreateEvent(
  appt: Appointment,
  clientName: string,
  serviceName: string,
): Promise<string | null> {
  if (!syncEnabled()) return null;
  try {
    const calId = await ensureMasterBookCalendar();
    if (!calId) return null;

    const start = parseDateTime(appt.date, appt.startTime);
    const end = parseDateTime(appt.date, appt.endTime);

    const eventId = await Calendar.createEventAsync(calId, {
      title: `${clientName} — ${serviceName}`,
      startDate: start,
      endDate: end,
      notes: appt.notes,
      location: appt.address,
      alarms: [{ relativeOffset: -60 }], // напоминание за час
    });
    return eventId;
  } catch (err) {
    captureException(err, { tag: 'calendarSync.create' });
    return null;
  }
}

/** Обновить существующее событие. */
export async function syncUpdateEvent(
  eventId: string,
  appt: Appointment,
  clientName: string,
  serviceName: string,
): Promise<void> {
  if (!syncEnabled()) return;
  try {
    const start = parseDateTime(appt.date, appt.startTime);
    const end = parseDateTime(appt.date, appt.endTime);
    await Calendar.updateEventAsync(eventId, {
      title: `${clientName} — ${serviceName}`,
      startDate: start,
      endDate: end,
      notes: appt.notes,
      location: appt.address,
    });
  } catch (err) {
    captureException(err, { tag: 'calendarSync.update' });
  }
}

/** Удалить событие. Безопасно при двойном вызове — pass-через на missing id. */
export async function syncDeleteEvent(eventId: string): Promise<void> {
  if (!syncEnabled()) return;
  try {
    await Calendar.deleteEventAsync(eventId);
  } catch (err) {
    captureException(err, { tag: 'calendarSync.delete' });
  }
}

/** Полное отключение sync — НЕ удаляем существующие события в системе
 *  (пусть юзер сам удалит календарь если хочет), но прекращаем sync. */
export function disableCalendarSync() {
  useSettingsStore.getState().setCalendarSyncEnabled(false);
  cachedCalendarId = null;
}
