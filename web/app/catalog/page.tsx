import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MasterCard } from '@/components/MasterCard';
import type { Master } from '@/lib/types';
import { HOME_CATEGORIES } from '@/lib/categories';
import { mastersWord } from '@/lib/format';
import { groupCitiesByCountry } from '@/lib/geo';

export const revalidate = 60;

const PAGE_SIZE = 24;
const SORTS = [
  { key: 'premium', label: 'Сначала премиум' },
  { key: 'rating', label: 'По рейтингу' },
] as const;

type Filters = { q?: string; city?: string; sort?: string; page?: number };

/** Собрать query-строку, сохраняя активные фильтры. */
function hrefWith(base: Filters, patch: Filters): string {
  const next = { ...base, ...patch };
  const sp = new URLSearchParams();
  if (next.q) sp.set('q', next.q);
  if (next.city) sp.set('city', next.city);
  if (next.sort && next.sort !== 'premium') sp.set('sort', next.sort);
  if (next.page && next.page > 1) sp.set('page', String(next.page));
  const s = sp.toString();
  return s ? `/catalog?${s}` : '/catalog';
}

function dushanbeDow(): number {
  return new Date(Date.now() + 5 * 3600 * 1000).getUTCDay();
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { q?: string; city?: string; page?: string; sort?: string };
}) {
  const q = searchParams.q?.trim();
  const city = searchParams.city?.trim();
  const sort = searchParams.sort === 'rating' ? 'rating' : 'premium';
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase.from('profiles').select('*', { count: 'exact' }).eq('published', true);
  if (q) {
    const safe = q.replace(/[(),]/g, ' ');
    query = query.or(`name.ilike.%${safe}%,profession_category.ilike.%${safe}%`);
  }
  if (city) query = query.eq('city', city);
  if (sort === 'rating') {
    query = query.order('rating', { ascending: false }).order('id', { ascending: true });
  } else {
    query = query.order('premium', { ascending: false }).order('rating', { ascending: false }).order('id', { ascending: true });
  }
  query = query.range(from, from + PAGE_SIZE);
  const { data, count } = await query;
  const rows = (data ?? []) as Master[];
  const hasNext = rows.length > PAGE_SIZE;
  const masters = rows.slice(0, PAGE_SIZE);
  const total = count ?? masters.length;

  // Минимальные цены для показанных мастеров (для «от N сом.» на карточке).
  const priceByMaster: Record<string, number> = {};
  if (masters.length) {
    const { data: svc } = await supabase
      .from('services')
      .select('user_id, price')
      .in('user_id', masters.map((m) => m.id))
      .is('deleted_at', null);
    for (const s of (svc ?? []) as { user_id: string; price: number }[]) {
      if (priceByMaster[s.user_id] == null || s.price < priceByMaster[s.user_id]) priceByMaster[s.user_id] = s.price;
    }
  }

  const { data: cityData } = await supabase.rpc('published_cities');
  const cities = ((cityData as string[] | null) ?? []).filter(Boolean);
  const cityGroups = groupCitiesByCountry(cities);
  const today = dushanbeDow();

  return (
    <div className="cat-page">
      <h1 className="cat-title">Мастера{city ? ` в городе ${city}` : ''}</h1>
      <div className="cat-count2">
        {page > 1 ? `Страница ${page}` : <><b>{total}</b> {mastersWord(total)} · {SORTS.find((s) => s.key === sort)?.label.toLowerCase()}</>}
      </div>

      {/* категории */}
      <div className="chips">
        <Link href={hrefWith({ city, sort }, { q: undefined })} className={`chip${!q ? ' active' : ''}`}>Все</Link>
        {HOME_CATEGORIES.map((c) => (
          <Link key={c.key} href={hrefWith({ city, sort }, { q: c.name })} className={`chip${q === c.name ? ' active' : ''}`}>{c.name}</Link>
        ))}
      </div>

      {/* города — сгруппированы по стране (мастер из другой страны не смешивается) */}
      {cities.length > 1 && (
        <div style={{ marginBottom: 4 }}>
          <div className="chips">
            <Link href={hrefWith({ q, sort }, { city: undefined })} className={`chip${!city ? ' active' : ''}`}>📍 Все города</Link>
          </div>
          {cityGroups.map((g) => (
            <div key={g.country} className="chips" style={{ marginTop: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: 'var(--text3)', marginRight: 2 }}>{g.country}</span>
              {g.cities.map((c) => (
                <Link key={c} href={hrefWith({ q, sort }, { city: c })} className={`chip${city === c ? ' active' : ''}`}>{c}</Link>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* сортировка */}
      <div className="chips" style={{ marginBottom: 22, alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: 'var(--text3)', marginRight: 2 }}>СОРТИРОВКА</span>
        {SORTS.map((s) => (
          <Link key={s.key} href={hrefWith({ q, city }, { sort: s.key })} className={`chip${sort === s.key ? ' active' : ''}`}>{s.label}</Link>
        ))}
      </div>

      {masters.length > 0 ? (
        <>
          <div className="mcards">
            {masters.map((m, i) => (
              <MasterCard key={m.id} m={m} price={priceByMaster[m.id]} freeToday={m.work_days?.includes(today)} toneIndex={i} />
            ))}
          </div>
          {(page > 1 || hasNext) && (
            <div className="spread" style={{ marginTop: 28, alignItems: 'center' }}>
              {page > 1 ? <Link href={hrefWith({ q, city, sort }, { page: page - 1 })} className="btn">← Назад</Link> : <span />}
              {hasNext && <Link href={hrefWith({ q, city, sort }, { page: page + 1 })} className="btn btn-primary">Дальше →</Link>}
            </div>
          )}
        </>
      ) : (
        <div className="empty">{page > 1 ? 'Больше мастеров нет.' : 'Никого не нашли. Попробуйте другую категорию или загляните позже.'}</div>
      )}
    </div>
  );
}
