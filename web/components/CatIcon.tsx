// Иконки категорий — взяты 1:1 из дизайна (Claude Design). stroke=currentColor.

const PATHS: Record<string, React.ReactNode> = {
  manicure: <path d="M12 3c4 5 6 7 6 10a6 6 0 0 1-12 0c0-3 2-5 6-10z" />,
  barber: (
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
      {PATHS[name] ?? PATHS.manicure}
    </svg>
  );
}
