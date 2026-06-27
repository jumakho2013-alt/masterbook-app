'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LocationPicker } from './LocationPicker';
import { DIRECTIONS, MEGA_GROUPS, catalogHref } from '@/lib/categories';

const GridIcon = ({ s = 16, stroke = 'var(--plum)' }: { s?: number; stroke?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.7}>
    <rect x="3" y="3" width="7" height="7" rx="1.6" /><rect x="14" y="3" width="7" height="7" rx="1.6" />
    <rect x="3" y="14" width="7" height="7" rx="1.6" /><rect x="14" y="14" width="7" height="7" rx="1.6" />
  </svg>
);
const SearchIcon = ({ s = 17 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.2-3.2" />
  </svg>
);
export function Header() {
  const router = useRouter();
  const [mega, setMega] = useState(false);
  const [catMenu, setCatMenu] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [dir, setDir] = useState(DIRECTIONS[0]);
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLFormElement>(null);

  // Закрываем выпадашку направлений по клику вне и по Escape.
  useEffect(() => {
    if (!catMenu) return;
    const onDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setCatMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCatMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [catMenu]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const term = q.trim() || (dir !== DIRECTIONS[0] ? dir : '');
    setMega(false);
    setSheet(false);
    router.push(catalogHref(term || undefined));
  }

  return (
    <>
      {/* ===== DESKTOP ===== */}
      <header className="hdr">
        <div className="hdr-row">
          <Link href="/" className="brand" onClick={() => setMega(false)}>
            <span className="brand-name">MasterBook</span>
            <span className="brand-badge">ATELIER</span>
          </Link>

          <button className="allsvc" onClick={() => setMega((v) => !v)} aria-expanded={mega} aria-haspopup="menu">
            <GridIcon /> Все услуги <span style={{ color: 'var(--text3)', fontSize: 11 }}>▾</span>
          </button>

          <form className="searchbox" onSubmit={submit} ref={searchRef} role="search">
            <button
              type="button"
              className="search-cat"
              onClick={() => setCatMenu((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={catMenu}
            >
              {dir} <span style={{ color: 'var(--text3)', fontSize: 10 }}>▾</span>
            </button>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск: услуга, мастер или район…"
              aria-label="Поиск мастера"
            />
            <button type="submit" className="search-go" aria-label="Искать"><SearchIcon /></button>
            {catMenu && (
              <div className="search-menu" role="listbox" aria-label="Направление">
                {DIRECTIONS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    role="option"
                    aria-selected={d === dir}
                    className={`search-menu-item${d === dir ? ' active' : ''}`}
                    onClick={() => { setDir(d); setCatMenu(false); }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="hdr-actions">
            <Link href="/dlya-masterov" className="hdr-formasters">Для мастеров</Link>
            <LocationPicker />
            <ThemeToggle />
            <Link href="/cabinet" className="signin">Войти</Link>
          </div>
        </div>

        {mega && (
          <>
            <div className="mega-veil" onClick={() => setMega(false)} />
            <div className="mega">
              <div className="mega-inner">
                <div className="mega-top">
                  <div className="mega-eyebrow">ВСЕ НАПРАВЛЕНИЯ И УСЛУГИ</div>
                  <Link href="/catalog" className="linkish" onClick={() => setMega(false)}>Открыть весь каталог →</Link>
                </div>
                <div className="mega-grid">
                  {MEGA_GROUPS.map((g) => (
                    <div key={g.group}>
                      <div className="mega-col-title">{g.group}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {g.items.map((it) => (
                          <Link key={it} href={catalogHref(it)} className="mega-item" onClick={() => setMega(false)}>
                            <span>{it}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* ===== MOBILE ===== */}
      <header className="hdr-mobile">
        <div className="mhdr-row">
          <Link href="/" className="brand">
            <span className="brand-name" style={{ fontSize: 22 }}>MasterBook</span>
          </Link>
          <LocationPicker />
        </div>
        <div className="msearch">
          <Link href="/catalog" className="msearch-box"><SearchIcon s={16} /> Поиск услуги или мастера…</Link>
          <button className="mgrid-btn" onClick={() => setSheet(true)} aria-label="Все услуги"><GridIcon s={19} stroke="var(--plum)" /></button>
        </div>
      </header>

      {/* ===== MOBILE: ВСЕ УСЛУГИ (sheet) ===== */}
      {sheet && (
        <div className="msheet" role="dialog" aria-label="Все услуги">
          <div className="msheet-head">
            <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>Все услуги</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ThemeToggle />
              <button className="msheet-close" onClick={() => setSheet(false)} aria-label="Закрыть">✕</button>
            </div>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {MEGA_GROUPS.map((g) => (
              <div key={g.group}>
                <div className="mega-col-title">{g.group}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {g.items.map((it) => (
                    <Link key={it} href={catalogHref(it)} className="msheet-item" onClick={() => setSheet(false)}>
                      <span>{it}</span><span style={{ color: 'var(--text3)' }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
