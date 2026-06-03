import { Platform } from 'react-native';

/**
 * Theme-aware shadows.
 *
 * Проблема старого подхода: shadow color `#1E1E2E` на dark background `#0B0C16`
 * выглядит как «тень которой нет». Premium dark UI требует:
 *   - shadowColor: black с заметным opacity (0.4-0.6) для depth
 *   - Иногда coloured shadow (primary glow) для брендового sparkle
 *
 * На light: мягкая тёмная тень с низким opacity (0.06-0.10).
 * На dark: глубокая black тень с высоким opacity (0.40-0.60), плюс больший
 * blur radius для «soft halo» feel.
 *
 * Android elevation остаётся как fallback — system сам рассчитает плотность.
 */
function makeShadows(isDark: boolean) {
  const shadowColor = '#000000';
  // На dark давим opacity сильно — иначе shadow invisible на тёмном.
  const opacityMul = isDark ? 5 : 1;

  return {
    sm: Platform.select({
      ios: {
        shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06 * opacityMul,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
    md: Platform.select({
      ios: {
        shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08 * opacityMul,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
      default: {},
    }),
    lg: Platform.select({
      ios: {
        shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10 * opacityMul,
        shadowRadius: 28,
      },
      android: { elevation: 8 },
      default: {},
    }),
    /** Branded glow — primary purple. Один и тот же на light/dark
     *  (на dark смотрится особенно красиво — фирменный halo). */
    glow: Platform.select({
      ios: {
        shadowColor: '#7C5DFA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.5 : 0.3,
        shadowRadius: isDark ? 18 : 12,
      },
      android: { elevation: 6 },
      default: {},
    }),
  } as const;
}

// Дефолтный экспорт — light shadows (для legacy / non-themed мест).
export const shadows = makeShadows(false);

export type Shadows = ReturnType<typeof makeShadows>;
export { makeShadows };
