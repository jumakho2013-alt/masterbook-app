// Чистая часть уведомлений о записях с сайта — без нативных модулей, чтобы
// её можно было звать из синка и покрыть тестами. Отправка — webBookingAlert.ts.

export type WebBooking = {
  id: string;
  date: string;
  time: string;
  name: string;
  service: string;
};

/** Не напоминаем о старых: при полной выгрузке на новом телефоне иначе
 *  посыпались бы уведомления за все прошлые недели. */
const FRESH_MS = 3 * 86_400_000;

function noteField(notes: string, label: string): string {
  const m = new RegExp(`^${label}:\\s*(.+)$`, 'm').exec(notes);
  return m ? m[1].trim() : '';
}

/**
 * Новые записи с сайта среди выгруженных строк: id `web-…`, активные, созданы
 * недавно и ещё неизвестны телефону. Чистая функция — покрыта тестами.
 */
export function findNewWebBookings(
  rows: ReadonlyArray<Record<string, unknown>>,
  knownIds: ReadonlySet<string>,
  nowMs: number,
): WebBooking[] {
  const out: WebBooking[] = [];
  for (const r of rows) {
    const id = String(r.id ?? '');
    if (!id.startsWith('web-') || knownIds.has(id)) continue;
    if (r.deleted_at || r.status !== 'scheduled') continue;
    const created = Date.parse(String(r.created_at ?? ''));
    if (!Number.isFinite(created) || nowMs - created > FRESH_MS) continue;
    const notes = String(r.notes ?? '');
    out.push({
      id,
      date: String(r.date ?? ''),
      time: String(r.start_time ?? ''),
      name: noteField(notes, 'Клиент'),
      service: noteField(notes, 'Услуга'),
    });
  }
  return out;
}
