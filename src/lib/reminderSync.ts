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
import { applyLanguage } from '@/src/i18n';
import { Platform } from 'react-native';

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
    // Применяем язык до планирования — тексты уведомлений (t()) должны быть
    // на актуальном языке даже на холодном старте (до первого render useT).
    applyLanguage(useSettingsStore.getState().language);

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

    // iOS хранит максимум 64 запланированных локальных уведомления и молча
    // отбрасывает остальные. Раньше мы шли по ВСЕМ записям в произвольном
    // порядке: у мастера с расписанием на 2-3 месяца вперёд часть напоминаний
    // не ставилась, но id всё равно записывался в стор — приложение считало,
    // что напоминание есть, и не могло его отменить. Плюс 3000 последовательных
    // await через нативный мост подвешивали холодный старт на десятки секунд.
    // Берём только ближайшие по времени и не больше лимита платформы.
    const PENDING_CAP = Platform.OS === 'ios' ? 60 : 200;
    const due = appts
      .filter((a) => a.status === 'scheduled' && !haveReminderFor.has(a.id))
      .map((a) => {
        const [y, mo, d] = a.date.split('-').map(Number);
        const [hh, mm] = a.startTime.split(':').map(Number);
        if ([y, mo, d, hh, mm].some(Number.isNaN)) return null;
        const fireMs = new Date(y, mo - 1, d, hh, mm).getTime() - REMINDER_MINUTES_BEFORE * 60_000;
        return fireMs > nowMs ? { a, fireMs } : null;
      })
      .filter((x): x is { a: (typeof appts)[number]; fireMs: number } => x !== null)
      .sort((x, y) => x.fireMs - y.fireMs)
      .slice(0, PENDING_CAP);

    // Резолвим клиента/услугу через Map — иначе find() внутри цикла даёт O(n*m).
    const clientById = new Map(clients.map((c) => [c.id, c]));
    const serviceById = new Map(services.map((s) => [s.id, s]));
    const scheduled: Array<{ id: string; notifId: string }> = [];

    for (const { a } of due) {
      const client = clientById.get(a.clientId);
      const service = serviceById.get(a.serviceId);
      const notifId = await scheduleAppointmentReminder(
        a.id,
        client?.name ?? 'Клиент',
        service?.name ?? 'Услуга',
        a.date,
        a.startTime,
        REMINDER_MINUTES_BEFORE,
      );
      if (notifId) scheduled.push({ id: a.id, notifId });
    }

    // Один проход записи вместо N: setReminderId на каждую запись гонял
    // сериализацию всего стора столько же раз.
    if (scheduled.length > 0) {
      useAppointmentStore.getState().setReminderIds(scheduled);
    }
  } catch (err) {
    captureException(err, { tag: 'reminderSync.reschedule' });
  }
}
