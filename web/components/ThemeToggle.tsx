'use client';

import { useEffect, useState } from 'react';

/**
 * Переключатель темы Atelier (light) ↔ Noir (dark).
 * Тема по умолчанию — светлая. Выбор сохраняется в localStorage и
 * применяется до отрисовки скриптом из layout (без мигания).
 * Лейбл показывает тему, в которую переключит (как в исходном дизайне).
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'noir'>('light');

  useEffect(() => {
    const cur = (document.documentElement.dataset.theme as 'light' | 'noir') || 'light';
    setTheme(cur);
  }, []);

  function toggle() {
    const next = theme === 'light' ? 'noir' : 'light';
    setTheme(next);
    if (next === 'noir') document.documentElement.dataset.theme = 'noir';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem('mb-theme', next);
    } catch {
      /* private mode — не критично */
    }
  }

  return (
    <button className="theme-toggle" onClick={toggle} title="Сменить тему" aria-label="Сменить тему">
      <span className="theme-dot" />
      {theme === 'light' ? 'Noir' : 'Warm'}
    </button>
  );
}
