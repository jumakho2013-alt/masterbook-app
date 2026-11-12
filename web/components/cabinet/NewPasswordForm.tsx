'use client';

import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase-browser';

// Второй шаг «Забыли пароль?»: человек пришёл по ссылке из письма, Supabase
// уже выдал ему временную сессию (событие PASSWORD_RECOVERY). Без этого экрана
// он молча попадал бы в кабинет со старым, забытым паролем.
export function NewPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (password.length < 6) return setError('Пароль — минимум 6 символов');
    if (password !== repeat) return setError('Пароли не совпадают');
    setBusy(true);
    try {
      const { error: err } = await getBrowserSupabase().auth.updateUser({ password });
      if (err) {
        setError(/different|same/i.test(err.message)
          ? 'Новый пароль совпадает со старым — придумайте другой'
          : 'Не удалось сменить пароль. Запросите новую ссылку и попробуйте ещё раз.');
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '48px auto 0' }}>
      <h1 className="serif" style={{ fontSize: 32, marginBottom: 4 }}>Новый пароль</h1>
      <p className="muted" style={{ marginTop: 0 }}>Он подойдёт и для сайта, и для приложения MasterBook.</p>
      <form className="bookform" onSubmit={submit} style={{ marginTop: 18 }}>
        <label className="bf-field">
          <span className="bf-label">Новый пароль (минимум 6 символов)</span>
          <input className="bf-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={6} required autoFocus />
        </label>
        <label className="bf-field">
          <span className="bf-label">Повторите пароль</span>
          <input className="bf-input" type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" minLength={6} required />
        </label>
        {error && <div className="bf-error">{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', padding: 15 }}>
          {busy ? 'Сохраняем…' : 'Сохранить и войти'}
        </button>
      </form>
    </div>
  );
}
