'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Info =
  | { status: 'loading' }
  | { status: 'not_found' | 'used' | 'error' }
  | { status: 'ok'; client_name: string; service: string; date: string; master_name: string; slug: string | null };

const LABELS = ['', 'Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'];

function rpc(fn: string, body: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return Promise.reject(new Error('not configured'));
  return fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
    body: JSON.stringify(body),
  }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
}

/** Отзыв клиента по одноразовой ссылке от мастера (после завершённого визита). */
export function ReviewForm({ token }: { token: string }) {
  const [info, setInfo] = useState<Info>({ status: 'loading' });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let alive = true;
    rpc('review_request_info', { p_token: token })
      .then((d: Info & { client_name?: string }) => {
        if (!alive) return;
        setInfo(d);
        if (d.status === 'ok' && d.client_name) setName(d.client_name);
      })
      .catch(() => alive && setInfo({ status: 'error' }));
    return () => { alive = false; };
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!rating) return setError('Поставьте оценку — нажмите на звёзды');
    setBusy(true);
    setError('');
    try {
      const res = await rpc('submit_review', { p_token: token, p_rating: rating, p_comment: comment, p_name: name });
      if (res === 'ok' || res === 'used') setSent(true);
      else setError('Ссылка больше не действует. Попросите мастера прислать новую.');
    } catch {
      setError('Нет связи с сервером. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  const wrap = (children: React.ReactNode) => (
    <div style={{ maxWidth: 460, margin: '48px auto 0', padding: '0 16px' }}>{children}</div>
  );

  if (info.status === 'loading') return wrap(<p className="muted" style={{ textAlign: 'center' }}>Загрузка…</p>);
  if (info.status !== 'ok' || sent) {
    const title = sent ? 'Спасибо за отзыв!' : info.status === 'used' ? 'Отзыв уже оставлен' : 'Ссылка не найдена';
    const text = sent || info.status === 'used'
      ? 'Он поможет другим клиентам выбрать мастера.'
      : info.status === 'error'
        ? 'Не удалось загрузить страницу. Проверьте интернет и обновите её.'
        : 'Возможно, в ссылке опечатка. Попросите мастера прислать её ещё раз.';
    const slug = info.status === 'ok' ? info.slug : null;
    return wrap(
      <div className="book-done">
        {(sent || info.status === 'used') && <div className="book-done-mark">✓</div>}
        <h1 className="serif" style={{ fontSize: 28, margin: '8px 0' }}>{title}</h1>
        <p className="muted" style={{ margin: 0 }}>{text}</p>
        <Link href={slug ? `/m/${slug}` : '/catalog'} className="btn" style={{ marginTop: 16 }}>
          {slug ? 'На страницу мастера' : 'В каталог'}
        </Link>
      </div>,
    );
  }

  const [, m, d] = info.date.split('-');
  const shown = hover || rating;
  return wrap(
    <>
      <h1 className="serif" style={{ fontSize: 30, marginBottom: 4 }}>Как прошёл визит?</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {info.master_name}{info.service ? ` · ${info.service}` : ''}{d && m ? ` · ${d}.${m}` : ''}
      </p>
      <form className="bookform" onSubmit={submit}>
        <div className="bf-field">
          <span className="bf-label">Оценка</span>
          <div className="rv-stars" role="radiogroup" aria-label="Оценка" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} из 5`}
                className={`rv-star${n <= shown ? ' on' : ''}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => { setRating(n); setError(''); }}
              >
                ★
              </button>
            ))}
            <span className="rv-star-label">{LABELS[shown]}</span>
          </div>
        </div>
        <label className="bf-field">
          <span className="bf-label">Что понравилось или что улучшить (необязательно)</span>
          <textarea className="bf-input" rows={4} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        <label className="bf-field">
          <span className="bf-label">Как подписать отзыв</span>
          <input className="bf-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Имя" />
        </label>
        {error && <div className="bf-error">{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', padding: 15 }}>
          {busy ? 'Отправляем…' : 'Отправить отзыв'}
        </button>
        <p className="faint" style={{ textAlign: 'center', fontSize: 12.5, margin: 0 }}>
          Отзыв увидят на странице мастера. Ссылка одноразовая.
        </p>
      </form>
    </>,
  );
}
