'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import { formatPrice } from '@/lib/format';

type Profile = {
  id: string;
  name: string;
  profession_category: string | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  slug: string | null;
  whatsapp: string | null;
  public_phone: string | null;
  published: boolean;
  premium: boolean;
  premium_until: string | null;
};

type Appt = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  notes: string | null;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  method: string | null;
  status: string;
  created_at: string;
};

const CATEGORIES = [
  'Маникюр', 'Барбер', 'Парикмахер', 'Брови', 'Ресницы', 'Косметология',
  'Массаж', 'Тату', 'Репетитор', 'Клининг', 'Ремонт', 'Другое',
];

// ⚠️ Ориентировочные пакеты премиума. Реальные цены/валюты по странам — за тобой
// (правится здесь одним местом). Списываются с баланса (пополняется вручную).
const PACKAGES = [
  { key: 'premium-7', label: '7 дней', days: 7, amount: 50 },
  { key: 'premium-30', label: '30 дней', days: 30, amount: 150 },
  { key: 'premium-90', label: '90 дней', days: 90, amount: 400 },
];

const PAYMENT_STATUS: Record<string, string> = {
  pending: 'на проверке',
  confirmed: 'подтверждён',
  rejected: 'отклонён',
};

function slugValid(s: string): boolean {
  return /^[a-z0-9-]{3,40}$/.test(s);
}

