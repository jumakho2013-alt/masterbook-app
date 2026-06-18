import { createClient } from '@supabase/supabase-js';

// Публичный (anon) клиент для server-components. RLS на стороне БД пускает
// читать только опубликованных мастеров + их услуги/отзывы — приватная CRM
// (клиенты/записи/финансы) анониму недоступна.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Падаем рано и понятно, а не «тихо ничего не грузится».
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (см. .env.local.example)');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});
