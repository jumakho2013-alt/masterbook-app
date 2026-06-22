'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase-browser';

type Pending = {
  id: string;
  master_id: string;
  master_name: string;
  amount: number;
  currency: string;
  method: string | null;
  marker: string | null;
  reference: string | null;
  created_at: string;
};

export function AdminPanel({ session }: { session: Session }) {
  const sb = getBrowserSupabase();
  const [items, setItems] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const call = useCallback(
    async (body: Record<string, unknown>) => {
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      return fetch(`${url}/functions/v1/admin-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: anon ?? '',
        },
        body: JSON.stringify(body),
      });
    },
    [sb],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await call({ action: 'list' });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError('Не удалось загрузить список');
        return;
      }
      setItems((data.payments ?? []) as Pending[]);
    } catch {
      setError('Нет связи с сервером');
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: 'confirm' | 'reject') {
    setBusyId(id);
    setError('');
    try {
      const res = await call({ action, payment_id: id });
      if (!res.ok) {
        setError(action === 'confirm' ? 'Не удалось подтвердить' : 'Не удалось отклонить');
        return;
      }
      await load();
    } catch {
      setError('Нет связи с сервером');
    } finally {
      setBusyId('');
    }
  }

  async function logout() {
    await sb.auth.signOut();
  }

  if (loading) return <p className="muted" style={{ padding: 48, textAlign: 'center' }}>Загрузка…</p>;

  if (forbidden) {
    return (
      <div style={{ paddingTop: 40 }}>
        <p className="bf-error">У вас нет доступа к админке ({session.user.email}).</p>
        <button className="btn" onClick={logout} style={{ marginTop: 12 }}>Выйти</button>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 28 }}>
      <div className="spread">
        <h1 className="serif" style={{ fontSize: 32, margin: 0 }}>Оплаты на проверке</h1>
        <button className="btn" onClick={logout}>Выйти</button>
      </div>

      {error && <div className="bf-error" style={{ marginTop: 16 }}>{error}</div>}

      {items.length === 0 ? (
        <p className="muted" style={{ marginTop: 18 }}>Нет платежей на проверке.</p>
      ) : (
        items.map((p) => (
          <div key={p.id} className="cab-section" style={{ gap: 8 }}>
            <div className="spread">
              <strong>{p.master_name}</strong>
              <span className="svc-price" style={{ fontSize: 18 }}>{Number(p.amount).toLocaleString('ru-RU')} {p.currency}</span>
            </div>
            <div className="faint" style={{ fontSize: 13 }}>
              {new Date(p.created_at).toLocaleString('ru-RU')} · {p.method ?? '—'}
              {p.marker ? ` · маркер ${p.marker}` : ''}
              {p.reference ? ` · ${p.reference}` : ''}
            </div>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-primary" disabled={busyId === p.id} onClick={() => act(p.id, 'confirm')}>
                {busyId === p.id ? '…' : 'Подтвердить'}
              </button>
              <button className="btn" disabled={busyId === p.id} onClick={() => act(p.id, 'reject')}>
                Отклонить
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
