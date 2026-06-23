import { Linking, Platform } from 'react-native';
import type { Client, Appointment } from '@/src/types';

/**
 * Sleeping clients — клиенты что не приходили N дней.
 * Это первая proxy-фича для AI idle-slot nudge из PLAN-V2.md §6.4.
 *
 * Логика:
 *   • completed appointment c самой свежей датой в прошлом
 *   • разница (сегодня − last_visit) >= threshold (default 60 дней)
 *   • клиенты у которых вообще нет completed appointments → НЕ считаются
 *     спящими (это просто "не заходили", может быть новый клиент без визитов)
 *   • клиент с тегом `problematic` → исключается (мы НЕ напоминаем тем
 *     с кем не хотим работать — это анти-фича-trap)
 *   • клиент с upcoming scheduled appointment → НЕ спящий, исключаем чтобы
 *     не дублировать с предстоящей записью
 *
 * Сортировка: дольше всего не приходил — выше. Это интуитивно правильный
 * порядок «кому давно пора написать первым».
 */

export interface SleepingClient {
  client: Client;
  lastVisitDate: string; // YYYY-MM-DD
  daysSince: number;
  /** Имя услуги последнего визита — для контекстуального draft-текста
   *  («Прошло 65 дней с маникюра — записываемся?»). Может быть undefined
   *  если service удалили. */
  lastServiceName?: string;
}

export const DEFAULT_SLEEPING_THRESHOLD_DAYS = 45;

/** Чистая функция — легко тестируется. Сторы передаём явно. */
export function findSleepingClients(args: {
  clients: Client[];
  appointments: Appointment[];
  todayKey: string; // YYYY-MM-DD
  thresholdDays?: number;
  serviceNameById?: (serviceId: string) => string | undefined;
}): SleepingClient[] {
  const { clients, appointments, todayKey, thresholdDays = DEFAULT_SLEEPING_THRESHOLD_DAYS, serviceNameById } = args;

  // Индексы для O(N) вместо O(N²) при больших базах. У среднего соло-мастера
  // 50-200 клиентов и 500-2000 appointments — без индекса getCompletedByClient
  // станет заметно тормозить.
  const completedByClient = new Map<string, Appointment[]>();
  const hasUpcoming = new Set<string>();
  for (const a of appointments) {
    if (a.status === 'completed') {
      const arr = completedByClient.get(a.clientId);
      if (arr) arr.push(a);
      else completedByClient.set(a.clientId, [a]);
    } else if (a.status === 'scheduled' && a.date >= todayKey) {
      hasUpcoming.add(a.clientId);
    }
  }

  const result: SleepingClient[] = [];

  for (const client of clients) {
    if (client.tags?.includes('problematic')) continue;
    if (hasUpcoming.has(client.id)) continue;
    const completed = completedByClient.get(client.id);
    if (!completed || completed.length === 0) continue;

    // Самый свежий completed — берём date по lexicographic compare
    // (YYYY-MM-DD это safe).
    let last = completed[0];
    for (const a of completed) {
      if (a.date > last.date) last = a;
    }

    const days = daysBetweenIsoDates(last.date, todayKey);
    if (days < thresholdDays) continue;

    result.push({
      client,
      lastVisitDate: last.date,
      daysSince: days,
      lastServiceName: serviceNameById?.(last.serviceId),
    });
  }

  // По убыванию daysSince — кто дольше не приходил, тот наверху списка.
  result.sort((a, b) => b.daysSince - a.daysSince);
  return result;
}

/** YYYY-MM-DD diff в днях. Не используем Date.now() (запрещён в скриптах
 *  workflow + тесты должны быть детерминированы): только распарсенные строки. */
export function daysBetweenIsoDates(fromYmd: string, toYmd: string): number {
  const [fy, fm, fd] = fromYmd.split('-').map(Number);
  const [ty, tm, td] = toYmd.split('-').map(Number);
  const a = Date.UTC(fy, (fm ?? 1) - 1, fd ?? 1);
  const b = Date.UTC(ty, (tm ?? 1) - 1, td ?? 1);
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
}

