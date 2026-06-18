import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MasterCard } from '@/components/MasterCard';
import type { Master } from '@/lib/types';

export const revalidate = 60;

const CATEGORIES = ['Маникюр', 'Барбер', 'Брови', 'Ресницы', 'Косметология', 'Массаж'];

export default async function HomePage() {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('published', true)
    .order('premium', { ascending: false })
    .order('rating', { ascending: false })
    .limit(8);
  const masters = (data ?? []) as Master[];

  return (
    <div className="container">
      <section className="hero">
        <span className="label">Мастера рядом с тобой</span>
        <h1>Найди своего мастера<br />в городе Душанбе</h1>
        <p>Маникюр, барбер, брови, косметология, массаж и не только. Запись за минуту — без регистрации.</p>
        <form className="searchbar" action="/catalog">
          <input name="q" placeholder="Маникюр, барбер, брови…" aria-label="Поиск мастера" />
          <button className="btn btn-primary" type="submit">Искать</button>
        </form>
      </section>

      <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/catalog?q=${encodeURIComponent(c)}`} className="chip">{c}</Link>
        ))}
      </div>

      <div className="sec-head">
        <h2>Лучшие мастера</h2>
        <Link href="/catalog" className="muted">Весь каталог →</Link>
      </div>
      {masters.length > 0 ? (
        <div className="grid">{masters.map((m) => <MasterCard key={m.id} m={m} />)}</div>
      ) : (
        <div className="empty">Скоро здесь появятся мастера ✦</div>
      )}
    </div>
  );
}
