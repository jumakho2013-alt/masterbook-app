// Иконки категорий. stroke=currentColor.
// Ключи — РЕАЛЬНЫЕ id специализаций (lib/categories → HOME_CATEGORIES). Раньше
// здесь были старые ключи manicure/barber: для «nails» и «hair» иконка не
// находилась, и обеим категориям подставлялась одна и та же капля.

const PATHS: Record<string, React.ReactNode> = {
  nails: (
    <>
      <path d="M8.5 10.5h7v8.5a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2z" />
      <path d="M10 10.5V7h4v3.5" />
      <path d="M11 7V3.5h2V7" />
    </>
  ),
  hair: (
    <>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <path d="M8 7.5l12 9M8 16.5l12-9" />
    </>
  ),
  brows: (
    <>
      <path d="M4 9c3-3.5 13-3.5 16 0" />
      <path d="M4 15s3-3 8-3 8 3 8 3" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    </>
  ),
  lashes: (
    <>
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
      <circle cx="12" cy="12" r="2.3" />
      <path d="M5 7l1.5 2M12 5v2M19 7l-1.5 2" />
    </>
  ),
  cosmetology: (
    <>
      <path d="M19 5C9 5 5 11 5 19c8 0 14-4 14-14z" />
      <path d="M9 15c2.5-2.5 5.5-4.5 9-6" />
    </>
  ),
  massage: <path d="M12 20c-4 0-7-3-7-7 2 0 4 1 5 3 0-3 1-5 2-7 1 2 2 4 2 7 1-2 3-3 5-3 0 4-3 7-7 7z" />,
  tutor: (
    <>
      <path d="M4 5h7a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H4z" />
      <path d="M20 5h-7a3 3 0 0 0-3 3v11a3 3 0 0 1 3-3h7z" />
    </>
  ),
  cleaning: (
    <>
      <rect x="8" y="9" width="7" height="11" rx="1.5" />
      <path d="M8 9V6h4V4M15.5 6.5h3M15.5 9h3M15.5 11.5h3" />
    </>
  ),
};

export function CatIcon({ name, size = 25 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name] ?? PATHS.nails}
    </svg>
  );
}
