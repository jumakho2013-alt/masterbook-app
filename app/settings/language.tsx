import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Languages } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton } from '@/src/components/ui';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

type LangOption = { code: 'system' | 'ru' | 'en'; label: string; sub: string };

const OPTIONS: LangOption[] = [
  { code: 'system', label: 'Системный', sub: 'Как в настройках телефона' },
  { code: 'ru', label: 'Русский', sub: 'Russian' },
  { code: 'en', label: 'English', sub: 'Английский' },
];

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { colors, typography: typo, borderRadius: br } = useTheme();
  const current = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const choose = (code: LangOption['code']) => {
    Haptics.selectionAsync();
    setLanguage(code);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel="Назад"
        />
        <Text style={[typo.h3, { color: colors.text }]}>Язык</Text>
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        data={OPTIONS}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => {
          const selected = item.code === current;
          return (
            <Pressable
              onPress={() => choose(item.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={item.label}
            >
              <GlassCard style={styles.row}>
                <View style={[styles.iconBubble, { backgroundColor: colors.primarySoft, borderRadius: br.sm }]}>
                  <Languages size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typo.body, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                    {item.sub}
                  </Text>
                </View>
                {selected && <Check size={20} color={colors.primary} />}
              </GlassCard>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconBubble: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
