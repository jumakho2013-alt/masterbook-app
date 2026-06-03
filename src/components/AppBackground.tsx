import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/theme';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

/**
 * AppBackground — живой mesh-gradient фон под весь экран.
 *
 * Как работает glassmorphism тут:
 *   1. Заливка background-цветом
 *   2. 3 больших цветных круга (colors.mesh) раскиданы по углам — это
 *      «пятна света» разных цветов гаммы (изумруд / золото / тёмно-зелёный)
 *   3. Сильный BlurView поверх кругов размывает их в мягкий плавный mesh
 *   4. children (контент экрана) рендерятся ПОВЕРХ
 *
 * Когда поверх лежат полупрозрачные стеклянные карточки (GlassCard) — сквозь
 * них просвечивает этот цветной размытый фон → настоящее «стекло», а не
 * плоская заливка. Именно это просил пользователь: «blur везде чтоб красиво».
 *
 * Производительность: 3 View + 1 BlurView на экран — дёшево. Круги статичны.
 */
export function AppBackground({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const blobSize = Math.max(width, height) * 0.9;
  const reduceEffects = useSettingsStore((s) => s.reduceEffects);

  // «Уменьшить эффекты»: сплошная заливка, без mesh-кругов и blur. На слабых
  // Android blur роняет FPS при скролле — даём пользователю выключить.
  if (reduceEffects) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
        <View style={StyleSheet.absoluteFill}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      {/* Цветные пятна по углам */}
      <View
        pointerEvents="none"
        style={[
          styles.blob,
          {
            width: blobSize,
            height: blobSize,
            borderRadius: blobSize / 2,
            backgroundColor: colors.mesh[0],
            top: -blobSize * 0.35,
            left: -blobSize * 0.25,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blob,
          {
            width: blobSize * 0.8,
            height: blobSize * 0.8,
            borderRadius: blobSize / 2,
            backgroundColor: colors.mesh[1],
            top: height * 0.15,
            right: -blobSize * 0.35,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blob,
          {
            width: blobSize,
            height: blobSize,
            borderRadius: blobSize / 2,
            backgroundColor: colors.mesh[2],
            bottom: -blobSize * 0.4,
            left: -blobSize * 0.15,
          },
        ]}
      />

      {/* Сильный blur размывает круги в плавный mesh */}
      <BlurView
        tint={isDark ? 'dark' : 'light'}
        intensity={isDark ? 60 : 50}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Контент поверх фона */}
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
});
