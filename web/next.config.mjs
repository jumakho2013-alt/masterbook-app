/** @type {import('next').NextConfig} */

// Security-заголовки. Раньше их не было вообще: без CSP любой XSS сразу уносил
// сессию кабинета из localStorage, а без frame-ancestors админку (/admin с
// кнопкой «Подтвердить оплату») можно было встроить в iframe и подставить клик.
//
// 'unsafe-inline' для script-src нужен из-за инлайн-скрипта темы в layout.tsx
// (он ставит data-theme до первой отрисовки, чтобы не было вспышки светлой
// темы). Это осознанный компромисс: XSS-вектор в JSON-LD закрыт экранированием
// на стороне рендера, а connect-src ограничивает, куда вообще можно утечь.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.supabase.co",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  images: {
    // Аватары/портфолио из Supabase Storage (когда бакет станет публичным).
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
