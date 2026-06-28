import Link from 'next/link';
import type { Master } from '@/lib/types';
import { initials, formatPrice } from '@/lib/format';

const TONES = ['', 'tone-gold', 'tone-neutral'];

export function isActivePremium(m: Pick<Master, 'premium' | 'premium_until'>): boolean {
  return m.premium && (!m.premium_until || new Date(m.premium_until) > new Date());
}

/**
 * Богатая карточка мастера (как в дизайне) — общая для главной и каталога.
 * Показываем только реальные данные: цена приходит из минимальной услуги
 * (price), «Сегодня» — из work_days. Никаких выдуманных слотов/«проверен».
 */
export function MasterCard({
  m,
  price,
  freeToday,
  toneIndex = 0,
}: {
  m: Master;
  price?: number;
  freeToday?: boolean;
  toneIndex?: number;
}) {
  const href = m.slug ? `/m/${m.slug}` : '#';
  const place = [m.district, m.city].filter(Boolean).join(' · ');
  const works = m.portfolio_photos?.length ?? 0;

  return (
    <div className={`mcard${isActivePremium(m) ? ' mcard-premium' : ''}`}>
      <Link href={href} className={`mcard-cover ${TONES[toneIndex % TONES.length]}`} aria-label={`Открыть профиль: ${m.name}`}>
        <span className="ink">{initials(m.name)}</span>
        {isActivePremium(m) && <span className="mcard-vip">VIP</span>}
        {works > 0 && <span className="mcard-works">{works} работ</span>}
      </Link>
      <div className="mcard-body">
        <Link href={href} className="mcard-id">
          <div className="mcard-ava">{initials(m.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="mcard-name">{m.name}</div>
            <div className="mcard-svc">{m.profession_category || 'Мастер'}</div>
          </div>
        </Link>
        {place && (
          <div className="mcard-meta">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.7}>
              <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.4" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place}</span>
            {freeToday && <span className="mcard-today">Сегодня</span>}
          </div>
        )}
        <div className="mcard-foot">
          <div className="mcard-price">{price != null ? <>от <b>{formatPrice(price, m.currency)}</b></> : 'Цена по услуге'}</div>
          {m.reviews_count > 0 && (
            <div className="mcard-rate">
              <span className="star">★</span>
              <span className="v">{Number(m.rating ?? 0).toFixed(1)}</span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>({m.reviews_count})</span>
            </div>
          )}
        </div>
      </div>
      <div className="mcard-foot2">
        <Link href={m.slug ? `${href}#book` : '#'} className="mcard-book" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Записаться
        </Link>
      </div>
    </div>
  );
}
