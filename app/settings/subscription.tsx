import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Crown, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { Button, CustomAlert } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
import {
  purchasePro,
  restorePurchases,
  PRO_PRICE_MONTHLY,
  PRO_PRICE_YEARLY,
  PRO_PRICE_YEARLY_PER_MONTH,
  PRO_YEARLY_SAVE_PERCENT,
  PRO_PRODUCT_ID_MONTHLY,
  PRO_PRODUCT_ID_YEARLY,
} from '@/src/lib/iap';

type Period = 'monthly' | 'yearly';
const SERIF = 'CormorantGaramond_600SemiBold';
const GOLD_GRAD = ['#E6C588', '#C79B57'] as const;

/**
 * MasterBook PRO paywall — точно по макету Atelier: золотая корона → «MASTERBOOK»
 * → серифное «PRO» → курсивный слоган; фичи с золотыми галочками; тарифы
 * Месяц/Год (−38%, золотая рамка); нижний CTA + ссылки. Реальная оплата —
 * через RevenueCat (purchasePro пока возвращает unavailable → честное «скоро»).
 * ?locked=1 → жёсткий paywall (без крестика).
 */
export default function SubscriptionScreen() {
  const router = useRouter();
  const tr = useT();
  const { colors, typography: typo } = useTheme();
  const { alertConfig, info } = useAlert();
  const { locked } = useLocalSearchParams<{ locked?: string }>();
  const isLocked = locked === '1';

  const [period, setPeriod] = useState<Period>('yearly'); // годовой выгоднее — по умолчанию

  const feats: [string, string][] = [
    [tr('settings.paywallFeat1L'), tr('settings.paywallFeat1S')],
    [tr('settings.paywallFeat2L'), tr('settings.paywallFeat2S')],
    [tr('settings.paywallFeat3L'), tr('settings.paywallFeat3S')],
    [tr('settings.paywallFeat4L'), tr('settings.paywallFeat4S')],
  ];

  const comingSoon = () => info(tr('settings.proComingSoonTitle'), tr('settings.proComingSoonBody'));

  const onSubscribe = async () => {
    Haptics.selectionAsync();
    const id = period === 'yearly' ? PRO_PRODUCT_ID_YEARLY : PRO_PRODUCT_ID_MONTHLY;
    const res = await purchasePro(id);
    if (!res.ok) comingSoon();
  };

  const onRestore = async () => {
    const res = await restorePurchases();
    if (!res.ok) comingSoon();
  };

  const Plan = ({ value, label, price, sub, gold, badge }: {
    value: Period; label: string; price: string; sub: string; gold?: boolean; badge?: string;
  }) => {
    const selected = period === value;
    return (
      <Pressable
        onPress={() => { Haptics.selectionAsync(); setPeriod(value); }}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={[
          styles.plan,
          {
            backgroundColor: selected ? colors.primarySoft : colors.surface,
            borderColor: gold ? colors.gold : selected ? colors.primary : colors.border,
            borderWidth: gold ? 1.5 : selected ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.gold }]}>
            <Text style={[typo.label, { color: '#2A2030' }]}>{badge}</Text>
          </View>
        ) : null}
        <Text style={[typo.label, { color: gold ? colors.gold : colors.textTertiary }]}>{label}</Text>
        <Text style={{ fontFamily: SERIF, fontSize: 26, color: colors.text, marginTop: 4 }}>{price}</Text>
        <Text style={[typo.caption, { color: colors.textTertiary, marginTop: 2 }]}>{sub}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            {!isLocked && (
              <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel={tr('common.back')}>
                <X size={22} color={colors.textTertiary} strokeWidth={1.8} />
              </Pressable>
            )}
          </View>
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <LinearGradient colors={GOLD_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.crownTile}>
              <Crown size={30} color="#2A2030" strokeWidth={1.8} />
            </LinearGradient>
            <Text style={[typo.label, { color: colors.gold, marginTop: 16 }]}>MasterBook</Text>
            <Text style={{ fontFamily: 'CormorantGaramond_700Bold', fontSize: 52, letterSpacing: -0.5, color: colors.text, lineHeight: 54, marginTop: 2 }}>PRO</Text>
            <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontStyle: 'italic', fontSize: 21, color: colors.textSecondary, marginTop: 8 }}>
              {tr('settings.paywallProTagline')}
            </Text>
          </View>
        </View>

        {/* FEATURES */}
        <View style={styles.feats}>
          {feats.map(([label, sub], i) => (
            <View key={i} style={[styles.featRow, i < feats.length - 1 && { borderBottomColor: colors.borderLight, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[styles.featCheck, { backgroundColor: colors.goldSoft }]}>
                <Check size={15} color={colors.gold} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typo.bodyBold, { color: colors.text }]}>{label}</Text>
                <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 1 }]}>{sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* PLANS */}
        <View style={styles.plansRow}>
          <Plan value="monthly" label={tr('settings.paywallPlanMonth')} price={PRO_PRICE_MONTHLY} sub={tr('settings.paywallPerMonthWord')} />
          <Plan
            value="yearly"
            gold
            badge={tr('settings.planSave', { percent: PRO_YEARLY_SAVE_PERCENT })}
            label={tr('settings.paywallPlanYear')}
            price={PRO_PRICE_YEARLY_PER_MONTH}
            sub={tr('settings.paywallYearSub', { price: PRO_PRICE_YEARLY })}
          />
        </View>
      </ScrollView>

      {/* CTA bar */}
      <View style={[styles.ctaBar, { backgroundColor: colors.surfaceGlass, borderTopColor: colors.border }]}>
        <Button title={tr('settings.paywallCta')} onPress={onSubscribe} size="lg" fullWidth />
        <View style={styles.links}>
          <Pressable onPress={onRestore} hitSlop={8} accessibilityRole="button">
            <Text style={[typo.caption, { color: colors.textTertiary }]}>{tr('settings.paywallLinkRestore')}</Text>
          </Pressable>
          <View style={[styles.linkDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={[typo.caption, { color: colors.textTertiary }]}>{tr('settings.paywallLinkTerms')}</Text>
          <View style={[styles.linkDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={[typo.caption, { color: colors.textTertiary }]}>{tr('settings.paywallLinkCancel')}</Text>
        </View>
      </View>

      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 18 },
  heroTop: { flexDirection: 'row', justifyContent: 'flex-end', minHeight: 24 },
  crownTile: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  feats: { paddingHorizontal: 28 },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11 },
  featCheck: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  plansRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 24, marginTop: 20 },
  plan: { flex: 1, borderRadius: 16, padding: 14 },
  badge: { position: 'absolute', top: -10, right: 12, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 },
  ctaBar: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 28, borderTopWidth: StyleSheet.hairlineWidth },
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 12 },
  linkDot: { width: 3, height: 3, borderRadius: 2 },
});
