'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/format';
import { phonePlaceholder } from '@/lib/geo';
import { CHOOSE_SERVICE_EVENT } from './ChooseServiceButton';
import { MyBookings } from './MyBookings';
import { rememberBooking } from '@/lib/myBookings';

type SvcOpt = { id: string; name: string; price: number; duration: number };
type Contact = { href: string; label: string } | null;

const ERRORS: Record<string, string> = {
  master_required: 'Мастер не найден',
  master_not_found: 'Мастер не найден или страница снята с публикации',
  name_required: 'Укажите имя',
  phone_invalid: 'Проверьте номер телефона',
  date_invalid: 'Выберите корректную дату',
  date_past: 'Эта дата уже прошла',
  date_far: 'Слишком далёкая дата',
  time_invalid: 'Выберите время',
  time_past: 'Это время уже прошло — выберите позже',
  day_off: 'В этот день мастер не работает',
  break_time: 'Это время попадает на перерыв мастера — выберите другое',
  before_hours: 'Это время раньше рабочих часов мастера',
  after_hours: 'Услуга не успевает до конца рабочего дня — выберите время раньше',
  slot_taken: 'Это время уже занято — выберите другое',
  day_full: 'В этот день всё занято — выберите другую дату',
  paused: 'Мастер временно не принимает онлайн-запись',
  closed: 'В этот день мастер не принимает — выберите другую дату',
  too_many: 'С этого номера уже отправлено несколько заявок — дождитесь ответа мастера',
  service_not_found: 'Эта услуга сейчас недоступна',
  booking_failed: 'Не удалось записаться. Попробуйте ещё раз',
  client_create_failed: 'Не удалось записаться. Попробуйте ещё раз',
  lookup_failed: 'Временная ошибка. Попробуйте ещё раз',
  bad_json: 'Не удалось отправить форму',
};

const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAYS_AHEAD = 14;

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Day = { date: string; wd: string; num: number; off: boolean };

/** Ближайшие 14 дней; выходные и закрытые даты — неактивны. */
function buildDays(workDays: number[] | null, closed: string[]): Day[] {
  const out: Day[] = [];
  const base = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const date = ymd(d);
    const off = (workDays != null && workDays.length > 0 && !workDays.includes(d.getDay())) || closed.includes(date);
    out.push({ date, wd: i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : WD[d.getDay()], num: d.getDate(), off });
  }
  return out;
}

type SlotsState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; slots: string[] }
  | { kind: 'error' };

const DAY_STATUS: Record<string, string> = {
  day_off: 'В этот день мастер не работает — выберите другой.',
  closed: 'В этот день мастер не принимает — выберите другой.',
  paused: 'Мастер временно не принимает онлайн-запись.',
  date_past: 'Этот день уже прошёл.',
};

