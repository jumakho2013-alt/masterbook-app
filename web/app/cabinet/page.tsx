'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import { AuthForm } from '@/components/cabinet/AuthForm';
import { Dashboard } from '@/components/cabinet/Dashboard';
import { NewPasswordForm } from '@/components/cabinet/NewPasswordForm';

export default function CabinetPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [linkNotice, setLinkNotice] = useState('');

  useEffect(() => {
    // Хэш читаем ДО создания клиента: он разбирает ссылку из письма и стирает
    // её из адреса. Просроченная ссылка приходит как #error_code=otp_expired.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get('type') === 'recovery') setRecovery(true);
    if (hash.get('error_code') || hash.get('error')) {
      setLinkNotice(hash.get('error_code') === 'otp_expired'
        ? 'Ссылка из письма устарела или уже использована. Запросите новую через «Забыли пароль?».'
        : 'Ссылка из письма не сработала. Попробуйте войти или запросите новую.');
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    const sb = getBrowserSupabase();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') setRecovery(false);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <p className="muted" style={{ padding: 48, textAlign: 'center' }}>Загрузка…</p>;
  if (!session) return <AuthForm notice={linkNotice} />;
  if (recovery) return <NewPasswordForm onDone={() => setRecovery(false)} />;
  return <Dashboard session={session} />;
}
