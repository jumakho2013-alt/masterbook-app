import { useMemo } from 'react';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { resolvePack, tProf } from '@/src/lib/professionPacks';
import type { ProfessionPack, VocabularyKey } from '@/src/types/professionPack';

/**
 * Хук для удобного доступа к активному паку из React-компонента.
 * Подписывается на изменение specializationId — если пользователь сменил
 * профессию, компонент сразу перерисуется с новым словарём.
 *
 * Возвращает:
 *   - pack: ProfessionPack — сам объект пака
 *   - t: (key, fallback, vars?) => string — curried tProf для текущего пака
 */
export function useProfessionPack(): {
  pack: ProfessionPack;
  t: (key: VocabularyKey, fallback: string, vars?: Record<string, string | number>) => string;
} {
  const specializationId = useAuthStore((s) => s.specializationId);

  const pack = useMemo(() => resolvePack(specializationId), [specializationId]);
  const t = useMemo(
    () => (key: VocabularyKey, fallback: string, vars?: Record<string, string | number>) =>
      tProf(pack, key, fallback, vars),
    [pack],
  );

  return { pack, t };
}
