import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, Path, Circle, G } from 'react-native-svg';

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
 *   • Карточка-страница с 4 строками текста (entries в книге)
 *   • Одна строка выделена как «today / marked» — purple dot + line
 *   • Золотая лента-закладка справа с specular highlight
 *
 * Семантически работает на MasterBook (книга мастера).
 * Универсально для всех профессий — не только бьюти.
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
            <Stop offset="1" stopColor="#F3EEFA" />
          </LinearGradient>
          <LinearGradient id="mbRibbon" x1="0" y1="0" x2="0.3" y2="1">
            <Stop offset="0" stopColor="#FFC766" />
            <Stop offset="0.5" stopColor="#FFB84D" />
            <Stop offset="1" stopColor="#D88A20" />
          </LinearGradient>
        </Defs>

        {withBackground && (
          <>
            <Rect width={VB} height={VB} rx="230" fill="url(#mbBg)" />
            <Rect width={VB} height={380} rx="230" fill="url(#mbGlint)" />
          </>
        )}

        {/* Card */}
        <Rect x="200" y="180" width="624" height="720" rx="64" fill="url(#mbCard)" />

        {/* 4 lines of "writing" — varied opacity for hierarchy */}
        <Rect x="280" y="320" width="360" height="22" rx="11" fill="#CFC4EC" />
        <Rect x="280" y="400" width="460" height="22" rx="11" fill="#CFC4EC" opacity="0.88" />
        <Rect x="280" y="480" width="300" height="22" rx="11" fill="#CFC4EC" opacity="0.75" />
        <Rect x="280" y="560" width="380" height="22" rx="11" fill="#CFC4EC" opacity="0.62" />

        {/* Highlighted entry — «today / marked» (purple dot + line) */}
        <Circle cx="296" cy="720" r="20" fill="#A892FF" />
        <Rect x="340" y="708" width="180" height="22" rx="11" fill="#A892FF" opacity="0.7" />

        {/* Gold ribbon */}
        <G>
          <Path
            d="M 620 180 L 620 824 L 712 750 L 804 824 L 804 180 Z"
            fill="url(#mbRibbon)"
          />
          {/* Tiny specular line on left edge of ribbon — premium ribbon feel */}
          <Rect x="624" y="184" width="6" height="640" rx="3" fill="rgba(255,255,255,0.35)" />
        </G>
      </Svg>
    </View>
  );
}
