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

// Коды booking_slot_error/book_web → HTTP-статус. Неверный ввод — 400, «нельзя в это
// время» — 409 (сайт покажет причину и предложит другое время).
const BAD_INPUT = new Set(['date_invalid', 'time_invalid', 'date_past', 'date_far']);

// --- push мастеру о новой записи (Expo push, бесплатно) ---
// Раньше запись с сайта приходила молча: мастер видел её, только открыв
// приложение. Токены регистрирует приложение (register_push_token).
// deno-lint-ignore no-explicit-any
type Admin = any;

async function notifyMaster(admin: Admin, masterId: string, title: string, body: string, apptId: string) {
  try {
    const { data: rows } = await admin.from('push_tokens').select('token').eq('user_id', masterId);
    const tokens: string[] = (rows ?? []).map((r: { token: unknown }) => String(r.token ?? '')).filter(Boolean);
    if (tokens.length === 0) return;
    const messages = tokens.map((to: string) => ({
      to, title, body, sound: 'default', priority: 'high', channelId: 'reminders',
      data: { type: 'web_booking', appointmentId: apptId },
    }));
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    const out = await res.json().catch(() => null) as { data?: Array<{ details?: { error?: string } }> } | null;
    // Удалённое приложение / сменившийся токен — чистим, чтобы не слать в пустоту.
    const dead = (out?.data ?? [])
      .map((r, i) => (r?.details?.error === 'DeviceNotRegistered' ? tokens[i] : null))
      .filter((t): t is string => Boolean(t));
    if (dead.length) await admin.from('push_tokens').delete().in('token', dead);
  } catch (e) {
    console.error('push failed', e);
  }
}

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

  // --- отмена записи самим клиентом (по секретному токену из ответа на запись) ---
  if (body.action === 'cancel') {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: res, error: cxErr } = await admin.rpc('cancel_booking_by_client', {
      p_id: str(body.id).slice(0, 100),
      p_token: str(body.token).slice(0, 100),
    });
    if (cxErr) return json({ error: 'cancel_failed' }, 500, req);
    const r = res as { status: string; user_id?: string; date?: string; start_time?: string };
    if (r.status === 'ok' && r.user_id && r.date) {
      const [, cmo, cdd] = r.date.split('-');
      const push = notifyMaster(admin, r.user_id, 'Клиент отменил запись', `${cdd}.${cmo} в ${r.start_time} — время снова свободно`, str(body.id));
      const rt = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
      if (rt?.waitUntil) rt.waitUntil(push); else await push;
      return json({ ok: true }, 200, req);
    }
    if (r.status === 'already') return json({ ok: true, already: true }, 200, req);
    return json({ error: r.status }, r.status === 'not_found' ? 404 : 409, req);
  }

  const slug = str(body.slug);
  const serviceId = str(body.service_id);
  const date = str(body.date);
  const startTime = str(body.start_time);
  const name = oneLine(str(body.name)).slice(0, 80);
  const phoneRaw = oneLine(str(body.phone)).slice(0, 32);
  const comment = oneLine(str(body.comment)).slice(0, 500);

  // --- базовая валидация входа (быстрый отказ без похода в базу) ---
  if (!slug) return json({ error: 'master_required' }, 400, req);
  if (name.length < 2) return json({ error: 'name_required' }, 400, req);
  if (phoneRaw.replace(/\D/g, '').length < 7) return json({ error: 'phone_invalid' }, 400, req);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'date_invalid' }, 400, req);
  if (toMin(startTime) == null) return json({ error: 'time_invalid' }, 400, req);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Всё остальное — одним вызовом в базе (book_web): мастер, услуга, правила
  // слота, лимиты, клиент, вставка под локом, токен отмены. Раньше это было ~8
  // последовательных запросов и 4–6 секунд ожидания у клиента.
  const { data, error: bErr } = await admin.rpc('book_web', {
    p_slug: slug,
    p_service_id: serviceId || null,
    p_date: date,
    p_start_time: startTime,
    p_name: name,
    p_phone: phoneRaw,
    p_comment: comment || null,
  });
  if (bErr) return json({ error: 'booking_failed' }, 500, req);
  const r = data as {
    status: string; master_id?: string; id?: string; cancel_token?: string;
    date?: string; start_time?: string; end_time?: string; service?: string;
  };
  if (r.status !== 'ok') {
    const code = r.status === 'master_not_found' ? 404
      : r.status === 'service_not_found' || BAD_INPUT.has(r.status) ? 400
      : r.status === 'day_full' || r.status === 'too_many' ? 429
      : 409;
    return json({ error: r.status }, code, req);
  }

  // Push не задерживает ответ клиенту и не может сорвать уже сделанную запись.
  const [, mo, dd] = date.split('-');
  const push = notifyMaster(admin, r.master_id!, 'Новая запись с сайта', `${name} — ${r.service}, ${dd}.${mo} в ${startTime}`, r.id!);
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(push);
  else await push;

  return json({
    ok: true, date, start_time: startTime, end_time: r.end_time, service: r.service,
    id: r.id, cancel_token: r.cancel_token ?? null,
  }, 200, req);
});
