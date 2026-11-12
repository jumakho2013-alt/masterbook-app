'use client';

import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase-browser';

type Mode = 'signup' | 'login' | 'reset';

// Вход и регистрация мастера прямо на сайте. Раньше здесь был только вход, а
// регистрация — «в приложении». Но приложения нет в Google Play, и мастер с
// Android не мог попасть в каталог никаким путём. Аккаунт общий с приложением:
// тот же Supabase, профиль создаёт триггер handle_new_user из поля name.
/** loginOnly — для админки: регистрироваться там нечего. */
export function AuthForm({ loginOnly = false, notice: initialNotice = '' }: { loginOnly?: boolean; notice?: string } = {}) {
  const [mode, setMode] = useState<Mode>(loginOnly || initialNotice ? 'login' : 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(initialNotice);

  // /cabinet?login — сразу на вход (ссылка «Войти» в шапке).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('login')) setMode('login');
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setNotice('');
    const mail = email.trim().toLowerCase();

    if (mode === 'signup') {
      if (name.trim().length < 2) return setError('Укажите имя — его увидят клиенты');
      // Тот же порог, что в приложении (src/lib/validation.ts → passwordSchema).
      if (password.length < 6) return setError('Пароль — минимум 6 символов');
    }

    setBusy(true);
    const sb = getBrowserSupabase();
    try {
      if (mode === 'reset') {
        // Ответ одинаковый, есть такой email или нет: иначе форма превращается
        // в способ проверить, зарегистрирован ли человек.
        const { error: err } = await sb.auth.resetPasswordForEmail(mail, {
          redirectTo: `${window.location.origin}/cabinet`,
        });
        if (err && /rate|seconds/i.test(err.message)) {
          setError('Письмо уже отправлено — подождите минуту и попробуйте снова');
        } else {
          setNotice(`Если ${mail} зарегистрирован, на него пришло письмо со ссылкой. Откройте её на этом устройстве.`);
        }
        return;
      }

      if (mode === 'login') {
        const { error: err } = await sb.auth.signInWithPassword({ email: mail, password });
        if (err) setError('Неверный email или пароль');
        return; // при успехе onAuthStateChange на странице покажет кабинет
      }

      const { data, error: err } = await sb.auth.signUp({
        email: mail,
        password,
        options: { data: { name: name.trim() } },
      });
      if (err) {
        setError(/registered|exists/i.test(err.message)
          ? 'Этот email уже зарегистрирован — войдите'
          : /email/i.test(err.message)
            ? 'Проверьте email — похоже, в нём опечатка'
            : 'Не удалось зарегистрироваться, попробуйте ещё раз');
        if (/registered|exists/i.test(err.message)) setMode('login');
        return;
      }
      // Если в проекте включено подтверждение почты, сессии не будет: тогда
      // честно говорим, что делать, а не оставляем человека перед пустой формой.
      if (!data.session) {
        setNotice('Мы отправили письмо на ' + mail + '. Подтвердите адрес и войдите.');
        setMode('login');
      }
    } finally {
      setBusy(false);
    }
  }

  const signup = mode === 'signup';
  const reset = mode === 'reset';
  const switchTo = (m: Mode) => { setMode(m); setError(''); setNotice(''); };

  return (
    <div style={{ maxWidth: 420, margin: '48px auto 0' }}>
      <h1 className="serif" style={{ fontSize: 32, marginBottom: 4 }}>
        {signup ? 'Регистрация мастера' : reset ? 'Восстановление пароля' : loginOnly ? 'Вход' : 'Вход для мастера'}
      </h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {signup
          ? 'Бесплатно. Через пару минут ваша страница с ценами появится в каталоге, и клиенты смогут записываться онлайн.'
          : reset
            ? 'Пришлём на почту ссылку — по ней вы зададите новый пароль.'
            : 'Те же данные, что и в приложении MasterBook.'}
      </p>

      <form className="bookform" onSubmit={submit} style={{ marginTop: 18 }}>
        {signup && (
          <label className="bf-field">
            <span className="bf-label">Имя или название салона</span>
            <input className="bf-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} required />
          </label>
        )}
        <label className="bf-field">
          <span className="bf-label">Email</span>
          <input className="bf-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        {!reset && <label className="bf-field">
          <span className="bf-label">Пароль{signup ? ' (минимум 6 символов)' : ''}</span>
          <input
            className="bf-input" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? 'new-password' : 'current-password'}
            minLength={signup ? 6 : undefined} required
          />
        </label>}
        {mode === 'login' && (
          <button type="button" className="linkbtn" style={{ alignSelf: 'flex-end', fontSize: 14, marginTop: -6 }} onClick={() => switchTo('reset')}>
            Забыли пароль?
          </button>
        )}
        {error && <div className="bf-error">{error}</div>}
        {notice && <div className="bf-notice">{notice}</div>}
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', padding: 15 }}>
          {busy
            ? (signup ? 'Создаём…' : reset ? 'Отправляем…' : 'Входим…')
            : (signup ? 'Создать аккаунт' : reset ? 'Прислать ссылку' : 'Войти')}
        </button>
        {reset && (
          <p className="faint" style={{ textAlign: 'center', fontSize: 14, margin: '4px 0 0' }}>
            <button type="button" className="linkbtn" onClick={() => switchTo('login')}>← Вернуться ко входу</button>
          </p>
        )}
        {!loginOnly && !reset && <p className="faint" style={{ textAlign: 'center', fontSize: 14, margin: '4px 0 0' }}>
          {signup ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
          <button
            type="button" className="linkbtn"
            onClick={() => switchTo(signup ? 'login' : 'signup')}
          >
            {signup ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </p>}
        {signup && (
          <p className="faint" style={{ textAlign: 'center', fontSize: 12, margin: 0 }}>
            Регистрируясь, вы соглашаетесь с <a href="https://jumakho2013-alt.github.io/masterbook-privacy/" target="_blank" rel="noreferrer">политикой конфиденциальности</a>.
          </p>
        )}
      </form>
    </div>
  );
}
