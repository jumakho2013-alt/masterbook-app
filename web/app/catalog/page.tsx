import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MasterCard } from '@/components/MasterCard';
import type { Master } from '@/lib/types';

export const revalidate = 60;

const CATEGORIES = ['Маникюр', 'Барбер', 'Брови', 'Ресницы', 'Косметология', 'Массаж'];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { q?: string; city?: string };
}) {
  const q = searchParams.q?.trim();
  const city = searchParams.city?.trim();

  let query = supabase.from('profiles').select('*').eq('published', true);
  if (q) query = query.ilike('name', `%${q}%`);
  if (city) query = query.eq('city', city);
  query = query.order('premium', { ascending: false }).order('rating', { ascending: false });
  const { data } = await query;
  const masters = (data ?? []) as Master[];

  return (
    <div className="container">
      <div className="sec-head">
        <h2 className="serif">Мастера{city ? ` в городе ${city}` : ''}</h2>
        <span className="muted">{masters.length} найдено</span>
      </div>

      <div className="row" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
        <Link href="/catalog" className={`chip${!q ? ' active' : ''}`}>Все</Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/catalog?q=${encodeURIComponent(c)}`} className={`chip${q === c ? ' active' : ''}`}>{c}</Link>
        ))}
      </div>

      {masters.length > 0 ? (
        <div className="grid">{masters.map((m) => <MasterCard key={m.id} m={m} />)}</div>
      ) : (
        <div className="empty">Никого не нашли. Попробуй другую категорию или загляни позже.</div>
      )}
    </div>
  );
}
