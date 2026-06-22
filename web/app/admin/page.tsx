'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import { LoginForm } from '@/components/cabinet/LoginForm';
import { AdminPanel } from '@/components/admin/AdminPanel';

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = getBrowserSupabase();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <p className="muted" style={{ padding: 48, textAlign: 'center' }}>Загрузка…</p>;
  if (!session) return <LoginForm />;
  return <AdminPanel session={session} />;
}
