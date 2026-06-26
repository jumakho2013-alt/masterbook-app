import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Master } from '@/lib/types';
import { initials, mastersWord, reviewsWord } from '@/lib/format';
import { HOME_CATEGORIES, catalogHref } from '@/lib/categories';
import { CatIcon } from '@/components/CatIcon';
import { MasterCard, isActivePremium } from '@/components/MasterCard';

export const revalidate = 60;

const CITY = 'Душанбе';

// День недели в Душанбе (UTC+5), 0=Вс..6=Сб — как work_days в приложении.
function dushanbeDow(): number {
  return new Date(Date.now() + 5 * 3600 * 1000).getUTCDay();
}

const TrustIcon = ({ d }: { d: React.ReactNode }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>{d}</svg>
);

export default async function HomePage() {
  const today = dushanbeDow();

  // Топ-мастера для секции и hero (реальные, опубликованные).
  const { data: topData } = await supabase
    .from('profiles')
    .select('*')
    .eq('published', true)
    .order('premium', { ascending: false })
    .order('rating', { ascending: false })
    .order('id', { ascending: true })
    .limit(6);
  const masters = (topData ?? []) as Master[];

  // Минимальная цена услуги по каждому показанному мастеру (для «от N сом.»).
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

  // Одним запросом — статистика и счётчики по категориям (честно, без выдумок).
  // TODO(scale): при больших объёмах заменить на RPC с агрегацией на стороне БД.
  const { data: pubData } = await supabase
    .from('profiles')
    .select('profession_category, rating, reviews_count')
    .eq('published', true);
  const pub = (pubData ?? []) as { profession_category: string | null; rating: number; reviews_count: number }[];
  const publishedCount = pub.length;
  const totalReviews = pub.reduce((s, p) => s + (p.reviews_count || 0), 0);
  const rated = pub.filter((p) => (p.reviews_count || 0) > 0);
  const avgRating = rated.length ? rated.reduce((s, p) => s + Number(p.rating || 0), 0) / rated.length : 0;
  const catCount = (name: string) =>
    pub.filter((p) => (p.profession_category || '').toLowerCase().includes(name.toLowerCase())).length;

  const featured = masters[0];

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-main">
            <div className="hero-eyebrow">МАСТЕРА РЯДОМ С ТОБОЙ</div>
            <h1>Найди своего мастера в городе {CITY}</h1>
            <p className="hero-sub">Маникюр, барбер, брови, косметология, массаж и не только. Заявка за минуту — мастер подтвердит запись.</p>
            <div className="hero-cta">
              <Link href="/catalog" className="btn btn-primary btn-lg">Смотреть мастеров</Link>
              <Link href="/catalog" className="btn btn-lg">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--plum)" strokeWidth={1.7}>
                  <rect x="3" y="3" width="7" height="7" rx="1.6" /><rect x="14" y="3" width="7" height="7" rx="1.6" />
                  <rect x="3" y="14" width="7" height="7" rx="1.6" /><rect x="14" y="14" width="7" height="7" rx="1.6" />
                </svg>
                Все услуги
              </Link>
            </div>
          </div>

          {/* декоративный коллаж + (если есть реальные данные) живые плашки */}
          <div className="hero-art">
            <div className="hero-tiles">
              <div className="hero-tile tall" style={{ background: 'var(--plum-soft)' }}>
                <span className="ink" style={{ fontSize: 64 }}>МК</span>
                <span className="tag">МАНИКЮР</span>
              </div>
              <div className="hero-tile" style={{ background: 'var(--gold-soft)' }}>
                <span className="ink" style={{ fontSize: 42 }}>БР</span>
                <span className="tag">БРОВИ</span>
              </div>
              <div className="hero-tile" style={{ background: 'var(--neutral-soft)' }}>
                <span className="ink" style={{ fontSize: 42 }}>БА</span>
                <span className="tag">БАРБЕР</span>
              </div>
            </div>

            {avgRating > 0 && (
              <div className="hero-chip">
                <span className="star" style={{ fontSize: 14 }}>★</span>
                <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>{avgRating.toFixed(1)}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {totalReviews} {reviewsWord(totalReviews)}</span>
              </div>
            )}

            {featured && (
              <div className="hero-feat">
                <div className="hero-feat-ava">{initials(featured.name)}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="serif" style={{ fontSize: 17, fontWeight: 600 }}>{featured.name}</span>
                    {isActivePremium(featured) && <span className="mcard-vip" style={{ position: 'static' }}>VIP</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                    {featured.profession_category || 'Мастер'}{featured.work_days?.includes(today) ? ' · свободен сегодня' : ''}
                  </div>
                </div>
                {featured.slug && (
                  <Link href={`/m/${featured.slug}`} className="mcard-book" style={{ width: 'auto', padding: '0 14px', height: 38, display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
                    Записаться
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== КАТЕГОРИИ ===== */}
      <section className="section">
        <div className="sec-head">
          <div>
            <h2 className="serif">Категории</h2>
            <div className="sub">Выберите услугу — подберём мастера рядом с вами</div>
          </div>
          <Link href="/catalog" className="linkish">Все услуги →</Link>
        </div>
        <div className="cats-grid">
          {HOME_CATEGORIES.map((c) => {
            const n = catCount(c.name);
            return (
              <Link key={c.key} href={catalogHref(c.name)} className="cat-card">
                <div className="cat-top">
                  <span className="cat-ico"><CatIcon name={c.key} /></span>
                  <span className="cat-arrow">→</span>
                </div>
                <div>
                  <div className="cat-name">{c.name}</div>
                  {n > 0 && (
                    <div className="cat-count"><b>{n}</b> {mastersWord(n)}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== ЛУЧШИЕ МАСТЕРА ===== */}
      <section className="section">
        <div className="sec-head">
          <h2 className="serif">Лучшие мастера города</h2>
          <Link href="/catalog" className="linkish">Смотреть все →</Link>
        </div>
        {masters.length > 0 ? (
          <div className="mcards">
            {masters.map((m, i) => (
              <MasterCard key={m.id} m={m} price={priceByMaster[m.id]} freeToday={m.work_days?.includes(today)} toneIndex={i} />
            ))}
          </div>
        ) : (
          <div className="empty">Скоро здесь появятся мастера ✦<br /><span style={{ fontSize: 14 }}>Мы набираем мастеров прямо сейчас.</span></div>
        )}
      </section>

      {/* ===== ДОВЕРИЕ ===== */}
      <section className="section" style={{ paddingTop: 12 }}>
        <div className="trust-grid">
          <div className="trust-card">
            <span className="trust-ico"><TrustIcon d={<><circle cx="10" cy="8" r="3.4" /><path d="M4 20c0-3.3 2.7-5.5 6-5.5" /><path d="M15 18l2 2 4-4" /></>} /></span>
            <div><div className="trust-t">Мастер подтверждает заявку</div><div className="trust-d">Вы записаны только после подтверждения</div></div>
          </div>
          <div className="trust-card">
            <span className="trust-ico"><TrustIcon d={<><path d="M5 9a3 3 0 0 1 3-3h11v12H8a3 3 0 0 1-3-3z" /><path d="M5 9v6" /><circle cx="16" cy="12" r="1.4" fill="currentColor" /></>} /></span>
            <div><div className="trust-t">Оплата у мастера</div><div className="trust-d">На месте, наличными или картой</div></div>
          </div>
          <div className="trust-card">
            <span className="trust-ico"><TrustIcon d={<><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>} /></span>
            <div><div className="trust-t">Запись за минуту</div><div className="trust-d">Без регистрации и анкет</div></div>
          </div>
        </div>
      </section>

      {/* ===== СТАТИСТИКА (только если есть реальные данные) ===== */}
      {publishedCount > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="stats">
            <div className="stat"><div className="stat-n">{publishedCount}</div><div className="stat-l">МАСТЕРОВ</div></div>
            {totalReviews > 0 && <div className="stat"><div className="stat-n">{totalReviews}</div><div className="stat-l">ОТЗЫВОВ</div></div>}
            {avgRating > 0 && <div className="stat"><div className="stat-n"><span className="star">★</span> {avgRating.toFixed(1)}</div><div className="stat-l">СРЕДНИЙ РЕЙТИНГ</div></div>}
            <div className="stat"><div className="stat-n">{HOME_CATEGORIES.length}</div><div className="stat-l">КАТЕГОРИЙ</div></div>
          </div>
        </section>
      )}
    </div>
  );
}
