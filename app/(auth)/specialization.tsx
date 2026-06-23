import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard } from '@/src/components/ui';
import { professionCategories, getDefaultFieldConfig } from '@/src/data/professions';
import { localizeCategoryName, localizeSpecName } from '@/src/data/professions.i18n';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useT } from '@/src/hooks/useT';
import type { ProfessionCategory, Specialization } from '@/src/types';

export default function SpecializationScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const setProfession = useAuthStore((s) => s.setProfession);
  const setFieldConfig = useSettingsStore((s) => s.setFieldConfig);

  const category = professionCategories.find((c) => c.id === categoryId);
  if (!category) return null;

  const handleSelect = (spec: Specialization) => {
    setProfession(category.id as ProfessionCategory, spec.id);
    setFieldConfig(getDefaultFieldConfig(category.id));
    router.push({
      pathname: '/(auth)/services-setup',
      params: { specializationId: spec.id },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={[typo.h2, { color: colors.text }]}>
          {localizeCategoryName(category)}
        </Text>
        <Text style={[typo.body, { color: colors.textSecondary, marginTop: sp.xs }]}>
          {tr('misc.chooseSpecialization')}
        </Text>
      </Animated.View>

      <FlatList
        data={category.specializations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 24) }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item, index }) => {
          const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size: number; color: string }>>)[item.icon];
          return (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
              <TouchableOpacity onPress={() => handleSelect(item)} activeOpacity={0.7}>
                <GlassCard style={styles.specCard}>
                  <View style={[styles.iconWrap, { backgroundColor: category.color + '20' }]}>
                    {Icon && <Icon size={22} color={category.color} />}
                  </View>
                  <Text style={[typo.bodyBold, { color: colors.text, flex: 1 }]}>
                    {localizeSpecName(item)}
                  </Text>
                  <ChevronRight size={18} color={colors.textTertiary} />
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  specCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
