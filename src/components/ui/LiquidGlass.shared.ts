import type { ColorValue, ViewStyle } from 'react-native';

/**
 * Shared types and helpers for LiquidGlass. The component itself has
 * platform-specific implementations:
 *   - LiquidGlass.ios.tsx     — BlurView + specular + rim (the full stack)
 *   - LiquidGlass.android.tsx — solid surface + rim, no BlurView
 *
 * Splitting per platform keeps the `expo-blur` native module out of the
 * Android bundle entirely. This avoids jank on mid-range devices and any
 * edge-case crash paths during Google Play review on older OS versions.
 */

export type LiquidGlassVariant = 'ambient' | 'raised' | 'floating';

export interface LiquidGlassProps {
  children?: React.ReactNode;
  /** Override border radius. Defaults to `theme.borderRadius.lg`. */
  radius?: number;
  /**
   * Brand tint applied as a pre-multiplied veil. Accepts any hex or rgba.
   * When omitted the surface falls back to a neutral glass that adapts to
   * the active colour scheme.
   */
  tint?: ColorValue;
  /**
   * Strength of the tint veil, 0–1. Default 0.14 reads as "branded glass"
   * without losing translucency.
   */
  tintStrength?: number;
  /** BlurView intensity on iOS, 0–100. Default 60. Ignored on Android. */
  intensity?: number;
  variant?: LiquidGlassVariant;
  /** Disable the specular highlight. */
  noSpecular?: boolean;
  /** Disable the inner hairline border. */
  noRim?: boolean;
  style?: ViewStyle;
  padding?: number;
}

/**
 * Pre-multiply an opacity against a colour. Handles `#rrggbb`, `rgb(...)`
 * and `rgba(...)`. Used to derive tint veils and specular stops at runtime
 * without shipping a full colour library.
 */
export function applyAlpha(color: ColorValue | undefined, alpha: number): string | undefined {
  if (typeof color !== 'string' || !color) return undefined;
  if (color.startsWith('#') && color.length === 7) {
    return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  }
  if (color.startsWith('rgba')) {
    return color.replace(/,[^,)]+\)$/, `,${alpha})`);
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
  }
  return color;
}