// ---------------------------------------------------------------------------
// Сообщения-черновики и open-helpers для WhatsApp / Telegram / SMS.
// ---------------------------------------------------------------------------

export interface DraftMessageContext {
  clientName: string;
  daysSince: number;
  lastServiceName?: string;
  masterName?: string;
}

/** Возвращает несколько вариантов черновика — мастер выберет самый подходящий
 *  по тону. Намеренно НЕ агрессивно («хочешь записаться?», не «приходи
 *  скорее») — preserve trust per PLAN-V2 §1 «без marketplace-вайба». */
export function buildDraftMessages(ctx: DraftMessageContext): string[] {
  const { clientName, daysSince, lastServiceName, masterName } = ctx;
  const firstName = clientName.split(' ')[0] || clientName;
  const sig = masterName ? `\n\n— ${masterName}` : '';
  const serviceFrag = lastServiceName ? ` (${lastServiceName.toLowerCase()})` : '';

  return [
    `${firstName}, привет! Уже ${daysSince} дн. с прошлого визита${serviceFrag} — соскучились по вам 🌸 Если захотите записаться, напишите, подберём удобное время.${sig}`,
    `${firstName}, привет! Давно вас не было${serviceFrag}. На этой неделе есть свободные окна — скиньте удобный день, и я придержу место.${sig}`,
    `${firstName}, привет! Просто напоминаю о себе 🙂 Будет настроение обновиться — напишите, всегда рады вас видеть.${sig}`,
  ];
}

/** Нормализация телефона: только цифры + ведущий "+", если есть.
 *  Для WhatsApp / Telegram нужен международный формат без "+", только цифры. */
export function normalizePhoneForLink(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function phoneForWhatsApp(phone: string): string {
  // wa.me требует digits без "+". Если номер начинается с 8 (РФ) — заменяем на 7.
  let n = normalizePhoneForLink(phone).replace(/^\+/, '');
  if (n.startsWith('8') && n.length === 11) n = '7' + n.slice(1);
  return n;
}

export type OutreachChannel = 'whatsapp' | 'telegram' | 'sms';

/** Открывает внешний messenger с pre-filled текстом.
 *  Возвращает true если URL успешно открыт, false если установлен fallback. */
export async function openOutreach(
  channel: OutreachChannel,
  phone: string,
  message: string,
): Promise<boolean> {
  const text = encodeURIComponent(message);
  const whatsappPhone = phoneForWhatsApp(phone);

  if (channel === 'whatsapp') {
    // Пробуем сначала app-scheme (откроет WhatsApp напрямую), иначе wa.me
    // (тоже открывает app если установлен, fallback на web).
    const appUrl = `whatsapp://send?phone=${whatsappPhone}&text=${text}`;
    const webUrl = `https://wa.me/${whatsappPhone}?text=${text}`;
    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      await Linking.openURL(canOpenApp ? appUrl : webUrl);
      return true;
    } catch {
      try {
        await Linking.openURL(webUrl);
        return true;
      } catch {
        return false;
      }
    }
  }

  if (channel === 'telegram') {
    // Telegram phone-link: tg://resolve?phone=... ИЛИ t.me/+phone — оба
    // открываются официальным клиентом. Внимание: tg не позволяет
    // pre-fill text в чате через URL без webview, поэтому только открываем
    // диалог; мастер вставит текст из буфера (мы скопируем).
    const tgPhone = whatsappPhone; // тот же формат — digits without +
    const appUrl = `tg://resolve?phone=${tgPhone}`;
    const webUrl = `https://t.me/+${tgPhone}`;
    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      await Linking.openURL(canOpenApp ? appUrl : webUrl);
      return true;
    } catch {
      try {
        await Linking.openURL(webUrl);
        return true;
      } catch {
        return false;
      }
    }
  }

  if (channel === 'sms') {
    // sms: URL pre-fill body работает на iOS и большинстве Android.
    // На iOS разделитель параметров — "&body=", на Android иногда "?body=".
    const sep = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${normalizePhoneForLink(phone)}${sep}body=${text}`;
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
