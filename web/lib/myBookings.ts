// «Мои записи» клиента — в его же браузере. Аккаунта у клиента нет (запись
// без регистрации), поэтому секрет для отмены, выданный сервером при записи,
// храним локально: вернувшись на страницу мастера, клиент видит свою запись
// и может её отменить. Раньше отменить запись с сайта было нельзя никак.

export type MyBooking = {
  id: string;
  token: string;
  slug: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  service: string;
};

const KEY = 'mb-my-bookings';
const MAX = 30;

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readAll(): MyBooking[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as MyBooking[]) : [];
    return Array.isArray(list) ? list.filter((b) => b && b.id && b.token && b.date) : [];
  } catch {
    return [];
  }
}

function writeAll(list: MyBooking[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch {
    // приватный режим / переполнение — просто не запомним
  }
}

/** Предстоящие записи у этого мастера (прошедшие тихо выбрасываем). */
export function upcomingBookings(slug: string): MyBooking[] {
  const today = todayYmd();
  const all = readAll();
  const fresh = all.filter((b) => b.date >= today);
  if (fresh.length !== all.length) writeAll(fresh);
  return fresh.filter((b) => b.slug === slug).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export function rememberBooking(b: MyBooking) {
  writeAll([...readAll().filter((x) => x.id !== b.id), b]);
}

export function forgetBooking(id: string) {
  writeAll(readAll().filter((b) => b.id !== id));
}

export type CancelResult = 'ok' | 'too_late' | 'not_found' | 'error';

export async function cancelBooking(b: MyBooking): Promise<CancelResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return 'error';
  try {
    const res = await fetch(`${url}/functions/v1/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anon}`, apikey: anon },
      body: JSON.stringify({ action: 'cancel', id: b.id, token: b.token }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) return 'ok';
    if (data?.error === 'too_late') return 'too_late';
    if (data?.error === 'not_found' || data?.error === 'not_cancellable') return 'not_found';
    return 'error';
  } catch {
    return 'error';
  }
}
