'use client';

import { useMemo, useState } from 'react';
import { formatPrice } from '@/lib/format';

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
  day_off: 'В этот день мастер не работает',
  before_hours: 'Это время раньше рабочих часов мастера',
  after_hours: 'Услуга не успевает до конца рабочего дня — выберите время раньше',
  slot_taken: 'Это время уже занято — выберите другое',
  service_not_found: 'Эта услуга сейчас недоступна',
  booking_failed: 'Не удалось записаться. Попробуйте ещё раз',
  client_create_failed: 'Не удалось записаться. Попробуйте ещё раз',
  lookup_failed: 'Временная ошибка. Попробуйте ещё раз',
  bad_json: 'Не удалось отправить форму',
};

/** Локальная сегодняшняя дата (YYYY-MM-DD) без UTC-сдвига. */
function todayLocal(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** Слоты начала с шагом 30 мин в пределах рабочих часов. */
function buildSlots(start: string | null, end: string | null): string[] {
  const toMin = (t: string | null, def: number) => {
    const m = t && /^(\d{2}):(\d{2})$/.exec(t);
    return m ? Number(m[1]) * 60 + Number(m[2]) : def;
  };
  const s = toMin(start, 9 * 60);
  const e = toMin(end, 20 * 60);
  const out: string[] = [];
  for (let t = s; t < e; t += 30) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return out.length ? out : ['09:00'];
}

export function BookingForm({
  slug,
  services,
  workHoursStart,
  workHoursEnd,
  workDays,
  contact,
}: {
  slug: string;
  services: SvcOpt[];
  workHoursStart: string | null;
  workHoursEnd: string | null;
  workDays: number[] | null;
  contact: Contact;
}) {
  const slots = useMemo(() => buildSlots(workHoursStart, workHoursEnd), [workHoursStart, workHoursEnd]);
  const min = useMemo(() => todayLocal(), []);

  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState(slots[0] ?? '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ date: string; time: string; service: string } | null>(null);

  // День-выходной: предупреждаем заранее (work_days: 0=Вс..6=Сб).
  const dayOff = useMemo(() => {
    if (!date || !workDays || workDays.length === 0) return false;
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) return false;
    return !workDays.includes(new Date(y, m - 1, d).getDay());
  }, [date, workDays]);

  if (slug === '') {
    return <div className="empty" style={{ padding: 20 }}>Онлайн-запись у этого мастера пока недоступна.</div>;
  }

  if (done) {
    const [y, m, d] = done.date.split('-');
    return (
      <div className="book-done">
        <div className="book-done-mark">✓</div>
        <h3 className="serif" style={{ margin: '8px 0' }}>Заявка отправлена!</h3>
        <p className="muted" style={{ margin: 0 }}>
          {done.service} · {d}.{m}.{y} в {done.time}.<br />
          Мастер свяжется с вами для подтверждения.
        </p>
        {contact && (
          <a href={contact.href} target="_blank" rel="noreferrer" className="btn" style={{ marginTop: 16 }}>
            {contact.label}
          </a>
        )}
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return; // защита от двойного тапа
    setError('');

    if (name.trim().length < 2) return setError(ERRORS.name_required);
    if (phone.replace(/\D/g, '').length < 7) return setError(ERRORS.phone_invalid);
    if (!date) return setError(ERRORS.date_invalid);
    if (!time) return setError(ERRORS.time_invalid);
    if (dayOff) return setError(ERRORS.day_off);

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
        setDone({ date: data.date, time: data.start_time, service: data.service });
      } else {
        setError(ERRORS[data?.error] ?? 'Что-то пошло не так. Попробуйте ещё раз');
      }
    } catch {
      setError('Нет связи с сервером. Проверьте интернет и попробуйте снова');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="bookform" onSubmit={submit}>
      {services.length > 0 && (
        <label className="bf-field">
          <span className="bf-label">Услуга</span>
          <select className="bf-input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {formatPrice(s.price)} · {s.duration} мин
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="bf-row">
        <label className="bf-field">
          <span className="bf-label">Дата</span>
          <input className="bf-input" type="date" min={min} value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="bf-field">
          <span className="bf-label">Время</span>
          <select className="bf-input" value={time} onChange={(e) => setTime(e.target.value)}>
            {slots.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      {dayOff && <div className="bf-warn">В этот день мастер не работает — выберите другую дату.</div>}

      <label className="bf-field">
        <span className="bf-label">Ваше имя</span>
        <input className="bf-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Как к вам обращаться" maxLength={80} required />
      </label>

      <label className="bf-field">
        <span className="bf-label">Телефон</span>
        <input className="bf-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+992 …" maxLength={32} required />
      </label>

      <label className="bf-field">
        <span className="bf-label">Комментарий (необязательно)</span>
        <textarea className="bf-input" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={500} placeholder="Пожелания к записи" />
      </label>

      {error && <div className="bf-error">{error}</div>}

      <button className="btn btn-primary" type="submit" disabled={busy || dayOff} style={{ width: '100%', justifyContent: 'center', padding: 15 }}>
        {busy ? 'Отправляем…' : 'Записаться'}
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
