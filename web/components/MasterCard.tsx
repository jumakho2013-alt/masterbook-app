import Link from 'next/link';
import type { Master } from '@/lib/types';
import { initials } from '@/lib/format';

export function MasterCard({ m }: { m: Master }) {
  const href = m.slug ? `/m/${m.slug}` : '#';
  const isPremium = m.premium && (!m.premium_until || new Date(m.premium_until) > new Date());
  const place = [m.district, m.city].filter(Boolean).join(', ');
  return (
    <Link href={href} className="card">
      <div className="card-cover">
        {isPremium && <span className="vip">★ VIP</span>}
        <span className="mono">{initials(m.name)}</span>
      </div>
      <div className="card-body">
        <div className="spread">
          <span className="card-name">{m.name}</span>
          {m.reviews_count > 0 && (
            <span className="rating">★ {m.rating.toFixed(1)}</span>
          )}
        </div>
        {m.bio && <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>{m.bio.slice(0, 60)}</p>}
        {place && <p className="faint" style={{ margin: '8px 0 0', fontSize: 13 }}>{place}</p>}
      </div>
    </Link>
  );
}
