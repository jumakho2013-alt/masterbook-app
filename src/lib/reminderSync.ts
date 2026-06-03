import * as Notifications from 'expo-notifications';
import {
  getNotificationPermissionStatus,
  scheduleAppointmentReminder,
  scheduleDailyClientReminderPrompt,
  cancelDailyClientReminderPrompt,
} from '@/src/lib/notifications';
import { captureException } from '@/src/lib/crashReporter';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

/** За сколько минут до записи напоминаем (совпадает с appointment/new.tsx). */
const REMINDER_MINUTES_BEFORE = 60;

/**
 * Перепланировать пропущенные напоминания при запуске приложения.
 *
 * Проблема (минус №8): на Android запланированные локальные уведомления могут
 * пропасть после перезагрузки телефона или принудительного закрытия. При этом
 * appointment.reminderNotificationId остаётся со «протухшим» id. Поэтому опираться
 * на сам id нельзя — спрашиваем у системы, какие напоминания реально стоят, и
 * до-планируем недостающие для будущих записей.
 *
 * Идемпотентно: если напоминание уже стоит — пропускаем (по appointmentId в
 * payload). reminderNotificationId пишем «тихо» (setReminderId, без updatedAt) —
 * это device-local поле, не данные.
 */
export async function rescheduleMissingReminders(): Promise<void> {
  try {
    const status = await getNotificationPermissionStatus();
    if (status !== 'granted') return;

    // Самовосстановление ежедневного «разошли напоминания клиентам»: ставим
    // если включено в настройках, снимаем если выключено (idempotent).
    if (useSettingsStore.getState().autoClientReminders) {
      await scheduleDailyClientReminderPrompt();
    } else {
      await cancelDailyClientReminderPrompt();
    }

    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const haveReminderFor = new Set<string>();
    for (const n of existing) {
      const data = n.content?.data as { type?: string; appointmentId?: string } | undefined;
      if (data?.type === 'appointment_reminder' && data.appointmentId) {
        haveReminderFor.add(String(data.appointmentId));
      }
    }

    const nowMs = Date.now();
    const appts = useAppointmentStore.getState().appointments;
    const clients = useClientStore.getState().clients;
    const services = useServiceStore.getState().services;

    for (const a of appts) {
      if (a.status !== 'scheduled') continue;
      if (haveReminderFor.has(a.id)) continue;

      const [y, mo, d] = a.date.split('-').map(Number);
      const [hh, mm] = a.startTime.split(':').map(Number);
      if ([y, mo, d, hh, mm].some(Number.isNaN)) continue;
      const fireMs = new Date(y, mo - 1, d, hh, mm).getTime() - REMINDER_MINUTES_BEFORE * 60_000;
      if (fireMs <= nowMs) continue; // время напоминания уже прошло

      const client = clients.find((c) => c.id === a.clientId);
      const service = services.find((s) => s.id === a.serviceId);
      const notifId = await scheduleAppointmentReminder(
        a.id,
        client?.name ?? 'Клиент',
        service?.name ?? 'Услуга',
        a.date,
        a.startTime,
        REMINDER_MINUTES_BEFORE,
      );
      if (notifId) {
        useAppointmentStore.getState().setReminderId(a.id, notifId);
      }
    }
  } catch (err) {
    captureException(err, { tag: 'reminderSync.reschedule' });
  }
}
