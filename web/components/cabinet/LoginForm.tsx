'use client';

import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase-browser';

// Только вход. Регистрация мастеров — в приложении MasterBook (там же создаётся
// профиль через триггер handle_new_user). Сайт использует те же учётные данные.
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    const { error } = await getBrowserSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) setError('Неверный email или пароль');
    // при успехе onAuthStateChange на странице сам покажет кабинет
  }

  return (
    <div style={{ maxWidth: 400, margin: '48px auto 0' }}>
      <h1 className="serif" style={{ fontSize: 32, marginBottom: 4 }}>Кабинет мастера</h1>
      <p className="muted" style={{ marginTop: 0 }}>Войдите теми же данными, что и в приложении MasterBook.</p>

      <form className="bookform" onSubmit={submit} style={{ marginTop: 18 }}>
        <label className="bf-field">
          <span className="bf-label">Email</span>
          <input className="bf-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="bf-field">
          <span className="bf-label">Пароль</span>
          <input className="bf-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <div className="bf-error">{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', padding: 15 }}>
          {busy ? 'Входим…' : 'Войти'}
        </button>
        <p className="faint" style={{ textAlign: 'center', fontSize: 14, margin: '4px 0 0' }}>
          Нет аккаунта? Зарегистрируйтесь в приложении MasterBook.
        </p>
      </form>
    </div>
  );
}
