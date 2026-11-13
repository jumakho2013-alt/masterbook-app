'use client';

import { useEffect, useState } from 'react';
import { cancelBooking, forgetBooking, upcomingBookings, type MyBooking } from '@/lib/myBookings';

const CANCEL_MSG = {
  too_late: 'Время записи уже наступило — отменить онлайн нельзя, напишите мастеру.',
  not_found: 'Мастер уже изменил эту запись. Уточните у него напрямую.',
  error: 'Не получилось отменить. Проверьте интернет и попробуйте ещё раз.',
} as const;

/** Записи клиента у этого мастера с кнопкой «Отменить». */
export function MyBookings({
  slug,
  refreshKey = 0,
  onCancelled,
  title = 'Ваша запись',
}: {
  slug: string;
  refreshKey?: number;
  onCancelled?: () => void;
  title?: string;
}) {
  const [list, setList] = useState<MyBooking[]>([]);
  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { setList(upcomingBookings(slug)); }, [slug, refreshKey]);

  async function cancel(b: MyBooking) {
    const [, m, d] = b.date.split('-');
    if (!window.confirm(`Отменить запись ${d}.${m} в ${b.time}? Мастер получит уведомление.`)) return;
    setBusyId(b.id);
    setMsg('');
    const r = await cancelBooking(b);
    setBusyId('');
    if (r === 'ok' || r === 'not_found') {
      forgetBooking(b.id);
      setList(upcomingBookings(slug));
      if (r === 'ok') setMsg('Запись отменена. Время освободилось.');
      else setMsg(CANCEL_MSG.not_found);
      onCancelled?.();
    } else {
      setMsg(CANCEL_MSG[r]);
    }
  }

  if (list.length === 0 && !msg) return null;

  return (
    <div className="my-bookings">
      {list.length > 0 && <div className="bf-label">{title}{list.length > 1 ? ` (${list.length})` : ''}</div>}
      {list.map((b) => {
        const [, m, d] = b.date.split('-');
        return (
          <div key={b.id} className="my-booking">
            <span><strong>{d}.{m} в {b.time}</strong>{b.service ? ` · ${b.service}` : ''}</span>
            <button type="button" className="linkbtn" disabled={busyId === b.id} onClick={() => cancel(b)}>
              {busyId === b.id ? 'Отменяем…' : 'Отменить'}
            </button>
          </div>
        );
      })}
      {msg && <div className="bf-hint" style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
