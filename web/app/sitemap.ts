import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { HOME_CATEGORIES } from '@/lib/categories';

const SITE = 'https://masterbook-app.vercel.app';

// Пересобираем карту раз в час — новые опубликованные мастера попадают в индекс
// Google без ручного действия.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Все опубликованные мастера со slug — каждая страница индексируется.
  const { data } = await supabase
    .from('profiles')
    .select('slug')
    .eq('published', true)
    .not('slug', 'is', null);

  const masters: MetadataRoute.Sitemap = ((data ?? []) as { slug: string | null }[])
    .filter((m) => m.slug)
    .map((m) => ({
      url: `${SITE}/m/${m.slug}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  // Каталог по категориям — отдельные индексируемые точки входа.
  const categories: MetadataRoute.Sitemap = HOME_CATEGORIES.map((c) => ({
    url: `${SITE}/catalog?q=${encodeURIComponent(c.name)}`,
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
