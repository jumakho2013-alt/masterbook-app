// Админ-функция подтверждения оплат. Доступна ТОЛЬКО владельцу:
// проверяем e-mail вызывающего (из его JWT) по списку ADMIN_EMAILS.
//
// confirm_payment — SECURITY DEFINER и больше НЕ исполняется anon/authenticated
// (см. миграцию harden_confirm_payment_grants). Поэтому подтверждение идёт здесь
// на service-role, после проверки админа.
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'no_auth' }, 401);

  const URL = Deno.env.get('SUPABASE_URL')!;
  const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 1) Кто вызывает? Клиент, привязанный к токену вызывающего.
  const caller = createClient(URL, ANON, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: uErr } = await caller.auth.getUser();
  const user = userData?.user;
  if (uErr || !user) return json({ error: 'unauthorized' }, 401);

  const admins = (Deno.env.get('ADMIN_EMAILS') ?? 'jumakho2013@gmail.com')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!user.email || !admins.includes(user.email.toLowerCase())) {
    return json({ error: 'forbidden' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const action = typeof body.action === 'string' ? body.action : 'list';

  // 2) Дальше — на service-role (минуя RLS), уже после проверки админа.
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

  if (action === 'list') {
    const { data: pays, error } = await admin
      .from('payments')
      .select('id, master_id, amount, currency, method, marker, reference, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) return json({ error: 'list_failed' }, 500);
    const ids = [...new Set((pays ?? []).map((p) => p.master_id))];
    const names: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await admin.from('profiles').select('id, name').in('id', ids);
      for (const pr of profs ?? []) names[pr.id as string] = pr.name as string;
    }
    return json({ payments: (pays ?? []).map((p) => ({ ...p, master_name: names[p.master_id as string] ?? '—' })) });
  }

  const paymentId = typeof body.payment_id === 'string' ? body.payment_id : '';
  if (!paymentId) return json({ error: 'payment_id_required' }, 400);

  if (action === 'confirm') {
    const { error } = await admin.rpc('confirm_payment', { p_payment: paymentId });
    if (error) return json({ error: 'confirm_failed' }, 500);
    return json({ ok: true });
  }

  if (action === 'reject') {
    const { error } = await admin
      .from('payments')
      .update({ status: 'rejected' })
      .eq('id', paymentId)
      .eq('status', 'pending');
    if (error) return json({ error: 'reject_failed' }, 500);
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
});
