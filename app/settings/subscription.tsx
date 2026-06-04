import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, Button, CustomAlert } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import {
  purchasePro,
  restorePurchases,
  PRO_PRICE,
  PRO_PRODUCT_ID,
  TRIAL_DAYS,
} from '@/src/lib/iap';

/**
 * MasterBook Pro — экран-каркас подписки (минус №16).
 *
 * Реальная покупка ещё не подключена (нужен EAS-билд + товары в сторах), поэтому
 * iap-функции возвращают `unavailable`, а экран честно показывает «скоро».
 * Wiring (getProducts/purchase/restore) на месте — после билда меняется только
 * src/lib/iap.ts.
 */
export default function SubscriptionScreen() {
  const router = useRouter();
  const tr = useT();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const { alertConfig, info } = useAlert();
  const firstUseAt = useSettingsStore((s) => s.firstUseAt);

  // Сколько дней пробного периода осталось (отсчёт от первого запуска).
  // Date.now() здесь ок — это app-код, не workflow-скрипт.
  const trialLeft = (() => {
    if (!firstUseAt) return TRIAL_DAYS;
    const elapsedDays = Math.floor((Date.now() - new Date(firstUseAt).getTime()) / 86400000);
    return Math.max(0, TRIAL_DAYS - elapsedDays);
  })();

  const benefits = [
    tr('settings.proBenefit1'),
    tr('settings.proBenefit2'),
    tr('settings.proBenefit3'),
    tr('settings.proBenefit4'),
  ];

  const comingSoon = () =>
    info(tr('settings.proComingSoonTitle'), tr('settings.proComingSoonBody'));

  const onSubscribe = async () => {
    Haptics.selectionAsync();
    const res = await purchasePro(PRO_PRODUCT_ID);
    if (!res.ok) comingSoon(); // reason: 'unavailable' пока нет билда/товаров
  };

  const onRestore = async () => {
    const res = await restorePurchases();
    if (!res.ok) comingSoon();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel={tr('common.back')}
        />
        <Text style={[typo.h3, { color: colors.text }]}>{tr('settings.proTitle')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignItems: 'center', marginBottom: sp.lg }}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <Sparkles size={32} color={colors.primary} />
          </View>
        </View>

        <Text
          style={[
            typo.body,
            { color: colors.textSecondary, textAlign: 'center', marginBottom: sp.lg, paddingHorizontal: 8 },
          ]}
        >
          {tr('settings.proIntro', { days: TRIAL_DAYS, price: PRO_PRICE })}
        </Text>

        {/* Цена + статус пробного периода */}
        <GlassCard style={{ alignItems: 'center', gap: 4, marginBottom: sp.md }}>
          <Text style={[typo.h2, { color: colors.text }]}>
            {tr('settings.proPrice', { price: PRO_PRICE })}
          </Text>
          <Text style={[typo.caption, { color: trialLeft > 0 ? colors.success : colors.textTertiary }]}>
            {trialLeft > 0
              ? tr('settings.proTrialLeft', { n: trialLeft })
              : tr('settings.proTrialEnded')}
          </Text>
        </GlassCard>

        <GlassCard style={{ gap: sp.md }}>
          {benefits.map((b, i) => (
            <View key={i} style={styles.row}>
              <View style={[styles.checkWrap, { backgroundColor: colors.successSoft }]}>
                <Check size={15} color={colors.success} />
              </View>
              <Text style={[typo.body, { color: colors.text, flex: 1 }]}>{b}</Text>
            </View>
          ))}
        </GlassCard>

        <Button
          title={tr('settings.proCta', { price: PRO_PRICE })}
          onPress={onSubscribe}
          size="lg"
          style={{ marginTop: sp.lg }}
        />
        <TouchableOpacity onPress={onRestore} style={styles.restoreBtn} accessibilityRole="button">
          <Text style={[typo.body, { color: colors.textSecondary }]}>{tr('settings.proRestore')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert {...alertConfig} />
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
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
});
