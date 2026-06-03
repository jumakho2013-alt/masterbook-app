import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, Path } from 'react-native-svg';

interface MasterBookLogoProps {
  /** Размер квадратной иконки. Default 64. */
  size?: number;
  /** Показывать ли фоновую gradient-плашку (full icon vs только символ). */
  withBackground?: boolean;
  style?: ViewStyle;
}

/**
 * In-app логотип MasterBook — SVG-версия app-icon.
 *
 * Концепция: записная книга с золотой закладкой.
 *   • Страница с тремя строками (текст / записи)
 *   • Золотая лента-закладка справа = «отмечено важное»
 *   • Семантически работает на MasterBook (книга мастера)
 *   • Универсально для всех профессий (не только бьюти)
 *
 * Используется на login.tsx, register.tsx, welcome.tsx, BiometricGate.tsx.
 */
export function MasterBookLogo({ size = 64, withBackground = true, style }: MasterBookLogoProps) {
  const VB = 1024;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          <LinearGradient id="mbBg" x1="0" y1="0" x2="717" y2="1024" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#A892FF" />
            <Stop offset="1" stopColor="#5A3FD9" />
          </LinearGradient>
          <LinearGradient id="mbGlint" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.10" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="mbCard" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#F5F1FB" />
          </LinearGradient>
          <LinearGradient id="mbRibbon" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFB84D" />
            <Stop offset="1" stopColor="#E89A2D" />
          </LinearGradient>
        </Defs>

        {withBackground && (
          <>
            <Rect width={VB} height={VB} rx="230" fill="url(#mbBg)" />
            <Rect width={VB} height={350} rx="230" fill="url(#mbGlint)" />
          </>
        )}

        {/* Card / page */}
        <Rect x="232" y="200" width="560" height="680" rx="56" fill="url(#mbCard)" />
        {/* Three lines of "writing" — abstract notes/entries */}
        <Rect x="300" y="320" width="320" height="22" rx="11" fill="#D8D0EE" />
        <Rect x="300" y="392" width="420" height="22" rx="11" fill="#D8D0EE" />
        <Rect x="300" y="464" width="280" height="22" rx="11" fill="#D8D0EE" />
        {/* Gold bookmark ribbon */}
        <Path
          d="M 620 200 L 620 740 L 692 680 L 764 740 L 764 200 Z"
          fill="url(#mbRibbon)"
        />
      </Svg>
    </View>
  );
}
