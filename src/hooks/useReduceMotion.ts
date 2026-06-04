import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook — текущий статус «Уменьшить движение» (iOS Settings → Accessibility →
 * Motion → Reduce Motion; Android → Accessibility → Disable animations).
 *
 * Для людей с вестибулярными расстройствами, мигренью или sensitivity к
 * motion — любая spring-анимация вызывает тошноту. Используем этот хук
 * чтобы:
 *   - отключать `entering` у `Animated.View` (FadeInDown, SlideInUp, …)
 *   - заменять withSpring на мгновенные присвоения
 *
 * Пример:
 * ```ts
 * const reduceMotion = useReduceMotion();
 * <Animated.View entering={reduceMotion ? undefined : FadeInDown} />
 * ```
 *
 * Реактивный: если пользователь меняет настройку, компонент ре-рендерится.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduce(value);
      })
      .catch(() => {
        // Платформы без accessibility API (старый Android web-view) — считаем
        // motion разрешено. Это дефолт для non-a11y пользователей.
      });

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setReduce(value);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
