import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/src/theme';
import { getInitials } from '@/src/utils/helpers';
import { useResolvedPhoto } from '@/src/lib/photoCloud';

interface AvatarProps {
  name: string;
  size?: number;
  photoUri?: string;
}

/**
 * Atelier: монограмма — круг `primarySoft` + инициалы СЕРИФОМ (Cormorant) цвета
 * `primary`. Заметно «дороже» цветных случайных кружков. Фото — тот же круг.
 */
export function Avatar({ name, size = 48, photoUri }: AvatarProps) {
  const { colors } = useTheme();
  const fontSize = size * 0.4;
  const radius = size / 2;
  // photoUri может быть локальным URI ИЛИ storage-path — резолвим в показываемый.
  const resolvedUri = useResolvedPhoto(photoUri);

  if (resolvedUri) {
    return (
      <Image source={{ uri: resolvedUri }} style={{ width: size, height: size, borderRadius: radius }} />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: radius, backgroundColor: colors.primarySoft },
      ]}
    >
      <Text
        style={{
          fontFamily: 'CormorantGaramond_600SemiBold',
          color: colors.primary,
          fontSize,
          lineHeight: fontSize * 1.05,
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
