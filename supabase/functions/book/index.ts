// Публичная онлайн-запись с сайта-каталога.
//
// Анонимный клиент НЕ может писать в appointments/clients напрямую — RLS пускает
// только владельца (auth.uid() = user_id). Поэтому запись идёт через эту функцию
// на service-role, СО СТРОГОЙ валидацией: проверяем published-мастера, его услугу,
// рабочие день/часы, пересечение слотов. Запись попадает к мастеру в приложение
// обычным синком (выставляем updated_at = now()).
//
// Деплой: verify_jwt оставлен включённым — фронт шлёт публичный anon-ключ как
// Bearer + apikey (он уже есть в браузере). Это отсекает совсем «голые» хиты без
// ключа проекта, но не требует входа клиента.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Запись зовёт только наш сайт. Открытый '*' позволял любому стороннему сайту
// слать брони из браузеров своих посетителей (с их IP) — это заранее обнуляло
// бы любой IP-лимит и убирало трение для распределённого спама.
const ALLOWED_ORIGINS = new Set([
  'https://masterbook-app.vercel.app',
  'https://masterbook.tj',
  'https://www.masterbook.tj',
]);
const DEFAULT_ORIGIN = 'https://masterbook-app.vercel.app';

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

// Рынок — UTC+5 (Душанбе); сайт уже считает день недели по этому же смещению.
const TZ_OFFSET_MIN = 5 * 60;

/** Однострочное поле: переводы строк позволяли подделать «Услуга/Цена» в notes. */
function oneLine(v: string): string {
  return v.replace(/[\r\n]+/g, ' ').trim();
}

function json(body: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...(req ? corsFor(req) : { 'Access-Control-Allow-Origin': DEFAULT_ORIGIN }),
      'Content-Type': 'application/json',
    },
  });
}

