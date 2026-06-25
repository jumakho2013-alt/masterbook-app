import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MasterCard } from '@/components/MasterCard';
import type { Master } from '@/lib/types';

export const revalidate = 60;

const CATEGORIES = ['Маникюр', 'Барбер', 'Брови', 'Ресницы', 'Косметология', 'Массаж'];
const PAGE_SIZE = 24;

type Filters = { q?: string; city?: string; page?: number };

/** Собрать query-строку, сохраняя активные фильтры. page добавляем только если > 1. */
function hrefWith(base: Filters, patch: Filters): string {
  const next = { ...base, ...patch };
  const sp = new URLSearchParams();
  if (next.q) sp.set('q', next.q);
  if (next.city) sp.set('city', next.city);
  if (next.page && next.page > 1) sp.set('page', String(next.page));
  const s = sp.toString();
  return s ? `/catalog?${s}` : '/catalog';
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { q?: string; city?: string; page?: string };
}) {
  const q = searchParams.q?.trim();
  const city = searchParams.city?.trim();
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase.from('profiles').select('*').eq('published', true);
  if (q) {
    // экранируем символы, ломающие PostgREST or-фильтр; ищем по имени И профессии
    const safe = q.replace(/[(),]/g, ' ');
    query = query.or(`name.ilike.%${safe}%,profession_category.ilike.%${safe}%`);
  }
  if (city) query = query.eq('city', city);
  // id-tiebreaker → стабильная пагинация при равных premium/rating.
  // Тянем PAGE_SIZE+1, чтобы понять, есть ли следующая страница, без COUNT(*).
  query = query
    .order('premium', { ascending: false })
    .order('rating', { ascending: false })
    .order('id', { ascending: true })
    .range(from, from + PAGE_SIZE);
  const { data } = await query;
  const rows = (data ?? []) as Master[];
  const hasNext = rows.length > PAGE_SIZE;
  const masters = rows.slice(0, PAGE_SIZE);

  // Список городов через RPC (дёшево: только DISTINCT-города, не все профили).
  const { data: cityData } = await supabase.rpc('published_cities');
  const cities = ((cityData as string[] | null) ?? []).filter(Boolean);

  return (
    <div className="container">
      <div className="sec-head">
        <h2 className="serif">Мастера{city ? ` · ${city}` : ''}</h2>
        <span className="muted">{page > 1 ? `Страница ${page}` : `${masters.length}${hasNext ? '+' : ''} найдено`}</span>
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
        <>
          <div className="grid">{masters.map((m) => <MasterCard key={m.id} m={m} />)}</div>
          {(page > 1 || hasNext) && (
            <div className="spread" style={{ marginTop: 28, alignItems: 'center' }}>
              {page > 1 ? (
                <Link href={hrefWith({ q, city }, { page: page - 1 })} className="btn">← Назад</Link>
              ) : <span />}
              {hasNext && (
                <Link href={hrefWith({ q, city }, { page: page + 1 })} className="btn btn-primary">Дальше →</Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="empty">
          {page > 1 ? 'Больше мастеров нет.' : 'Никого не нашли. Попробуй другую категорию или загляни позже.'}
        </div>
      )}
    </div>
  );
}