function todayLocal(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function premiumActive(p: Profile): boolean {
  return p.premium && (!p.premium_until || new Date(p.premium_until) > new Date());
}

export function Dashboard({ session }: { session: Session }) {
  const sb = getBrowserSupabase();
  const uid = session.user.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [appts, setAppts] = useState<Appt[]>([]);
  const [balance, setBalance] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('Перевод');

  const load = useCallback(async () => {
    setLoading(true);
    const today = todayLocal();
    const [{ data: p }, { data: a }, { data: b }, { data: pay }] = await Promise.all([
      sb.from('profiles')
        .select('id,name,profession_category,city,district,bio,slug,whatsapp,public_phone,published,premium,premium_until')
        .eq('id', uid).maybeSingle(),
      sb.from('appointments')
        .select('id,date,start_time,end_time,status,price,notes')
        .eq('user_id', uid).is('deleted_at', null).gte('date', today)
        .order('date', { ascending: true }).order('start_time', { ascending: true }).limit(50),
      sb.from('master_billing').select('balance').eq('master_id', uid).maybeSingle(),
      sb.from('payments').select('id,amount,currency,method,status,created_at')
        .eq('master_id', uid).order('created_at', { ascending: false }).limit(10),
    ]);
    const prof = (p as Profile) ?? null;
    setProfile(prof);
    if (prof) setForm(prof);
    setAppts((a ?? []) as Appt[]);
    setBalance(Number(b?.balance ?? 0));
    setPayments((pay ?? []) as Payment[]);
    setLoading(false);
  }, [sb, uid]);

  useEffect(() => { load(); }, [load]);

  const setField = (k: keyof Profile, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function saveProfile() {
    if (saving) return;
    setError(''); setMsg('');
    const slug = (form.slug ?? '').trim().toLowerCase();
    if (slug && !slugValid(slug)) {
      return setError('Адрес страницы: 3–40 символов, латиница, цифры и дефис');
    }
    if (form.published && (!slug || !(form.name ?? '').trim() || !(form.city ?? '').trim())) {
      return setError('Чтобы опубликовать страницу, заполните имя, город и адрес страницы (slug)');
    }
    setSaving(true);
    // мягкая проверка занятости slug (видны только published-чужие + свой; полную
    // коллизию ловит unique-индекс ниже по коду ошибки 23505)
    if (slug) {
      const { data: clash } = await sb.from('profiles').select('id').eq('slug', slug).neq('id', uid).maybeSingle();
      if (clash) { setSaving(false); return setError('Этот адрес страницы уже занят — выберите другой'); }
    }
    const update = {
      name: (form.name ?? '').trim(),
      profession_category: form.profession_category || null,
      city: (form.city ?? '').trim() || null,
      district: (form.district ?? '').trim() || null,
      bio: (form.bio ?? '').trim() || null,
      slug: slug || null,
      whatsapp: (form.whatsapp ?? '').trim() || null,
      public_phone: (form.public_phone ?? '').trim() || null,
      published: !!form.published,
    };
    const { error: e } = await sb.from('profiles').update(update).eq('id', uid);
    setSaving(false);
    if (e) {
      setError(e.code === '23505' ? 'Этот адрес страницы уже занят — выберите другой' : 'Не удалось сохранить, попробуйте ещё раз');
      return;
    }
    setMsg('Сохранено ✓');
    load();
  }

  async function buyPremium(pkg: (typeof PACKAGES)[number]) {
    setError(''); setMsg('');
    const { error: e } = await sb.rpc('redeem_promotion', { p_package: pkg.key, p_amount: pkg.amount, p_days: pkg.days });
    if (e) {
      setError(/insufficient/i.test(e.message) ? 'Недостаточно средств — сначала пополните баланс' : 'Не удалось активировать премиум');
      return;
    }
    setMsg(`Премиум активирован на ${pkg.label} ✓`);
    load();
  }

  async function topup() {
    setError(''); setMsg('');
    const amt = Number(topupAmount);
    if (!Number.isFinite(amt) || amt <= 0) return setError('Введите сумму пополнения');
    const { error: e } = await sb.from('payments').insert({
      master_id: uid,
      amount: amt,
      currency: 'TJS',
      method: topupMethod,
      status: 'pending',
      idempotency_key: crypto.randomUUID(),
    });
    if (e) return setError('Не удалось создать заявку, попробуйте ещё раз');
    setTopupAmount('');
    setMsg('Заявка на пополнение создана. После перевода мы подтвердим её вручную.');
    load();
  }

  async function logout() {
    await sb.auth.signOut();
  }

  if (loading) return <p className="muted" style={{ padding: 48, textAlign: 'center' }}>Загрузка кабинета…</p>;

  if (!profile) {
    return (
      <div style={{ paddingTop: 40 }}>
        <p className="bf-error">Профиль не найден. Откройте приложение MasterBook, чтобы завершить регистрацию.</p>
        <button className="btn" onClick={logout} style={{ marginTop: 12 }}>Выйти</button>
      </div>
    );
  }

  const isPremium = premiumActive(profile);
  const publicUrl = profile.slug ? `/m/${profile.slug}` : null;

  return (
    <div style={{ paddingTop: 28 }}>
      <div className="spread" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="serif" style={{ fontSize: 32, margin: 0 }}>Здравствуйте, {profile.name || 'мастер'}</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>{session.user.email}</p>
        </div>
        <button className="btn" onClick={logout}>Выйти</button>
      </div>

      {(msg || error) && (
        <div className={error ? 'bf-error' : 'cab-ok'} style={{ marginTop: 16 }}>{error || msg}</div>
      )}

      {/* Статус публичной страницы */}
      <section className="cab-section">
        <div className="spread">
          <h2 className="serif cab-h2">Страница на сайте</h2>
          {isPremium && <span className="vip" style={{ position: 'static' }}>★ VIP</span>}
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          {profile.published
            ? 'Опубликована — клиенты находят вас в каталоге.'
            : 'Черновик — пока не видна в каталоге. Заполните данные и включите публикацию.'}
        </p>
        {publicUrl && (
          <a href={publicUrl} target="_blank" rel="noreferrer" className="btn" style={{ marginBottom: 6 }}>
            Открыть мою страницу ↗
          </a>
        )}

        <label className="bf-field"><span className="bf-label">Имя / название</span>
          <input className="bf-input" value={form.name ?? ''} onChange={(e) => setField('name', e.target.value)} maxLength={80} />
        </label>
        <label className="bf-field"><span className="bf-label">Категория</span>
          <select className="bf-input" value={form.profession_category ?? ''} onChange={(e) => setField('profession_category', e.target.value)}>
            <option value="">— не указана —</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <div className="bf-row">
          <label className="bf-field"><span className="bf-label">Город</span>
            <input className="bf-input" value={form.city ?? ''} onChange={(e) => setField('city', e.target.value)} maxLength={60} />
          </label>
          <label className="bf-field"><span className="bf-label">Район</span>
            <input className="bf-input" value={form.district ?? ''} onChange={(e) => setField('district', e.target.value)} maxLength={60} />
          </label>
        </div>
        <label className="bf-field"><span className="bf-label">О себе</span>
          <textarea className="bf-input" rows={3} value={form.bio ?? ''} onChange={(e) => setField('bio', e.target.value)} maxLength={600} />
        </label>
        <label className="bf-field"><span className="bf-label">Адрес страницы (masterbook…/m/…)</span>
          <input className="bf-input" value={form.slug ?? ''} onChange={(e) => setField('slug', e.target.value.toLowerCase())} placeholder="например, dilnoza-nails" maxLength={40} />
        </label>
        <div className="bf-row">
          <label className="bf-field"><span className="bf-label">WhatsApp</span>
            <input className="bf-input" value={form.whatsapp ?? ''} onChange={(e) => setField('whatsapp', e.target.value)} placeholder="+992 …" maxLength={32} />
          </label>
          <label className="bf-field"><span className="bf-label">Телефон для звонков</span>
            <input className="bf-input" value={form.public_phone ?? ''} onChange={(e) => setField('public_phone', e.target.value)} placeholder="+992 …" maxLength={32} />
          </label>
        </div>
        <label className="cab-toggle">
          <input type="checkbox" checked={!!form.published} onChange={(e) => setField('published', e.target.checked)} />
          <span>Показывать мою страницу в каталоге</span>
        </label>
        <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ justifyContent: 'center' }}>
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </section>

      {/* Онлайн-записи */}
      <section className="cab-section">
        <h2 className="serif cab-h2">Записи ({appts.length})</h2>
        {appts.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>Пока нет предстоящих записей.</p>
        ) : (
          appts.map((a) => {
            const online = (a.notes ?? '').startsWith('🌐');
            const [y, m, d] = a.date.split('-');
            return (
              <div key={a.id} className="cab-appt">
                <div>
                  <strong>{d}.{m} · {a.start_time}–{a.end_time}</strong>
                  {online && <span className="cab-badge">🌐 сайт</span>}
                  {a.notes && <div className="faint" style={{ fontSize: 13, whiteSpace: 'pre-wrap', marginTop: 2 }}>{a.notes}</div>}
                </div>
                {a.price > 0 && <span className="svc-price" style={{ fontSize: 18 }}>{formatPrice(a.price)}</span>}
              </div>
            );
          })
        )}
        <p className="faint" style={{ fontSize: 13, margin: '8px 0 0' }}>Записи с сайта приходят и в приложение автоматически.</p>
      </section>

      {/* Баланс и продвижение */}
      <section className="cab-section">
        <h2 className="serif cab-h2">Баланс и продвижение</h2>
        <p style={{ margin: '0 0 4px' }}>
          Баланс: <strong>{formatPrice(balance)}</strong>
          {isPremium && profile.premium_until && (
            <span className="muted"> · премиум до {new Date(profile.premium_until).toLocaleDateString('ru-RU')}</span>
          )}
        </p>

        <div className="bf-label" style={{ marginTop: 10 }}>Подключить премиум (списывается с баланса)</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
          {PACKAGES.map((pkg) => (
            <button key={pkg.key} className="btn btn-gold" onClick={() => buyPremium(pkg)} disabled={balance < pkg.amount}>
              {pkg.label} · {formatPrice(pkg.amount)}
            </button>
          ))}
        </div>

        <div className="bf-label" style={{ marginTop: 16 }}>Пополнить баланс</div>
        <div className="bf-row">
          <label className="bf-field"><span className="bf-label">Сумма</span>
            <input className="bf-input" type="number" min={1} value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} placeholder="например, 150" />
          </label>
          <label className="bf-field"><span className="bf-label">Способ</span>
            <select className="bf-input" value={topupMethod} onChange={(e) => setTopupMethod(e.target.value)}>
              <option>Перевод</option>
              <option>Наличные</option>
              <option>Другое</option>
            </select>
          </label>
        </div>
        <button className="btn" onClick={topup}>Создать заявку на пополнение</button>
        <p className="faint" style={{ fontSize: 13, margin: '6px 0 0' }}>
          Реквизиты для перевода появятся после настройки. Заявка подтверждается вручную после поступления оплаты.
        </p>

        {payments.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="bf-label">Последние платежи</div>
            {payments.map((p) => (
              <div key={p.id} className="spread cab-pay">
                <span>{new Date(p.created_at).toLocaleDateString('ru-RU')} · {p.method ?? '—'}</span>
                <span>{Number(p.amount).toLocaleString('ru-RU')} {p.currency} · {PAYMENT_STATUS[p.status] ?? p.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
