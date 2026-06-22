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

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  const slug = str(body.slug);
  const masterId = str(body.master_id);
  const serviceId = str(body.service_id);
  const date = str(body.date);
  const startTime = str(body.start_time);
  const name = str(body.name).slice(0, 80);
  const phoneRaw = str(body.phone).slice(0, 32);
  const comment = str(body.comment).slice(0, 500);

  // --- базовая валидация входа ---
  if (!slug && !masterId) return json({ error: 'master_required' }, 400);
  if (name.length < 2) return json({ error: 'name_required' }, 400);
  const phoneDigits = phoneRaw.replace(/\D/g, '');
  if (phoneDigits.length < 7) return json({ error: 'phone_invalid' }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'date_invalid' }, 400);
  const startMin = toMin(startTime);
  if (startMin == null) return json({ error: 'time_invalid' }, 400);

  const [yy, mm, dd] = date.split('-').map(Number);
  const bookDateUTC = Date.UTC(yy, mm - 1, dd);
  if (Number.isNaN(bookDateUTC)) return json({ error: 'date_invalid' }, 400);
  // сверяем календарные даты в UTC, чтобы не словить сдвиг на ±1 день
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (bookDateUTC < todayUTC) return json({ error: 'date_past' }, 400);
  if (bookDateUTC > todayUTC + 366 * DAY_MS) return json({ error: 'date_far' }, 400);
  const dow = new Date(bookDateUTC).getUTCDay(); // 0=Вс..6=Сб — как work_days в приложении

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // --- мастер должен быть опубликован ---
  let mq = admin
    .from('profiles')
    .select('id, work_days, work_hours_start, work_hours_end')
    .eq('published', true);
  mq = slug ? mq.eq('slug', slug) : mq.eq('id', masterId);
  const { data: master, error: mErr } = await mq.maybeSingle();
  if (mErr) return json({ error: 'lookup_failed' }, 500);
  if (!master) return json({ error: 'master_not_found' }, 404);

  // --- рабочий день (если задан) ---
  if (Array.isArray(master.work_days) && master.work_days.length > 0 && !master.work_days.includes(dow)) {
    return json({ error: 'day_off' }, 409);
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
    if (!svc) return json({ error: 'service_not_found' }, 400);
    svcId = svc.id;
    duration = svc.duration && svc.duration > 0 ? svc.duration : 60;
    price = svc.price ?? 0;
    serviceName = svc.name;
  }

  const endMin = startMin + duration;
  if (endMin > 24 * 60) return json({ error: 'time_invalid' }, 400);
  const whStart = toMin(master.work_hours_start);
  const whEnd = toMin(master.work_hours_end);
  if (whStart != null && startMin < whStart) return json({ error: 'before_hours' }, 409);
  if (whEnd != null && endMin > whEnd) return json({ error: 'after_hours' }, 409);
  const endTime = fromMin(endMin);

  // --- проверка пересечения слотов (активные записи в этот день) ---
  const { data: dayAppts, error: dErr } = await admin
    .from('appointments')
    .select('start_time, end_time')
    .eq('user_id', master.id)
    .eq('date', date)
    .is('deleted_at', null)
    .neq('status', 'cancelled');
  if (dErr) return json({ error: 'lookup_failed' }, 500);
  for (const a of dayAppts ?? []) {
    const aS = toMin(a.start_time);
    const aE = toMin(a.end_time);
    if (aS == null || aE == null) continue;
    if (startMin < aE && aS < endMin) return json({ error: 'slot_taken' }, 409);
  }

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
    if (cErr) return json({ error: 'client_create_failed' }, 500);
    clientId = newClientId;
  }

  // --- запись ---
  const apptId = `web-${crypto.randomUUID()}`;
  const notes =
    `🌐 Онлайн-запись с сайта\nКлиент: ${name}\nТелефон: ${phoneRaw}\nУслуга: ${serviceName}` +
    (comment ? `\nКомментарий: ${comment}` : '');
  const { error: aErr } = await admin.from('appointments').insert({
    id: apptId,
    user_id: master.id,
    client_id: clientId,
    service_id: svcId,
    date,
    start_time: startTime,
    end_time: endTime,
    status: 'scheduled',
    price,
    notes,
    created_at: nowIso,
    updated_at: nowIso,
  });
  if (aErr) return json({ error: 'booking_failed' }, 500);

  return json({ ok: true, date, start_time: startTime, end_time: endTime, service: serviceName });
});
