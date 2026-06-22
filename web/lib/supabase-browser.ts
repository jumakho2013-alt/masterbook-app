'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Браузерный клиент для кабинета/админки: хранит сессию, чтобы вход через
// Supabase Auth (та же база, что у приложения) переживал перезагрузку. Все
// запросы идут под JWT мастера — RLS пускает только к своим строкам.
let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (см. .env.local.example)');
  }
  client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'mb-cabinet-auth',
    },
  });
  return client;
}
