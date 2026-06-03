/**
 * Реестр profession-паков. На v1 паки — статические TS-объекты в
 * `src/data/packs/*.ts`. В будущем (v2) добавится возможность загружать
 * community-pack JSON из Supabase — для этого `ProfessionPack` уже
 * spec'ом — чистые данные без выполнения кода.
 *
 * Активный pack резолвится через useAuthStore.specializationId (которое
 * уже сохраняется при онбординге). Если slug не найден — fallback на
 * manicure (default-вертикаль СНГ).
 */

import type { ProfessionPack, VocabularyKey } from '@/src/types/professionPack';
import { manicurePack } from '@/src/data/packs/manicure';
import { tutorPack } from '@/src/data/packs/tutor';
import { photographerPack } from '@/src/data/packs/photographer';

export const PACK_REGISTRY: ProfessionPack[] = [
  manicurePack,
  tutorPack,
  photographerPack,
];

export const PACK_BY_SLUG: Record<string, ProfessionPack> = Object.fromEntries(
  PACK_REGISTRY.map((p) => [p.slug, p]),
);

/** Алиасы между legacy specializationId (из src/data/professions.ts) и
 *  pack slugs. Когда пользователь онбордился через старый поток, у него
 *  сохранён specializationId типа 'nails' → используем `nails → manicure`. */
const LEGACY_SPECIALIZATION_TO_PACK: Record<string, string> = {
  nails: 'manicure',
  manicure: 'manicure',
  hair: 'manicure', // временно — пока нет пака парикмахера
  lashes: 'manicure',
  brows: 'manicure',
  cosmetology: 'manicure',
  // Education
  tutor: 'tutor',
  tutoring: 'tutor',
  // Creative
  photographer: 'photographer',
  videographer: 'photographer',
};

export const DEFAULT_PACK_SLUG = 'manicure';

/** Резолвит pack по specializationId / pack-slug / fallback. */
export function resolvePack(specializationId: string | null | undefined): ProfessionPack {
  if (!specializationId) return PACK_BY_SLUG[DEFAULT_PACK_SLUG];
  const mappedSlug = LEGACY_SPECIALIZATION_TO_PACK[specializationId] ?? specializationId;
  return PACK_BY_SLUG[mappedSlug] ?? PACK_BY_SLUG[DEFAULT_PACK_SLUG];
}

// ---------------------------------------------------------------------------
// tProf — vocabulary swap helper.
// ---------------------------------------------------------------------------

/**
 * Возвращает локализованную (под выбранную профессию) строку для ключа.
 * Если ключа нет в паке — возвращает fallback (передаётся вторым аргументом).
 *
 * Пример использования:
 *   import { useAuthStore } from '@/src/stores/useAuthStore';
 *   import { resolvePack, tProf } from '@/src/lib/professionPacks';
 *
 *   const spec = useAuthStore((s) => s.specializationId);
 *   const pack = resolvePack(spec);
 *   const label = tProf(pack, 'client.singular', 'клиент');
 *
 * Поддерживает {placeholder} подстановку из второго (опционального) аргумента.
 */
export function tProf(
  pack: ProfessionPack,
  key: VocabularyKey,
  fallback: string,
  vars?: Record<string, string | number>,
): string {
  const raw = pack.vocabulary[key] ?? fallback;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name) => {
    const v = vars[name];
    return v === undefined || v === null ? `{${name}}` : String(v);
  });
}
