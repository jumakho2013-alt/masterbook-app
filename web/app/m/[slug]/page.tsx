import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Master, Service, Review } from '@/lib/types';
import { formatPrice, initials, whatsappLink, telLink, reviewsWord } from '@/lib/format';
import { isActivePremium } from '@/components/MasterCard';
import { BookingForm } from '@/components/BookingForm';

export const revalidate = 60;

function dushanbeDow(): number {
  return new Date(Date.now() + 5 * 3600 * 1000).getUTCDay();
}
function reviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  } catch {
    return '';
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: m } = await supabase
    .from('profiles')
    .select('name, bio, city, district')
    .eq('slug', params.slug)
    .eq('published', true)
    .maybeSingle();
  if (!m) return { title: 'Мастер не найден — MasterBook' };
  const place = [m.district, m.city].filter(Boolean).join(', ');
  const title = `${m.name}${place ? ` · ${place}` : ''} — MasterBook`;
  const description = (m.bio?.trim() || `Запишитесь к мастеру ${m.name} онлайн за минуту.`).slice(0, 160);
  const url = `/m/${params.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'profile', siteName: 'MasterBook', locale: 'ru_RU', url },
    twitter: { card: 'summary', title, description },
  };
}

const WhatsAppIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.3-.2-2.6.7.7-2.5-.2-.3A8 8 0 0 1 12 4z" /></svg>
);
const PhoneIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}><path d="M5 4h3l2 5-2 1c1 2 3 4 5 5l1-2 5 2v3c0 1-1 2-2 2A16 16 0 0 1 3 6c0-1 1-2 2-2z" /></svg>
);

export default async function MasterPage({ params }: { params: { slug: string } }) {
  const { data: m } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .maybeSingle();
  if (!m) notFound();
  const master = m as Master;

  const [{ data: svc }, { data: rev }] = await Promise.all([
    supabase.from('services').select('*').eq('user_id', master.id).is('deleted_at', null).order('price', { ascending: true }),
    supabase
      .from('reviews')
      .select('*')
      .eq('master_id', master.id)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);
  const services = (svc ?? []) as Service[];
  const reviews = (rev ?? []) as Review[];

  const place = [master.district, master.city].filter(Boolean).join(', ');
  const isPremium = isActivePremium(master);
  const prices = services.map((s) => s.price).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const freeToday = master.work_days?.includes(dushanbeDow());
  const photos = master.portfolio_photos ?? [];

  // Structured data (schema.org) — Google показывает звёзды/инфо в выдаче,
  // выше CTR. Только реальные поля; цены не указываем (валюта зависит от страны).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: master.name,
    url: `https://masterbook-app.vercel.app/m/${master.slug}`,
    ...(master.city
      ? { address: { '@type': 'PostalAddress', addressLocality: master.city, ...(master.district ? { streetAddress: master.district } : {}) } }
      : {}),
    ...(master.reviews_count > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(master.rating ?? 0).toFixed(1), reviewCount: master.reviews_count } }
      : {}),
    ...(services.length
      ? { makesOffer: services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name } })) }
      : {}),
  };

  const cta = master.whatsapp
    ? { href: whatsappLink(master.whatsapp, 'Здравствуйте! Хочу записаться (нашёл вас на MasterBook).'), label: 'Написать в WhatsApp' }
    : master.public_phone
      ? { href: telLink(master.public_phone), label: 'Позвонить и записаться' }
      : null;

  return (
    <div className="prof-wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* cover */}
      <div className="prof-cover" style={{ height: 210 }}>
        <span className="ink" style={{ fontSize: 100 }}>{initials(master.name)}</span>
        <Link href="/catalog" className="prof-back">← Каталог</Link>
        {isPremium && <span className="vip-static prof-vip-top">★ VIP-МАСТЕР</span>}
      </div>

      <div className="prof-body">
        {/* header */}
        <div className="prof-head">
          <div className="prof-ava">{initials(master.name)}</div>
          <div style={{ paddingBottom: 4, minWidth: 0 }}>
            <h1 className="prof-name">{master.name}</h1>
            <div className="prof-meta">{master.profession_category || 'Мастер'}</div>
            <div className="prof-metarow">
              {master.reviews_count > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="star" style={{ letterSpacing: 1 }}>★</span>
                  <span className="serif" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{Number(master.rating ?? 0).toFixed(1)}</span>
                  ({master.reviews_count} {reviewsWord(master.reviews_count)})
                </span>
              )}
              {place && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.7}><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.4" /></svg>
                  {place}
                </span>
              )}
              {freeToday && <span className="mcard-today">Свободен сегодня</span>}
            </div>
          </div>
        </div>

        {/* info strip — только реальные данные */}
        {(master.work_hours_start || cta) && (
          <div className="prof-infostrip">
            {master.work_hours_start && master.work_hours_end && (
              <span style={{ fontSize: 13, color: 'var(--text)' }}>
                <b style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{master.work_hours_start}–{master.work_hours_end}</b> рабочие часы
              </span>
            )}
            <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>Запись онлайн · заявку подтверждает мастер</span>
          </div>
        )}

        <div className="prof-cols">
          {/* main */}
          <div className="prof-main">
            {photos.length > 0 && (
              <div>
                <div className="prof-eyebrow">МОИ РАБОТЫ</div>
                <div className="gallery-grid">
                  {photos.map((src, i) => (
                    <div key={i} className="gallery-cell"><img src={src} alt={`Работа ${i + 1}`} loading="lazy" /></div>
                  ))}
                </div>
              </div>
            )}

            {services.length > 0 && (
              <div>
                <div className="prof-eyebrow">УСЛУГИ И ЦЕНЫ</div>
                <div className="svc-list">
                  {services.map((s) => (
                    <div key={s.id} className="svc-row">
                      <div>
                        <div className="svc-name">{s.name}</div>
                        <div className="svc-dur">{s.duration} мин</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 'none' }}>
                        <span className="svc-price">{formatPrice(s.price, master.currency)}</span>
                        <a href="#book" className="svc-choose">Выбрать</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviews.length > 0 && (
              <div>
                <div className="spread" style={{ marginBottom: 14 }}>
                  <div className="prof-eyebrow" style={{ margin: 0 }}>ОТЗЫВЫ</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span className="star">★</span>
                    <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>{Number(master.rating ?? 0).toFixed(1)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>· {master.reviews_count} {reviewsWord(master.reviews_count)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.map((r) => (
                    <div key={r.id} className="review-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 9 }}>
                        <div className="review-ava">{initials(r.client_name || 'К')}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.client_name || 'Клиент'}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{reviewDate(r.created_at)}</div>
                        </div>
                        <span className="star" style={{ fontSize: 13, letterSpacing: 1 }}>{'★'.repeat(Math.max(1, Math.min(5, r.rating)))}</span>
                      </div>
                      {r.comment && <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text2)', margin: 0 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(master.bio || place) && (
              <div>
                <div className="prof-eyebrow">О МАСТЕРЕ</div>
                {master.bio && <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--text2)', margin: '0 0 18px', maxWidth: 620 }}>{master.bio}</p>}
                {place && <div style={{ fontSize: 13.5, color: 'var(--text)' }}>📍 {place}</div>}
              </div>
            )}

            {/* booking */}
            <div id="book">
              <div className="prof-eyebrow">ОНЛАЙН-ЗАПИСЬ</div>
              <BookingForm
                slug={master.slug ?? ''}
                services={services.map((s) => ({ id: s.id, name: s.name, price: s.price, duration: s.duration }))}
                workHoursStart={master.work_hours_start}
                workHoursEnd={master.work_hours_end}
                workDays={master.work_days}
                contact={cta}
              />
            </div>
          </div>

          {/* aside (desktop) */}
          <aside className="prof-aside u-desktop">
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{minPrice != null ? 'Запись от' : 'Онлайн-запись'}</div>
            {minPrice != null && (
              <div className="aside-price">{formatPrice(minPrice, master.currency)}</div>
            )}
            <div style={{ fontSize: 12.5, color: 'var(--text2)', margin: '6px 0 20px' }}>Оплата у мастера · заявку подтверждает мастер</div>
            <a href="#book" className="btn btn-primary btn-block btn-lg" style={{ height: 54 }}>Записаться онлайн</a>
            {(master.whatsapp || master.public_phone) && (
              <div className="aside-contacts">
                {master.whatsapp && (
                  <a className="aside-contact" style={{ color: 'var(--money)' }} href={whatsappLink(master.whatsapp, 'Здравствуйте! Хочу записаться (нашёл вас на MasterBook).')} target="_blank" rel="noreferrer"><WhatsAppIcon /> WhatsApp</a>
                )}
                {master.public_phone && (
                  <a className="aside-contact" style={{ color: 'var(--plum)' }} href={telLink(master.public_phone)}><PhoneIcon /> Позвонить</a>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* mobile sticky CTA */}
      <div className="prof-mobile-cta">
        <div style={{ flex: 'none' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{minPrice != null ? 'от' : ''}</div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
            {minPrice != null ? formatPrice(minPrice, master.currency) : 'Запись'}
          </div>
        </div>
        <a href="#book" className="btn btn-primary" style={{ flex: 1, height: 50 }}>Записаться</a>
        {master.whatsapp && (
          <a className="aside-contact" style={{ width: 50, flex: 'none', color: 'var(--money)' }} href={whatsappLink(master.whatsapp)} target="_blank" rel="noreferrer"><WhatsAppIcon /></a>
        )}
      </div>
    </div>
  );
}
