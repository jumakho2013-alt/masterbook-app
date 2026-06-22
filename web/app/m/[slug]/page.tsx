import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Master, Service, Review } from '@/lib/types';
import { formatPrice, initials, whatsappLink, telLink } from '@/lib/format';
import { BookingForm } from '@/components/BookingForm';

export const revalidate = 60;

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
  return {
    title,
    description,
    openGraph: { title, description, type: 'profile' },
  };
}

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
    supabase.from('services').select('*').eq('user_id', master.id).order('price', { ascending: true }),
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
  const isPremium = master.premium && (!master.premium_until || new Date(master.premium_until) > new Date());

  const cta = master.whatsapp
    ? { href: whatsappLink(master.whatsapp, 'Здравствуйте! Хочу записаться (нашёл вас на MasterBook).'), label: 'Написать в WhatsApp' }
    : master.public_phone
      ? { href: telLink(master.public_phone), label: 'Позвонить и записаться' }
      : null;

  return (
    <div className="container" style={{ maxWidth: 760, paddingBottom: 40 }}>
      <div className="prof-cover"><span className="mono">{initials(master.name)}</span></div>

      <div className="prof-head">
        <div className="prof-ava">{initials(master.name)}</div>
        <div>
          <h1 className="serif" style={{ margin: 0, fontSize: 34 }}>{master.name}</h1>
          {place && <p className="muted" style={{ margin: '2px 0' }}>{place}</p>}
          <div className="row" style={{ gap: 12 }}>
            {master.reviews_count > 0 && (
              <span className="rating">★ {master.rating.toFixed(1)} · {master.reviews_count} отзывов</span>
            )}
            {isPremium && <span className="vip" style={{ position: 'static' }}>★ VIP</span>}
          </div>
        </div>
      </div>

      {master.bio && <p style={{ marginTop: 24, fontSize: 17, lineHeight: 1.6 }}>{master.bio}</p>}

      {services.length > 0 && (
        <section>
          <h2 className="serif" style={{ marginTop: 32 }}>Услуги и цены</h2>
          {services.map((s) => (
            <div key={s.id} className="svc">
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div className="faint" style={{ fontSize: 13 }}>{s.duration} мин</div>
              </div>
              <span className="svc-price">{formatPrice(s.price)}</span>
            </div>
          ))}
        </section>
      )}

      {reviews.length > 0 && (
        <section>
          <h2 className="serif" style={{ marginTop: 32 }}>Отзывы</h2>
          {reviews.map((r) => (
            <div key={r.id} className="review">
              <div className="spread">
                <strong>{r.client_name || 'Клиент'}</strong>
                <span className="rating">★ {r.rating}</span>
              </div>
              {r.comment && <p className="muted" style={{ margin: '6px 0 0' }}>{r.comment}</p>}
            </div>
          ))}
        </section>
      )}

      <section id="book">
        <h2 className="serif" style={{ marginTop: 36 }}>Записаться онлайн</h2>
        <BookingForm
          slug={master.slug ?? ''}
          services={services.map((s) => ({ id: s.id, name: s.name, price: s.price, duration: s.duration }))}
          workHoursStart={master.work_hours_start}
          workHoursEnd={master.work_hours_end}
          workDays={master.work_days}
          contact={cta}
        />
      </section>

      <div className="sticky-cta">
        <a href="#book" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 16 }}>
          Записаться онлайн
        </a>
      </div>
    </div>
  );
}
