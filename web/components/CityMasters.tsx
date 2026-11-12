'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Master } from '@/lib/types';
import { DEFAULT_CITY } from '@/lib/geo';
import { initials } from '@/lib/format';
import { professionLabel } from '@/lib/taxonomy';
import { readSavedCity } from './LocationPicker';
import { MasterCard, isActivePremium } from './MasterCard';

// Главная генерируется на сервере (ISR), а город посетитель выбирает у себя в
// браузере (localStorage). Поэтому фильтр по городу — здесь, на клиенте.
// Раньше главная с заголовком «…в городе Душанбе» показывала мастера из Уфы.

function useSavedCity(): string {
  const [city, setCity] = useState(DEFAULT_CITY);
  useEffect(() => { setCity(readSavedCity()); }, []);
  return city;
}

/** Плашка «мастер дня» в первом экране — только мастер из выбранного города. */
export function HeroFeatured({ masters, today }: { masters: Master[]; today: number }) {
  const city = useSavedCity();
  const m = masters.find((x) => x.city === city && x.slug);
  if (!m) return null;
  return (
    <div className="hero-feat">
      {m.cover_photo
        ? <img className="hero-feat-ava photo" src={m.cover_photo} alt="" />
        : <div className="hero-feat-ava">{initials(m.name)}</div>}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="serif" style={{ fontSize: 17, fontWeight: 600 }}>{m.name}</span>
          {isActivePremium(m) && <span className="mcard-vip" style={{ position: 'static' }}>VIP</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>
          {professionLabel(m.specialization_id, m.profession_category)}
          {m.work_days?.includes(today) ? ' · свободен сегодня' : ''}
        </div>
      </div>
      <Link href={`/m/${m.slug}`} className="mcard-book hero-feat-btn">Записаться</Link>
    </div>
  );
}

/** «Лучшие мастера» выбранного города + честное пустое состояние. */
export function CityMasters({
  masters,
  prices,
  today,
}: {
  masters: Master[];
  prices: Record<string, number>;
  today: number;
}) {
  const city = useSavedCity();
  const here = masters.filter((m) => m.city === city).slice(0, 6);
  const elsewhere = masters.filter((m) => m.city !== city).slice(0, 3);

  return (
    <>
      {here.length > 0 ? (
        <div className="mcards">
          {here.map((m, i) => (
            <MasterCard key={m.id} m={m} price={prices[m.id]} freeToday={m.work_days?.includes(today)} toneIndex={i} />
          ))}
        </div>
      ) : (
        <div className="empty-city">
          <div className="serif empty-city-t">В городе {city} мастера только появляются</div>
          <p className="muted" style={{ margin: '6px 0 18px' }}>
            Вы мастер? Займите место первым — страница с ценами и онлайн-записью бесплатно.
          </p>
          <Link href="/cabinet" className="btn btn-primary">Стать мастером MasterBook</Link>
        </div>
      )}

      {here.length === 0 && elsewhere.length > 0 && (
        <>
          <div className="sec-sub-head">Мастера в других городах</div>
          <div className="mcards">
            {elsewhere.map((m, i) => (
              <MasterCard key={m.id} m={m} price={prices[m.id]} freeToday={m.work_days?.includes(today)} toneIndex={i} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
