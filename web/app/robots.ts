import type { MetadataRoute } from 'next';

const SITE = 'https://masterbook-app.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    // Каталог и страницы мастеров — открыты для индексации (это наш трафик).
    // Кабинет/админка — приватные, закрываем от краулеров.
    rules: { userAgent: '*', allow: '/', disallow: ['/cabinet', '/admin'] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
