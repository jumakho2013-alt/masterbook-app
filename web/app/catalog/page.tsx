import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MasterCard } from '@/components/MasterCard';
import type { Master } from '@/lib/types';
import { HOME_CATEGORIES } from '@/lib/categories';
import { SPECIALIZATION_LABELS } from '@/lib/taxonomy';
import { mastersWord } from '@/lib/format';
import { groupCitiesByCountry } from '@/lib/geo';

export const revalidate = 60;

/** Динамический SEO-заголовок под фильтры: «Мастера маникюра в Душанбе» и т.п.
 *  Без этого все /catalog?* делили один общий title. */
export function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string; city?: string; spec?: string };
}) {
  const q = searchParams.q?.trim();
  const city = searchParams.city?.trim();
  const specLabel = searchParams.spec ? SPECIALIZATION_LABELS[searchParams.spec] : undefined;
  const parts = ['Мастера'];
  if (specLabel) parts.push('—', specLabel);
  if (q) parts.push(q);
  if (city) parts.push(`в городе ${city}`);
  const canonicalSp = new URLSearchParams();
  if (searchParams.spec) canonicalSp.set('spec', searchParams.spec);
  if (city) canonicalSp.set('city', city);
  const canonicalPath = canonicalSp.toString() ? `/catalog?${canonicalSp}` : '/catalog';
  const title = `${parts.join(' ')} — MasterBook`;
  const description = city
    ? `Найдите мастера${q ? ' «' + q + '»' : ''} в городе ${city}: рейтинг, цены, онлайн-запись.`
    : `Каталог мастеров${q ? ' «' + q + '»' : ''}: рейтинг, цены и запись онлайн.`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: { title, description },
  };
}

const PAGE_SIZE = 24;
const SORTS = [
  { key: 'premium', label: 'Сначала премиум' },
  { key: 'rating', label: 'По рейтингу' },
] as const;

type Filters = { q?: string; city?: string; spec?: string; sort?: string; page?: number };

/** Собрать query-строку, сохраняя активные фильтры. */
function hrefWith(base: Filters, patch: Filters): string {
  const next = { ...base, ...patch };
  const sp = new URLSearchParams();
  if (next.q) sp.set('q', next.q);
  if (next.spec) sp.set('spec', next.spec);
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
  searchParams: { q?: string; city?: string; spec?: string; page?: string; sort?: string };
}) {
  const q = searchParams.q?.trim();
  const city = searchParams.city?.trim();
  const spec = searchParams.spec?.trim();
  const sort = searchParams.sort === 'rating' ? 'rating' : 'premium';
  // Потолок глубины: без него ?page=5000 давал OFFSET 120000 — полная
  // сортировка таблицы на каждый запрос, и каждый номер страницы — отдельный
  // ключ кеша, то есть готовый вектор для краулера.
  const MAX_PAGE = 200;
  const page = Math.min(MAX_PAGE, Math.max(1, Number(searchParams.page ?? '1') || 1));
  const from = (page - 1) * PAGE_SIZE;

  // count: 'estimated' берёт оценку у планировщика (0 мс) вместо полного скана
  // таблицы на КАЖДЫЙ рендер каталога (замер на 100k: 46.7 мс seq scan).
  // Для подписи «N мастеров» точность до строки не нужна.
  // Явный список колонок вместо select('*'): карточке нужно ~0.4 КБ, а '*'
  // тянул ~3 КБ на мастера (bio, 12 URL портфолио, рабочие часы, контакты) —
  // семикратный перебор трафика на каждой странице каталога.
  let query = supabase
    .from('profiles')
    .select('id,name,slug,specialization_id,profession_category,city,district,premium,premium_until,rating,reviews_count,work_days,currency,photos_count', { count: 'estimated' })
    .eq('published', true);
  // Точный фильтр по специализации (в БД лежат id вида 'nails', не русские слова).
  if (spec) query = query.eq('specialization_id', spec);
  // Свободный поиск — только по имени: в profession_category хранятся id,
  // искать в них русский текст бессмысленно.
  if (q) {
    const safe = q.replace(/[(),]/g, ' ').replace(/[%_]/g, '\\$&');
    query = query.ilike('name', `%${safe}%`);
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
      <h1 className="cat-title">
        {spec && SPECIALIZATION_LABELS[spec] ? `${SPECIALIZATION_LABELS[spec]}` : 'Мастера'}
        {city ? ` в городе ${city}` : ''}
      </h1>
      <div className="cat-count2">
        {page > 1 ? `Страница ${page}` : <><b>{total}</b> {mastersWord(total)} · {SORTS.find((s) => s.key === sort)?.label.toLowerCase()}</>}
      </div>

      {/* категории */}
      <div className="chips">
        <Link href={hrefWith({ q, city, sort }, { spec: undefined })} className={`chip${!spec ? ' active' : ''}`}>Все</Link>
        {HOME_CATEGORIES.map((c) => (
          <Link key={c.key} href={hrefWith({ q, city, sort }, { spec: c.key })} className={`chip${spec === c.key ? ' active' : ''}`}>{c.name}</Link>
        ))}
      </div>

      {/* города — сгруппированы по стране (мастер из другой страны не смешивается) */}
      {cities.length > 1 && (
        <div style={{ marginBottom: 4 }}>
          <div className="chips">
            <Link href={hrefWith({ q, spec, sort }, { city: undefined })} className={`chip${!city ? ' active' : ''}`}>📍 Все города</Link>
          </div>
          {cityGroups.map((g) => (
            <div key={g.country} className="chips" style={{ marginTop: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: 'var(--text3)', marginRight: 2 }}>{g.country}</span>
              {g.cities.map((c) => (
                <Link key={c} href={hrefWith({ q, spec, sort }, { city: c })} className={`chip${city === c ? ' active' : ''}`}>{c}</Link>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* сортировка */}
      <div className="chips" style={{ marginBottom: 22, alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: 'var(--text3)', marginRight: 2 }}>СОРТИРОВКА</span>
        {SORTS.map((s) => (
          <Link key={s.key} href={hrefWith({ q, spec, city }, { sort: s.key })} className={`chip${sort === s.key ? ' active' : ''}`}>{s.label}</Link>
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
              {page > 1 ? <Link href={hrefWith({ q, spec, city, sort }, { page: page - 1 })} className="btn">← Назад</Link> : <span />}
              {hasNext && <Link href={hrefWith({ q, spec, city, sort }, { page: page + 1 })} className="btn btn-primary">Дальше →</Link>}
            </div>
          )}
        </>
      ) : (
        <div className="empty">{page > 1 ? 'Больше мастеров нет.' : 'Никого не нашли. Попробуйте другую категорию или загляните позже.'}</div>
      )}
    </div>
  );
}