/** 'HH:MM' → минуты с начала суток, либо null если формат неверный. */
function toMin(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

function fromMin(n: number): string {
  const h = Math.floor(n / 60);
  const mi = n % 60;
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

const DAY_MS = 86_400_000;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsFor(req) });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, req);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400, req);
  }

  const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  const slug = str(body.slug);
  const masterId = str(body.master_id);
  const serviceId = str(body.service_id);
  const date = str(body.date);
  const startTime = str(body.start_time);
  const name = oneLine(str(body.name)).slice(0, 80);
  const phoneRaw = oneLine(str(body.phone)).slice(0, 32);
  const comment = oneLine(str(body.comment)).slice(0, 500);

  // --- базовая валидация входа ---
  if (!slug && !masterId) return json({ error: 'master_required' }, 400, req);
  if (name.length < 2) return json({ error: 'name_required' }, 400, req);
  const phoneDigits = phoneRaw.replace(/\D/g, '');
  if (phoneDigits.length < 7) return json({ error: 'phone_invalid' }, 400, req);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'date_invalid' }, 400, req);
  const startMin = toMin(startTime);
  if (startMin == null) return json({ error: 'time_invalid' }, 400, req);

  const [yy, mm, dd] = date.split('-').map(Number);
  const bookDateUTC = Date.UTC(yy, mm - 1, dd);
  if (Number.isNaN(bookDateUTC)) return json({ error: 'date_invalid' }, 400, req);
  // сверяем календарные даты в UTC, чтобы не словить сдвиг на ±1 день
  const now = new Date();
  // Сравниваем по локальному времени рынка, а не по UTC: иначе в вечерние часы
  // «сегодня» у клиента и у сервера — разные календарные дни.
  const nowLocal = new Date(now.getTime() + TZ_OFFSET_MIN * 60_000);
  const todayLocalMs = Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate());
  if (bookDateUTC < todayLocalMs) return json({ error: 'date_past' }, 400, req);
  if (bookDateUTC > todayLocalMs + 366 * DAY_MS) return json({ error: 'date_far' }, 400, req);
  // Раньше проверялась только дата: в 18:00 можно было записаться на «сегодня 09:00».
  if (bookDateUTC === todayLocalMs) {
    const nowMin = nowLocal.getUTCHours() * 60 + nowLocal.getUTCMinutes();
    if (startMin < nowMin) return json({ error: 'time_past' }, 409, req);
  }
  const dow = new Date(bookDateUTC).getUTCDay(); // 0=Вс..6=Сб — как work_days в приложении

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // --- мастер должен быть опубликован ---
  let mq = admin
    .from('profiles')
    .select('id, work_days, work_hours_start, work_hours_end, break_enabled, break_start, break_end')
    .eq('published', true);
  mq = slug ? mq.eq('slug', slug) : mq.eq('id', masterId);
  const { data: master, error: mErr } = await mq.maybeSingle();
  if (mErr) return json({ error: 'lookup_failed' }, 500, req);
  if (!master) return json({ error: 'master_not_found' }, 404, req);

  // --- рабочий день (если задан) ---
  if (Array.isArray(master.work_days) && master.work_days.length > 0 && !master.work_days.includes(dow)) {
    return json({ error: 'day_off' }, 409, req);
  }

  // --- услуга (опционально): берём длительность и цену ---
  let duration = 60;
  let price = 0;
  let serviceName = 'Запись с сайта';
  let svcId: string | null = null;
  if (serviceId) {
    const { data: svc } = await admin
      .from('services')
      .select('id, name, price, duration')
      .eq('id', serviceId)
      .eq('user_id', master.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!svc) return json({ error: 'service_not_found' }, 400, req);
    svcId = svc.id;
    duration = svc.duration && svc.duration > 0 ? svc.duration : 60;
    price = svc.price ?? 0;
    serviceName = svc.name;
  }

  const endMin = startMin + duration;
  if (endMin > 24 * 60) return json({ error: 'time_invalid' }, 400, req);
  const whStart = toMin(master.work_hours_start);
  const whEnd = toMin(master.work_hours_end);
  if (whStart != null && startMin < whStart) return json({ error: 'before_hours' }, 409, req);
  if (whEnd != null && endMin > whEnd) return json({ error: 'after_hours' }, 409, req);

  // Перерыв мастера: раньше не проверялся вообще (поля даже не синкались),
  // и клиент с сайта спокойно записывался прямо в обед.
  if (master.break_enabled) {
    const bStart = toMin(master.break_start);
    const bEnd = toMin(master.break_end);
    if (bStart != null && bEnd != null && bEnd > bStart && startMin < bEnd && bStart < endMin) {
      return json({ error: 'break_time' }, 409, req);
    }
  }

  const endTime = fromMin(endMin);

  // --- анти-абуз: не даём боту флудить календарь мастера за один день ---
  const { count: dayCount, error: dErr } = await admin
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', master.id)
    .eq('date', date)
    .is('deleted_at', null)
    .neq('status', 'cancelled');
  if (dErr) return json({ error: 'lookup_failed' }, 500, req);
  if ((dayCount ?? 0) >= 40) return json({ error: 'day_full' }, 429, req);
  // Пересечение слотов проверяется атомарно в book_appointment (под advisory-
  // локом), чтобы не было гонки между проверкой и вставкой.

  const nowIso = now.toISOString();

  // --- клиент: findOrCreate по user_id + цифрам телефона ---
  let clientId: string | null = null;
  const { data: clients } = await admin
    .from('clients')
    .select('id, phone')
    .eq('user_id', master.id)
    .is('deleted_at', null);
  const existing = (clients ?? []).find(
    (c: { phone: string | null }) => (c.phone ?? '').replace(/\D/g, '') === phoneDigits,
  );
  if (existing) {
    clientId = existing.id;
  } else {
    const newClientId = `web-${crypto.randomUUID()}`;
    const { error: cErr } = await admin.from('clients').insert({
      id: newClientId,
      user_id: master.id,
      name,
      phone: phoneRaw,
      notes: 'Добавлен через онлайн-запись с сайта',
      created_at: nowIso,
      updated_at: nowIso,
    });
    if (cErr) return json({ error: 'client_create_failed' }, 500, req);
    clientId = newClientId;
  }

  // --- запись ---
  const apptId = `web-${crypto.randomUUID()}`;
  const notes =
    `🌐 Онлайн-запись с сайта\nКлиент: ${name}\nТелефон: ${phoneRaw}\nУслуга: ${serviceName}` +
    (comment ? `\nКомментарий: ${comment}` : '');
  // Атомарно: повторная проверка пересечения + вставка под advisory-локом.
  const { data: bookRes, error: aErr } = await admin.rpc('book_appointment', {
    p_id: apptId,
    p_user_id: master.id,
    p_client_id: clientId,
    p_service_id: svcId,
    p_date: date,
    p_start_time: startTime,
    p_end_time: endTime,
    p_price: price,
    p_notes: notes,
    p_now: nowIso,
  });
  if (aErr) return json({ error: 'booking_failed' }, 500, req);
  if (bookRes === 'slot_taken') return json({ error: 'slot_taken' }, 409, req);

  return json({ ok: true, date, start_time: startTime, end_time: endTime, service: serviceName }, 200, req);
});
