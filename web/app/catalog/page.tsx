import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MasterCard } from '@/components/MasterCard';
import type { Master } from '@/lib/types';

export const revalidate = 60;

const CATEGORIES = ['Маникюр', 'Барбер', 'Брови', 'Ресницы', 'Косметология', 'Массаж'];

/** Собрать query-строку, сохраняя остальные активные фильтры. */
function hrefWith(base: { q?: string; city?: string }, patch: { q?: string; city?: string }): string {
  const next = { ...base, ...patch };
  const sp = new URLSearchParams();
  if (next.q) sp.set('q', next.q);
  if (next.city) sp.set('city', next.city);
  const s = sp.toString();
  return s ? `/catalog?${s}` : '/catalog';
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { q?: string; city?: string };
}) {
  const q = searchParams.q?.trim();
  const city = searchParams.city?.trim();

  let query = supabase.from('profiles').select('*').eq('published', true);
  if (q) {
    // экранируем символы, ломающие PostgREST or-фильтр; ищем по имени И профессии
    const safe = q.replace(/[(),]/g, ' ');
    query = query.or(`name.ilike.%${safe}%,profession_category.ilike.%${safe}%`);
  }
  if (city) query = query.eq('city', city);
  query = query.order('premium', { ascending: false }).order('rating', { ascending: false });
  const { data } = await query;
  const masters = (data ?? []) as Master[];

  // Список городов опубликованных мастеров — для фильтра.
  const { data: cityRows } = await supabase.from('profiles').select('city').eq('published', true).not('city', 'is', null);
  const cities = Array.from(new Set((cityRows ?? []).map((r) => (r.city as string)?.trim()).filter(Boolean))).sort();

  return (
    <div className="container">
      <div className="sec-head">
        <h2 className="serif">Мастера{city ? ` · ${city}` : ''}</h2>
        <span className="muted">{masters.length} найдено</span>
      </div>

      <div className="row" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <Link href={hrefWith({ city }, { q: undefined })} className={`chip${!q ? ' active' : ''}`}>Все</Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={hrefWith({ city }, { q: c })} className={`chip${q === c ? ' active' : ''}`}>{c}</Link>
        ))}
      </div>

      {cities.length > 1 && (
        <div className="row" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
          <Link href={hrefWith({ q }, { city: undefined })} className={`chip${!city ? ' active' : ''}`}>📍 Все города</Link>
          {cities.map((c) => (
            <Link key={c} href={hrefWith({ q }, { city: c })} className={`chip${city === c ? ' active' : ''}`}>{c}</Link>
          ))}
        </div>
      )}

      {masters.length > 0 ? (
        <div className="grid">{masters.map((m) => <MasterCard key={m.id} m={m} />)}</div>
      ) : (
        <div className="empty">Никого не нашли. Попробуй другую категорию или загляни позже.</div>
      )}
    </div>
  );
}
