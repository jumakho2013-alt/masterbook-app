import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, Path, Circle, G } from 'react-native-svg';
import { useTheme } from '@/src/theme';

interface MasterBookLogoProps {
  /** Размер квадратной иконки. Default 64. */
  size?: number;
  /** Показывать ли фоновую gradient-плашку (full icon vs только символ). */
  withBackground?: boolean;
  style?: ViewStyle;
}

/**
 * In-app логотип MasterBook — SVG-версия app-icon (opt4).
 *
 * Используется на:
 *   - login.tsx, register.tsx, welcome.tsx — hero на auth screens
 *   - BiometricGate.tsx — поверх блок-экрана
 *
 * Когда `withBackground=true` — рисует полную иконку с gradient-фоном
 * (как app icon). Когда `false` — только белая M с золотой точкой (для
 * вставки внутри primary-фона / glass-карточки).
 */
export function MasterBookLogo({ size = 64, withBackground = true, style }: MasterBookLogoProps) {
  const { colors } = useTheme();

  // ViewBox у нас всегда 1024 — SVG scale возьмёт на себя.
  const VB = 1024;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        {withBackground && (
          <Defs>
            <LinearGradient id="mbBg" x1="0" y1="0" x2="717" y2="1024" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#A892FF" />
              <Stop offset="1" stopColor="#5A3FD9" />
            </LinearGradient>
            <LinearGradient id="mbGlint" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.10" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="mbM" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="1" stopColor="#F0E9FF" />
            </LinearGradient>
          </Defs>
        )}
        {!withBackground && (
          <Defs>
            <LinearGradient id="mbM" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.white} />
              <Stop offset="1" stopColor={colors.white} stopOpacity="0.9" />
            </LinearGradient>
          </Defs>
        )}

        {withBackground && (
          <>
            <Rect width={VB} height={VB} rx="230" fill="url(#mbBg)" />
            <Rect width={VB} height={350} rx="230" fill="url(#mbGlint)" />
          </>
        )}

        {/* M — thick rounded strokes */}
        <G fill="url(#mbM)">
          <Rect x="272" y="280" width="100" height="464" rx="50" />
          <Rect x="652" y="280" width="100" height="464" rx="50" />
          <Path d="M 322 280 L 384 280 L 542 568 L 480 568 Z" />
          <Path d="M 702 280 L 640 280 L 482 568 L 544 568 Z" />
        </G>

        {/* Gold accent dot — символ «личный мастер» */}
        <Circle cx="512" cy="660" r="22" fill="#FFB84D" />
      </Svg>
    </View>
  );
}
