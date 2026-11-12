'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import { formatPrice, CURRENCY_CODES } from '@/lib/format';
import { SPECIALIZATION_GROUPS, SPECIALIZATION_CATEGORY, CATEGORY_LABELS, SPECIALIZATION_LABELS } from '@/lib/taxonomy';
import { COUNTRIES, countryByName, countryOfCity, DEFAULT_COUNTRY } from '@/lib/geo';
import { makeSlug, slugValid } from '@/lib/slug';

type Profile = {
  id: string;
  name: string;
  profession_category: string | null;
  specialization_id: string | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  slug: string | null;
  whatsapp: string | null;
  public_phone: string | null;
  published: boolean;
  premium: boolean;
  premium_until: string | null;
  currency: string | null;
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

type Service = { id: string; name: string; price: number; duration: number };

/** Пресеты длительности — как в приложении (app/services/manage.tsx). */
const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];

function fmtDuration(m: number): string {
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} ч ${m % 60} мин` : `${h} ч`;
}

// Пакеты премиума приходят из БД (public.promotion_packages) — цена и срок
// принадлежат серверу. Раньше они лежали здесь и передавались в redeem_promotion
// параметрами, из-за чего из консоли можно было купить 100 лет за копейку.
// Цены по странам правятся в таблице, без релиза сайта.
type Package = { key: string; label: string; days: number; amount: number };

const PAYMENT_STATUS: Record<string, string> = {
  pending: 'на проверке',
  confirmed: 'подтверждён',
  rejected: 'отклонён',
};

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
  const [buying, setBuying] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('Перевод');
  const [countrySel, setCountrySel] = useState(DEFAULT_COUNTRY);
  const [services, setServices] = useState<Service[]>([]);
  const [svcName, setSvcName] = useState('');
  const [svcPrice, setSvcPrice] = useState('');
  const [svcDuration, setSvcDuration] = useState(60);
  const [svcBusy, setSvcBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  // Сообщение стоит вверху страницы, а кнопки «Добавить услугу» и
  // «Опубликовать» — внизу: без прокрутки мастер жал кнопку, ничего не видел
  // и решал, что сайт сломан.
  const noticeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (msg || error) noticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [msg, error]);

  // Полноэкранная «Загрузка…» — только при первом открытии (loading стартует
  // с true). Повторные загрузки после «Сохранить» / «Добавить услугу» тихо
  // обновляют данные: раньше страница целиком пропадала и терялась прокрутка.
  const load = useCallback(async () => {
    const today = todayLocal();
    // Профиль создаёт триггер handle_new_user при регистрации. Но триггер глотает
    // свои ошибки (чтобы не ронять регистрацию), и строка может не появиться —
    // тогда мастер упирался в «откройте приложение». Досоздаём сами: ON CONFLICT
    // DO NOTHING, существующий профиль не трогается.
    await sb.from('profiles').upsert(
      { id: uid, name: String(session.user.user_metadata?.name ?? '') },
      { onConflict: 'id', ignoreDuplicates: true },
    );
    const [{ data: p }, { data: a }, { data: b }, { data: pay }, { data: pk }, { data: sv }] = await Promise.all([
      sb.from('profiles')
        .select('id,name,profession_category,specialization_id,city,district,bio,slug,whatsapp,public_phone,published,premium,premium_until,currency')
        .eq('id', uid).maybeSingle(),
      sb.from('appointments')
        .select('id,date,start_time,end_time,status,price,notes')
        .eq('user_id', uid).is('deleted_at', null).gte('date', today)
        .order('date', { ascending: true }).order('start_time', { ascending: true }).limit(50),
      sb.from('master_billing').select('balance').eq('master_id', uid).maybeSingle(),
      sb.from('payments').select('id,amount,currency,method,status,created_at')
        .eq('master_id', uid).order('created_at', { ascending: false }).limit(10),
      sb.from('promotion_packages').select('key,label,days,amount')
        .eq('active', true).order('sort', { ascending: true }),
      sb.from('services').select('id,name,price,duration')
        .eq('user_id', uid).is('deleted_at', null).order('name', { ascending: true }),
    ]);
    const prof = (p as Profile) ?? null;
    if (!prof) {
      // Профиля нет — чаще всего потому, что аккаунт удалён (с другого
      // устройства или из приложения), а в браузере осталась его сессия.
      // Тогда честно выходим: страница покажет форму входа, а не тупик.
      const { data: u, error: ue } = await sb.auth.getUser();
      if (ue || !u.user) {
        await sb.auth.signOut();
        return;
      }
    }
    setProfile(prof);
    if (prof) setForm(prof);
    if (prof?.city) setCountrySel(countryOfCity(prof.city) || DEFAULT_COUNTRY);
    setAppts((a ?? []) as Appt[]);
    setBalance(Number(b?.balance ?? 0));
    setPayments((pay ?? []) as Payment[]);
    setPackages((pk ?? []) as Package[]);
    setServices(((sv ?? []) as Service[]).map((x) => ({ ...x, price: Number(x.price) })));
    setLoading(false);
  }, [sb, uid, session.user.user_metadata]);

  useEffect(() => { load(); }, [load]);

  const setField = (k: keyof Profile, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function saveProfile() {
    if (saving) return;
    setError(''); setMsg('');
    const slug = (form.slug ?? '').trim().toLowerCase();
    if (slug && !slugValid(slug)) {
      return setError('Адрес страницы: 3–40 символов, латиница, цифры и дефис');
    }
    // У опубликованной страницы имя и адрес — то, по чему её находят. Пустое имя
    // дало бы безымянную карточку в каталоге, пустой адрес — битую ссылку,
    // которая уже стоит у мастера в Instagram.
    if (profile?.published && !(form.name ?? '').trim()) {
      return setError('У опубликованной страницы должно быть имя');
    }
    if (profile?.published && !slug) {
      return setError('Адрес опубликованной страницы нельзя очистить — по нему вас уже находят');
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
      specialization_id: form.specialization_id || null,
      // Категорию выводим из специализации: каталог фильтрует по specialization_id,
      // карточка без неё падает на категорию. Писать одно без другого нельзя.
      profession_category: form.specialization_id
        ? SPECIALIZATION_CATEGORY[form.specialization_id] ?? null
        : form.profession_category || null,
      currency: form.currency || 'TJS',
      city: (form.city ?? '').trim() || null,
      district: (form.district ?? '').trim() || null,
      bio: (form.bio ?? '').trim() || null,
      slug: slug || null,
      whatsapp: (form.whatsapp ?? '').trim() || null,
      public_phone: (form.public_phone ?? '').trim() || null,
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

  async function addService() {
    if (svcBusy) return;
    setError(''); setMsg('');
    const name = svcName.trim();
    const price = Number(svcPrice.replace(',', '.').replace(/\s/g, ''));
    // Те же границы, что serviceSchema в приложении (src/lib/validation.ts).
    if (name.length < 2) return setError('Название услуги — минимум 2 символа');
    if (!Number.isFinite(price) || price < 0) return setError('Укажите цену числом');
    setSvcBusy(true);
    const now = new Date().toISOString();
    const { error: e } = await sb.from('services').insert({
      // Тот же формат id, что у приложения (src/utils/helpers.ts → generateId):
      // при синке приложение сольёт услугу как свою.
      id: `${Date.now()}-w-${Math.random().toString(36).slice(2, 7)}`,
      user_id: uid,
      name: name.slice(0, 80),
      price,
      duration: svcDuration,
      updated_at: now,
    });
    setSvcBusy(false);
    if (e) return setError('Не удалось добавить услугу, попробуйте ещё раз');
    setSvcName(''); setSvcPrice('');
    load();
  }

  async function removeService(s: Service) {
    if (!confirm(`Удалить «${s.name}»?`)) return;
    setError(''); setMsg('');
    // Мягкое удаление (tombstone), как в приложении: иначе устройство мастера
    // при следующем синке «воскресило» бы услугу обратно.
    const now = new Date().toISOString();
    const { error: e } = await sb.from('services')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', s.id).eq('user_id', uid);
    if (e) return setError('Не удалось удалить услугу');
    load();
  }

  async function setPublished(next: boolean) {
    if (publishing || !profile) return;
    setError(''); setMsg('');
    if (next) {
      // Проверяем сохранённое в базе, а не черновик формы: в каталог уходит то,
      // что лежит в profiles.
      const missing: string[] = [];
      if (!profile.name.trim()) missing.push('имя');
      if (!profile.specialization_id) missing.push('специализацию');
      if (!(profile.city ?? '').trim()) missing.push('город');
      if (!profile.whatsapp && !profile.public_phone) missing.push('WhatsApp или телефон');
      if (services.length === 0) missing.push('хотя бы одну услугу с ценой');
      if (missing.length) {
        return setError(`Чтобы опубликоваться, сохраните: ${missing.join(', ')}.`);
      }
    }
    setPublishing(true);
    try {
      let slug = profile.slug;
      // Адрес страницы генерируем сами: просить мастера придумать «slug»
      // латиницей — гарантированно потерять его на этом шаге.
      for (let attempt = 0; attempt < 3; attempt++) {
        const patch: { published: boolean; slug?: string } = { published: next };
        if (next && !slug) patch.slug = makeSlug(profile.name);
        const { error: e } = await sb.from('profiles').update(patch).eq('id', uid);
        if (!e) {
          setMsg(next ? 'Страница опубликована ✓ Клиенты уже видят вас в каталоге.' : 'Страница снята с публикации.');
          load();
          return;
        }
        if (e.code !== '23505' || slug) {
          setError('Не удалось изменить публикацию, попробуйте ещё раз');
          return;
        }
        // 23505 — сгенерированный адрес занят, пробуем другой суффикс
      }
      setError('Не удалось подобрать адрес страницы, задайте его вручную в профиле');
    } finally {
      setPublishing(false);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Не получилось скопировать — выделите ссылку вручную');
    }
  }

  async function buyPremium(pkg: Package) {
    if (buying) return; // защита от двойного нажатия → двойное списание
    setError(''); setMsg(''); setBuying(true);
    try {
      const { error: e } = await sb.rpc('redeem_promotion', { p_package: pkg.key });
      if (e) {
        setError(/insufficient/i.test(e.message) ? 'Недостаточно средств — сначала пополните баланс' : 'Не удалось активировать премиум');
        return;
      }
      setMsg(`Премиум активирован на ${pkg.label} ✓`);
      load();
    } finally {
      setBuying(false);
    }
  }

  async function topup() {
    if (toppingUp) return; // двойной клик создавал ДВЕ заявки → двойное зачисление
    setError(''); setMsg('');
    const amt = Number(topupAmount);
    if (!Number.isFinite(amt) || amt <= 0) return setError('Введите сумму пополнения');
    setToppingUp(true);
    try {
      const { error: e } = await sb.from('payments').insert({
        master_id: uid,
        amount: amt,
        // Валюта пополнения = валюта мастера (оплата локальным переводом в его стране).
        currency: profile?.currency ?? 'TJS',
        method: topupMethod,
        status: 'pending',
        // Ключ выводим из содержимого, а не random: повтор той же заявки за день
        // схлопнется уникальным индексом (master_id, idempotency_key), а не
        // создаст второй платёж, который админ подтвердит дважды.
        idempotency_key: `${todayLocal()}:${topupMethod}:${amt}`,
      });
      if (e) {
        setError(e.code === '23505'
          ? 'Такая заявка уже создана — дождитесь подтверждения'
          : 'Не удалось создать заявку, попробуйте ещё раз');
        return;
      }
      setTopupAmount('');
      setMsg('Заявка на пополнение создана. После перевода мы подтвердим её вручную.');
      load();
    } finally {
      setToppingUp(false);
    }
  }

  async function logout() {
    await sb.auth.signOut();
  }

  if (loading) return <p className="muted" style={{ padding: 48, textAlign: 'center' }}>Загрузка кабинета…</p>;

  if (!profile) {
    return (
      <div style={{ paddingTop: 40 }}>
        <p className="bf-error">Не удалось загрузить профиль. Обновите страницу; если не поможет — напишите нам.</p>
        <button className="btn" onClick={logout} style={{ marginTop: 12 }}>Выйти</button>
      </div>
    );
  }

  const isPremium = premiumActive(profile);
  const publicUrl = profile.slug ? `/m/${profile.slug}` : null;
  const fullUrl = publicUrl && typeof window !== 'undefined' ? `${window.location.origin}${publicUrl}` : null;
  const steps = [
    { done: !!(profile.specialization_id && profile.city && (profile.whatsapp || profile.public_phone)), label: 'Заполните профиль' },
    { done: services.length > 0, label: 'Добавьте услуги с ценами' },
    { done: profile.published, label: 'Опубликуйте страницу' },
  ];

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
        <div ref={noticeRef} role={error ? 'alert' : 'status'} className={error ? 'bf-error' : 'cab-ok'} style={{ marginTop: 16 }}>{error || msg}</div>
      )}

      {/* Три шага до каталога — новому мастеру сразу видно, что осталось */}
      {!profile.published && (
        <ol className="cab-steps">
          {steps.map((st, i) => (
            <li key={st.label} className={st.done ? 'done' : ''}>
              <span className="cab-step-n">{st.done ? '✓' : i + 1}</span>{st.label}
            </li>
          ))}
        </ol>
      )}

      {/* 1. Профиль */}
      <section className="cab-section">
        <div className="spread">
          <h2 className="serif cab-h2">Профиль</h2>
          {isPremium && <span className="vip-static">★ VIP</span>}
        </div>

        <label className="bf-field"><span className="bf-label">Имя / название</span>
          <input className="bf-input" value={form.name ?? ''} onChange={(e) => setField('name', e.target.value)} maxLength={80} />
        </label>
        <label className="bf-field"><span className="bf-label">Чем вы занимаетесь</span>
          <select className="bf-input" value={form.specialization_id ?? ''} onChange={(e) => setField('specialization_id', e.target.value)}>
            <option value="">— выберите —</option>
            {SPECIALIZATION_GROUPS.map((g) => (
              <optgroup key={g.category} label={CATEGORY_LABELS[g.category] ?? g.category}>
                {g.items.map((it) => <option key={it.id} value={it.id}>{it.label}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="bf-row">
          <label className="bf-field"><span className="bf-label">Страна</span>
            <select className="bf-input" value={countrySel} onChange={(e) => setCountrySel(e.target.value)}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </label>
          <label className="bf-field"><span className="bf-label">Город</span>
            <input className="bf-input" list="mb-cities" value={form.city ?? ''} onChange={(e) => setField('city', e.target.value)} maxLength={60} placeholder="Выберите или впишите" />
            <datalist id="mb-cities">
              {(countryByName(countrySel)?.cities ?? []).map((c) => <option key={c} value={c} />)}
            </datalist>
          </label>
        </div>
        <div className="bf-row">
          <label className="bf-field"><span className="bf-label">Район <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(необязательно)</span></span>
            <input className="bf-input" value={form.district ?? ''} onChange={(e) => setField('district', e.target.value)} maxLength={60} />
          </label>
          <label className="bf-field"><span className="bf-label">Валюта цен</span>
            <select className="bf-input" value={form.currency ?? 'TJS'} onChange={(e) => setField('currency', e.target.value)}>
              {CURRENCY_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <div className="bf-row">
          <label className="bf-field"><span className="bf-label">WhatsApp</span>
            <input className="bf-input" type="tel" value={form.whatsapp ?? ''} onChange={(e) => setField('whatsapp', e.target.value)} placeholder="+992 …" maxLength={32} />
          </label>
          <label className="bf-field"><span className="bf-label">Телефон для звонков</span>
            <input className="bf-input" type="tel" value={form.public_phone ?? ''} onChange={(e) => setField('public_phone', e.target.value)} placeholder="+992 …" maxLength={32} />
          </label>
        </div>
        <label className="bf-field"><span className="bf-label">О себе</span>
          <textarea className="bf-input" rows={3} value={form.bio ?? ''} onChange={(e) => setField('bio', e.target.value)} maxLength={600} placeholder="Опыт, материалы, где принимаете" />
        </label>
        <label className="bf-field"><span className="bf-label">Адрес страницы <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(необязательно — придумаем сами)</span></span>
          <input className="bf-input" value={form.slug ?? ''} onChange={(e) => setField('slug', e.target.value.toLowerCase())} placeholder="например, dilnoza-nails" maxLength={40} />
        </label>
        <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ justifyContent: 'center' }}>
          {saving ? 'Сохраняем…' : 'Сохранить профиль'}
        </button>
      </section>

      {/* 2. Услуги */}
      <section className="cab-section">
        <h2 className="serif cab-h2">Услуги и цены ({services.length})</h2>
        {services.length === 0 && (
          <p className="muted" style={{ marginTop: 0 }}>Клиенты выбирают по цене. Добавьте хотя бы одну услугу.</p>
        )}
        {services.map((sv) => (
          <div key={sv.id} className="cab-appt">
            <div>
              <strong>{sv.name}</strong>
              <div className="faint" style={{ fontSize: 13 }}>{fmtDuration(sv.duration)}</div>
            </div>
            <div className="row" style={{ gap: 12, alignItems: 'center' }}>
              <span className="svc-price" style={{ fontSize: 18 }}>{formatPrice(sv.price, profile.currency)}</span>
              <button className="linkbtn" onClick={() => removeService(sv)} aria-label={`Удалить ${sv.name}`}>удалить</button>
            </div>
          </div>
        ))}
        <div className="bf-row" style={{ marginTop: 12 }}>
          <label className="bf-field" style={{ flex: 2 }}><span className="bf-label">Услуга</span>
            <input className="bf-input" value={svcName} onChange={(e) => setSvcName(e.target.value)} maxLength={80} placeholder="Маникюр с покрытием" />
          </label>
          <label className="bf-field"><span className="bf-label">Цена</span>
            <input className="bf-input" inputMode="decimal" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} placeholder="150" />
          </label>
          <label className="bf-field"><span className="bf-label">Длительность</span>
            <select className="bf-input" value={svcDuration} onChange={(e) => setSvcDuration(Number(e.target.value))}>
              {DURATIONS.map((d) => <option key={d} value={d}>{fmtDuration(d)}</option>)}
            </select>
          </label>
        </div>
        <button className="btn" onClick={addService} disabled={svcBusy}>
          {svcBusy ? 'Добавляем…' : '+ Добавить услугу'}
        </button>
      </section>

      {/* 3. Публикация */}
      <section className="cab-section">
        <h2 className="serif cab-h2">Страница в каталоге</h2>
        {profile.published && fullUrl ? (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              Опубликована. Поставьте ссылку в шапку Instagram и в статус WhatsApp — клиенты будут записываться сами.
            </p>
            <div className="cab-link">
              <a href={publicUrl!} target="_blank" rel="noreferrer">{fullUrl}</a>
              <button className="btn" onClick={() => copyLink(fullUrl)}>{copied ? 'Скопировано ✓' : 'Копировать'}</button>
            </div>
            <button className="linkbtn" onClick={() => setPublished(false)} disabled={publishing} style={{ marginTop: 10 }}>
              Снять с публикации
            </button>
          </>
        ) : (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              Пока черновик — в каталоге вас не видно.
            </p>
            <button className="btn btn-primary" onClick={() => setPublished(true)} disabled={publishing} style={{ justifyContent: 'center' }}>
              {publishing ? 'Публикуем…' : 'Опубликовать страницу'}
            </button>
          </>
        )}
        {profile.specialization_id && (
          <p className="faint" style={{ fontSize: 13, margin: '10px 0 0' }}>
            В каталоге вы в разделе «{SPECIALIZATION_LABELS[profile.specialization_id] ?? 'Мастер'}»{profile.city ? `, ${profile.city}` : ''}.
          </p>
        )}
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
                {a.price > 0 && <span className="svc-price" style={{ fontSize: 18 }}>{formatPrice(a.price, profile.currency)}</span>}
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
          Баланс: <strong>{formatPrice(balance, profile.currency)}</strong>
          {isPremium && profile.premium_until && (
            <span className="muted"> · премиум до {new Date(profile.premium_until).toLocaleDateString('ru-RU')}</span>
          )}
        </p>

        <div className="bf-label" style={{ marginTop: 10 }}>Подключить премиум (списывается с баланса)</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
          {packages.map((pkg) => (
            <button key={pkg.key} className="btn btn-gold" onClick={() => buyPremium(pkg)} disabled={balance < pkg.amount || buying}>
              {pkg.label} · {formatPrice(pkg.amount, profile.currency)}
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
        <button className="btn" onClick={topup} disabled={toppingUp}>
          {toppingUp ? 'Создаём…' : 'Создать заявку на пополнение'}
        </button>
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