export function BookingForm({
  slug,
  services,
  currency,
  workDays,
  closedDates = null,
  paused = false,
  contact,
  city = null,
}: {
  slug: string;
  services: SvcOpt[];
  currency: string | null;
  workDays: number[] | null;
  closedDates?: string[] | null;
  paused?: boolean | null;
  contact: Contact;
  /** Город мастера — для подсказки кода страны в поле телефона. */
  city?: string | null;
}) {
  // Дни строим только в браузере: на сервере (UTC) «сегодня» в ночные часы —
  // другой календарный день, и разметка не совпала бы при гидратации.
  const [days, setDays] = useState<Day[] | null>(null);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [date, setDate] = useState('');
  useEffect(() => {
    const list = buildDays(workDays, closedDates ?? []);
    setDays(list);
    setDate((cur) => (cur && list.some((d) => d.date === cur && !d.off) ? cur : list.find((d) => !d.off)?.date ?? ''));
  }, [workDays, closedDates]);
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState<SlotsState>({ kind: 'idle' });
  const [dayMsg, setDayMsg] = useState('');
  const [reload, setReload] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ date: string; time: string; service: string } | null>(null);

  // «Выбрать» у услуги в прайсе выбирает её здесь.
  useEffect(() => {
    const onChoose = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (services.some((s) => s.id === id)) setServiceId(id);
    };
    window.addEventListener(CHOOSE_SERVICE_EVENT, onChoose);
    return () => window.removeEventListener(CHOOSE_SERVICE_EVENT, onChoose);
  }, [services]);

  // Свободное время — с сервера, по тем же правилам, что и запись
  // (available_slots → booking_slot_error): занятое, перерыв, буфер, прошедшее
  // время сегодня. Раньше форма показывала все слоты рабочего дня, и клиент
  // узнавал «занято» только после отправки.
  useEffect(() => {
    if (!date || !slug || paused) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return;
    const ctrl = new AbortController();
    setSlots({ kind: 'loading' });
    setDayMsg('');
    fetch(`${url}/rest/v1/rpc/available_slots`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify({ p_slug: slug, p_date: date, p_service_id: serviceId || null }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { status: string; slots: string[] }) => {
        const list = d.status === 'ok' ? d.slots : [];
        setSlots({ kind: 'ok', slots: list });
        setDayMsg(d.status === 'ok' ? '' : (DAY_STATUS[d.status] ?? ''));
        setTime((t) => (list.includes(t) ? t : ''));
      })
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') setSlots({ kind: 'error' });
      });
    return () => ctrl.abort();
  }, [slug, date, serviceId, paused, reload]);

  if (slug === '') {
    return <div className="empty" style={{ padding: 20 }}>Онлайн-запись у этого мастера пока недоступна.</div>;
  }

  if (paused) {
    return (
      <div className="book-done">
        <h3 className="serif" style={{ margin: '0 0 6px' }}>Запись временно закрыта</h3>
        <p className="muted" style={{ margin: 0 }}>Мастер сейчас не принимает онлайн-заявки. Напишите ему напрямую.</p>
        {contact && (
          <a href={contact.href} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginTop: 16 }}>
            {contact.label}
          </a>
        )}
      </div>
    );
  }

  if (done) {
    const [y, m, d] = done.date.split('-');
    return (
      <div className="book-done">
        <div className="book-done-mark">✓</div>
        <h3 className="serif" style={{ margin: '8px 0' }}>Заявка отправлена!</h3>
        <p className="muted" style={{ margin: 0 }}>
          {done.service} · {d}.{m}.{y} в {done.time}.<br />
          Заявка уже в календаре мастера. Если время понадобится уточнить, мастер свяжется с вами по телефону.
        </p>
        {contact && (
          <a href={contact.href} target="_blank" rel="noreferrer" className="btn" style={{ marginTop: 16 }}>
            {contact.label}
          </a>
        )}
        <div style={{ textAlign: 'left', marginTop: 18 }}>
          <MyBookings
            slug={slug}
            title="Передумали? Запись можно отменить"
            onCancelled={() => { setDone(null); setTime(''); setReload((n) => n + 1); }}
          />
          <p className="faint" style={{ fontSize: 12.5, margin: '8px 0 0' }}>
            Запись сохранена в этом браузере — откройте страницу мастера снова, чтобы отменить её.
          </p>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return; // защита от двойного тапа
    setError('');

    if (name.trim().length < 2) return setError(ERRORS.name_required);
    if (phone.replace(/\D/g, '').length < 7) return setError(ERRORS.phone_invalid);
    if (!date) return setError('Выберите день');
    if (!time) return setError('Выберите свободное время');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return setError('Сервис записи не настроен');

    setBusy(true);
    try {
      const res = await fetch(`${url}/functions/v1/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anon}`,
          apikey: anon,
        },
        body: JSON.stringify({
          slug,
          service_id: serviceId || undefined,
          date,
          start_time: time,
          name: name.trim(),
          phone: phone.trim(),
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        if (data.id && data.cancel_token) {
          rememberBooking({ id: data.id, token: data.cancel_token, slug, date: data.date, time: data.start_time, service: data.service });
        }
        setDone({ date: data.date, time: data.start_time, service: data.service });
      } else {
        setError(ERRORS[data?.error] ?? 'Что-то пошло не так. Попробуйте ещё раз');
        // Время успел занять кто-то другой (или мастер поменял график) —
        // перезагружаем свободные окна, чтобы клиент выбирал из актуальных.
        if (res.status === 409) {
          setTime('');
          setReload((n) => n + 1);
        }
      }
    } catch {
      setError('Нет связи с сервером. Проверьте интернет и попробуйте снова');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="bookform" onSubmit={submit}>
      <MyBookings slug={slug} refreshKey={reload} onCancelled={() => setReload((n) => n + 1)} />

      {services.length > 0 && (
        <label className="bf-field">
          <span className="bf-label">Услуга</span>
          <select className="bf-input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {formatPrice(s.price, currency)} · {s.duration} мин
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="bf-field">
        <span className="bf-label">День</span>
        <div className="bf-days" role="radiogroup" aria-label="День записи">
          {days == null && Array.from({ length: 7 }).map((_, i) => <span key={i} className="bf-day skeleton" />)}
          {days?.map((d) => (
            <button
              key={d.date} type="button" role="radio" aria-checked={d.date === date}
              aria-label={`${d.wd}, ${d.num}${d.off ? ' — нет записи' : ''}`}
              className={`bf-day${d.date === date ? ' active' : ''}`}
              disabled={d.off}
              onClick={() => { setDate(d.date); setError(''); }}
            >
              <span className="bf-day-wd">{d.wd}</span>
              <span className="bf-day-num">{d.num}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bf-field">
        <span className="bf-label">Свободное время</span>
        {days != null && !date ? (
          <div className="bf-hint">В ближайшие две недели свободных дней нет — напишите мастеру.</div>
        ) : !date || slots.kind === 'loading' || slots.kind === 'idle' ? (
          <div className="bf-slots" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => <span key={i} className="bf-slot skeleton" />)}
          </div>
        ) : slots.kind === 'error' ? (
          <div className="bf-hint">
            Не удалось загрузить время.{' '}
            <button type="button" className="linkbtn" onClick={() => setReload((n) => n + 1)}>Повторить</button>
          </div>
        ) : slots.slots.length === 0 ? (
          <div className="bf-hint">{dayMsg || 'На этот день свободного времени нет — выберите другой.'}</div>
        ) : (
          <div className="bf-slots" role="radiogroup" aria-label="Время записи">
            {slots.slots.map((t) => (
              <button
                key={t} type="button" role="radio" aria-checked={t === time}
                className={`bf-slot${t === time ? ' active' : ''}`}
                onClick={() => { setTime(t); setError(''); }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="bf-field">
        <span className="bf-label">Ваше имя</span>
        <input className="bf-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Как к вам обращаться" maxLength={80} required />
      </label>

      <label className="bf-field">
        <span className="bf-label">Телефон</span>
        <input className="bf-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={phonePlaceholder(city)} maxLength={32} required />
      </label>

      <label className="bf-field">
        <span className="bf-label">Комментарий (необязательно)</span>
        <textarea className="bf-input" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={500} placeholder="Пожелания к записи" />
      </label>

      {error && <div className="bf-error">{error}</div>}

      <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', padding: 15 }}>
        {busy ? 'Отправляем…' : time ? `Записаться на ${time}` : 'Записаться'}
      </button>

      {contact && (
        <p className="faint" style={{ textAlign: 'center', fontSize: 14, margin: '4px 0 0' }}>
          Предпочитаете написать?{' '}
          <a href={contact.href} target="_blank" rel="noreferrer" style={{ color: 'var(--plum)', fontWeight: 600 }}>
            {contact.label}
          </a>
        </p>
      )}
    </form>
  );
}
