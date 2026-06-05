import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { ProfessionCard } from '@/src/components/ProfessionCard';
import { professionCategories } from '@/src/data/professions';
import { localizeCategoryName } from '@/src/data/professions.i18n';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useT } from '@/src/hooks/useT';

const SERIF = 'CormorantGaramond_600SemiBold';

/**
 * Онбординг — выбор профессии (Atelier, шаг 1 из 3): прогресс-бар, серифный
 * заголовок, сетка 2×N карточек с выбором (чек-бейдж), нижний CTA «Продолжить».
 * Логика выбора профессии/навигации — без изменений (proceed по выбранной).
 */
export default function ProfessionScreen() {
  const router = useRouter();
  const { colors, typography: typo, isDark } = useTheme();
  const setProfession = useAuthStore((s) => s.setProfession);
  const t = useT();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const onPrimary = isDark ? '#2A2030' : '#FFFFFF';

  const proceed = () => {
    if (!selectedId) return;
    const category = professionCategories.find((c) => c.id === selectedId);
    if (!category) return;
    // Одна специализация (напр. «другое») → пропускаем экран специализации.
    if (category.specializations.length === 1) {
      setProfession(category.id, category.specializations[0].id);
      router.push({
        pathname: '/(auth)/services-setup',
        params: { specializationId: category.specializations[0].id },
      });
      return;
    }
    router.push({ pathname: '/(auth)/specialization', params: { categoryId: selectedId } });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* progress — 3 шага, первый шире */}
        <View style={styles.progress}>
          {[2, 1, 1].map((flex, i) => (
            <View key={i} style={{ flex, height: 4, borderRadius: 2, backgroundColor: i === 0 ? colors.primary : colors.border }} />
          ))}
        </View>

        <Text style={[typo.label, { color: colors.primary, marginTop: 24 }]}>{t('onboarding.step', { n: 1, total: 3 })}</Text>
        <Text style={{ fontFamily: SERIF, fontSize: 34, letterSpacing: -0.5, lineHeight: 38, color: colors.text, marginTop: 8 }}>
          {t('onboarding.professionTitle')}
        </Text>
        <Text style={[typo.body, { color: colors.textSecondary, marginTop: 10, lineHeight: 20 }]}>
          {t('onboarding.professionSubtitle')}
        </Text>

        <View style={styles.grid}>
          {professionCategories.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(80 + index * 40).duration(400)} style={styles.gridItem}>
              <ProfessionCard
                name={localizeCategoryName(item)}
                icon={item.icon}
                color={item.color}
                selected={selectedId === item.id}
                onPress={() => setSelectedId(item.id)}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaBar, { backgroundColor: colors.surfaceGlass, borderTopColor: colors.border }]}>
        <Pressable
          onPress={proceed}
          disabled={!selectedId}
          accessibilityRole="button"
          style={[styles.ctaBtn, { backgroundColor: colors.primary, opacity: selectedId ? 1 : 0.4 }]}
        >
          <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 15.5, color: onPrimary }}>{t('onboarding.continueBtn')}</Text>
          <ChevronRight size={18} color={onPrimary} strokeWidth={2} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  progress: { flexDirection: 'row', gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 24 },
  gridItem: { width: '48%' },
  ctaBar: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 30, borderTopWidth: StyleSheet.hairlineWidth },
  ctaBtn: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
});
