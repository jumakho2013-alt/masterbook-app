import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { HOME_CATEGORIES } from '@/lib/categories';

const SITE = 'https://masterbook-app.vercel.app';

// Пересобираем карту раз в час — новые опубликованные мастера попадают в индекс
// Google без ручного действия.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Все опубликованные мастера со slug — постранично: PostgREST молча режет
  // ответ на 1000 строк, из-за чего в карту сайта попадала бы только первая
  // тысяча мастеров. Ограничение sitemap — 50 000 URL, на нём и останавливаемся.
  const PAGE = 1000;
  const MAX_URLS = 45000; // запас под служебные URL до лимита 50 000
  const rows: { slug: string | null; updated_at: string | null }[] = [];
  for (let from = 0; from < MAX_URLS; from += PAGE) {
    const { data, error } = await supabase
      .from('profiles')
      .select('slug, updated_at')
      .eq('published', true)
      .not('slug', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      // Молчаливый break давал пустую карту сайта при любой ошибке БД —
      // мастера просто исчезали из индекса, и это никак не проявлялось.
      console.error('[sitemap] profiles fetch failed:', error.message);
      break;
    }
    const page = data ?? [];
    rows.push(...(page as typeof rows));
    if (page.length < PAGE) break;
  }

  const masters: MetadataRoute.Sitemap = rows
    .filter((m) => m.slug)
    .map((m) => ({
      url: `${SITE}/m/${m.slug}`,
      lastModified: m.updated_at ? new Date(m.updated_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  // Каталог по категориям — отдельные индексируемые точки входа.
  const categories: MetadataRoute.Sitemap = HOME_CATEGORIES.map((c) => ({
    url: `${SITE}/catalog?spec=${encodeURIComponent(c.key)}`,
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  return [
    { url: SITE, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/catalog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/dlya-masterov`, changeFrequency: 'monthly', priority: 0.7 },
    ...categories,
    ...masters,
  ];
}
