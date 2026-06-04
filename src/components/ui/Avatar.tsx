import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/src/theme';
import { getInitials } from '@/src/utils/helpers';
import { useResolvedPhoto } from '@/src/lib/photoCloud';

// Приглушённые премиум-градиенты для аватаров
const AVATAR_COLORS = [
  ['#7C5DFA', '#9B8AFB'],
  ['#FF6B6B', '#FF8A80'],
  ['#2ED573', '#5AF78E'],
  ['#FFA502', '#FFD93D'],
  ['#3B82F6', '#60A5FA'],
  ['#EC4899', '#F472B6'],
  ['#8B5CF6', '#A78BFA'],
  ['#14B8A6', '#2DD4BF'],
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const pair = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  return pair[0];
}

interface AvatarProps {
  name: string;
  size?: number;
  photoUri?: string;
}

export function Avatar({ name, size = 48, photoUri }: AvatarProps) {
  const { typography: typo } = useTheme();
  const bgColor = useMemo(() => getColorForName(name), [name]);
  const fontSize = size * 0.36;
  const borderRadius = size * 0.35;
  // photoUri может быть локальным URI ИЛИ storage-path — резолвим в показываемый.
  const resolvedUri = useResolvedPhoto(photoUri);

  if (resolvedUri) {
    return (
      <Image
        source={{ uri: resolvedUri }}
        style={{ width: size, height: size, borderRadius }}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text
        style={[
          typo.bodyBold,
          {
            color: '#FFFFFF',
            fontSize,
            lineHeight: fontSize * 1.2,
          },
        ]}
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
