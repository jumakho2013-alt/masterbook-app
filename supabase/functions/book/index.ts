// Публичная онлайн-запись с сайта-каталога.
//
// Анонимный клиент НЕ может писать в appointments/clients напрямую — RLS пускает
// только владельца (auth.uid() = user_id). Поэтому запись идёт через эту функцию
// на service-role, СО СТРОГОЙ валидацией. Сами правила слота (рабочие дни и
// часы, перерыв, буфер, пауза, закрытые даты, часовой пояс города, пересечения)
// живут в базе — booking_slot_error(): те же, по которым сайт показывает
// свободное время (available_slots). Так форма и запись не могут разойтись.
// Запись попадает к мастеру в приложение обычным синком (updated_at = now()).
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
// Превью-сборки Vercel нашей команды (master-book): masterbook-<hash>-master-book
// и masterbook-app-git-<ветка>-master-book. Без них запись на превью падала с
// «нет связи», и проверить изменения до выкладки было нельзя.
const PREVIEW_ORIGIN = /^https:\/\/masterbook-(?:[a-z0-9]{9}|app-git-[a-z0-9-]+)-master-book\.vercel\.app$/;

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGINS.has(origin) || PREVIEW_ORIGIN.test(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : DEFAULT_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

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

// Коды booking_slot_error → HTTP-статус. Неверный ввод — 400, «нельзя в это
// время» — 409 (сайт покажет причину и предложит другое время).
const BAD_INPUT = new Set(['date_invalid', 'time_invalid', 'date_past', 'date_far']);

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

  const now = new Date();

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // --- мастер должен быть опубликован ---
  let mq = admin
    .from('profiles')
    .select('id')
    .eq('published', true);
  mq = slug ? mq.eq('slug', slug) : mq.eq('id', masterId);
  const { data: master, error: mErr } = await mq.maybeSingle();
  if (mErr) return json({ error: 'lookup_failed' }, 500, req);
  if (!master) return json({ error: 'master_not_found' }, 404, req);

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
  const endTime = fromMin(endMin);

  // --- предпроверка слота (до создания клиента, чтобы не плодить «пустых»
  //     клиентов на заведомо отклонённых заявках). Окончательно — под локом
  //     в book_appointment_v2.
  const { data: slotErr, error: sErr } = await admin.rpc('booking_slot_error', {
    p_master_id: master.id,
    p_date: date,
    p_start: startMin,
    p_duration: duration,
  });
  if (sErr) return json({ error: 'lookup_failed' }, 500, req);
  if (slotErr) return json({ error: slotErr }, BAD_INPUT.has(slotErr) ? 400 : 409, req);

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
  // Пересечение слотов проверяется атомарно в book_appointment_v2 (под advisory-
  // локом), чтобы не было гонки между проверкой и вставкой.

  const nowIso = now.toISOString();

  // --- клиент: findOrCreate по user_id + цифрам телефона (индекс
  //     idx_clients_user_phone; раньше грузили всю базу клиентов мастера).
  let clientId: string | null = null;
  const { data: existing } = await admin
    .from('clients')
    .select('id')
    .eq('user_id', master.id)
    .eq('phone_digits', phoneDigits)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();
  if (existing) {
    clientId = existing.id;
    // Один номер не может завалить календарь мастера: не больше 3 заявок
    // с сайта за сутки.
    const { count: recent, error: rErr } = await admin
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', master.id)
      .eq('client_id', existing.id)
      .like('id', 'web-%')
      .neq('status', 'cancelled')
      .gte('created_at', new Date(now.getTime() - 86_400_000).toISOString());
    if (rErr) return json({ error: 'lookup_failed' }, 500, req);
    if ((recent ?? 0) >= 3) return json({ error: 'too_many' }, 429, req);
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
  // Атомарно: те же правила + пересечение с буфером + вставка под advisory-локом.
  const { data: bookRes, error: aErr } = await admin.rpc('book_appointment_v2', {
    p_id: apptId,
    p_user_id: master.id,
    p_client_id: clientId,
    p_service_id: svcId,
    p_date: date,
    p_start_time: startTime,
    p_duration: duration,
    p_price: price,
    p_notes: notes,
    p_now: nowIso,
  });
  if (aErr) return json({ error: 'booking_failed' }, 500, req);
  if (bookRes !== 'ok') {
    return json({ error: bookRes ?? 'booking_failed' }, BAD_INPUT.has(bookRes) ? 400 : 409, req);
  }

  return json({ ok: true, date, start_time: startTime, end_time: endTime, service: serviceName }, 200, req);
});
