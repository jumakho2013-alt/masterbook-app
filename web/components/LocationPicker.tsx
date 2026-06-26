'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { COUNTRIES, DEFAULT_CITY, DEFAULT_COUNTRY, countryOfCity } from '@/lib/geo';
import { catalogHref } from '@/lib/categories';

const CITY_KEY = 'mb-city';
const COUNTRY_KEY = 'mb-country';

/** Прочитать сохранённый город (или дефолт) — только на клиенте. */
export function readSavedCity(): string {
  if (typeof window === 'undefined') return DEFAULT_CITY;
  try {
    return localStorage.getItem(CITY_KEY) || DEFAULT_CITY;
  } catch {
    return DEFAULT_CITY;
  }
}

const PinIcon = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="var(--plum)" strokeWidth={1.7}>
    <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.4" />
  </svg>
);

export function LocationPicker({ variant = 'pill' }: { variant?: 'pill' | 'inline' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [draftCountry, setDraftCountry] = useState(DEFAULT_COUNTRY);

  useEffect(() => {
    const c = readSavedCity();
    const co = countryOfCity(c) || (typeof window !== 'undefined' && localStorage.getItem(COUNTRY_KEY)) || DEFAULT_COUNTRY;
    setCity(c);
    setCountry(co);
    setDraftCountry(co);
  }, []);

  // Esc закрывает модалку.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function choose(nextCity: string) {
    try {
      localStorage.setItem(CITY_KEY, nextCity);
      localStorage.setItem(COUNTRY_KEY, draftCountry);
    } catch { /* приватный режим — просто не запоминаем */ }
    setCity(nextCity);
    setCountry(draftCountry);
    setOpen(false);
    router.push(catalogHref(undefined, nextCity));
  }

  const draft = COUNTRIES.find((c) => c.name === draftCountry) ?? COUNTRIES[0];

  return (
    <>
      <button
        type="button"
        onClick={() => { setDraftCountry(country); setOpen(true); }}
        className="city-pill"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Выбрать город"
        style={variant === 'inline' ? { background: 'none', padding: '4px 0' } : undefined}
      >
        <PinIcon /> {city} <span style={{ color: 'var(--text3)', fontSize: 11 }}>▾</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Выбор города"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(20,16,22,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
          }}
        >
          <div
            style={{
              width: 'min(520px,100%)', maxHeight: '82vh', overflowY: 'auto',
              background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 20,
              boxShadow: 'var(--shadow)', padding: 22,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="serif" style={{ fontSize: 24, fontWeight: 600 }}>Где искать мастера?</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть"
                style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: 14 }}>
              Сначала страна, потом город — покажем только мастеров рядом с вами.
            </p>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: 'var(--text3)', marginBottom: 8 }}>СТРАНА</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {COUNTRIES.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => setDraftCountry(c.name)}
                  className={`chip${c.name === draftCountry ? ' active' : ''}`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: 'var(--text3)', marginBottom: 8 }}>ГОРОД</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {draft.cities.map((ct) => (
                <button
                  type="button"
                  key={ct}
                  onClick={() => choose(ct)}
                  className={`chip${ct === city && draftCountry === country ? ' active' : ''}`}
                >
                  {ct}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
