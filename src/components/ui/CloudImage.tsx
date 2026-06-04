import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Image, type ImageStyle } from 'expo-image';
import { useTheme } from '@/src/theme';
import { useResolvedPhoto } from '@/src/lib/photoCloud';

interface CloudImageProps {
  /** Локальный URI или storage-path (резолвится через photoCloud). */
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
}

/**
 * Картинка, которая умеет показывать как локальный файл, так и облачный
 * storage-path (минус №13). Пока storage-path качается — показываем плейсхолдер.
 */
export function CloudImage({ uri, style, accessibilityLabel }: CloudImageProps) {
  const { colors } = useTheme();
  const resolved = useResolvedPhoto(uri);

  if (!resolved) {
    return <View style={[style as StyleProp<ViewStyle>, { backgroundColor: colors.surfaceElevated }]} />;
  }

  return (
    <Image
      source={{ uri: resolved }}
      cachePolicy="memory-disk"
      contentFit="cover"
      transition={150}
      accessibilityLabel={accessibilityLabel}
      style={style}
    />
  );
}
