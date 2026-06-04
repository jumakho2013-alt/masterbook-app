import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { IconButton, Button, CustomAlert } from '@/src/components/ui';
import { MasterBookLogo } from '@/src/components/MasterBookLogo';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import {
  purchasePro,
  restorePurchases,
  trialDaysLeft,
  PRO_PRICE_MONTHLY,
  PRO_PRICE_YEARLY,
  PRO_PRICE_YEARLY_PER_MONTH,
  PRO_YEARLY_SAVE_PERCENT,
  PRO_PRODUCT_ID_MONTHLY,
  PRO_PRODUCT_ID_YEARLY,
} from '@/src/lib/iap';

type Period = 'monthly' | 'yearly';

/**
 * MasterBook Pro — премиальный paywall (стиль: изумруд-золото, стекло).
 * Помесячно / Годовой (−20%), 7 дней бесплатно, список возможностей, CTA.
 * Реальная оплата подключается через RevenueCat (см. docs/PAYWALL_SETUP.md);
 * пока purchasePro возвращает unavailable → честное «скоро».
 * ?locked=1 → режим жёсткого paywall (без «назад»).
 */
export default function SubscriptionScreen() {
  const router = useRouter();
  const tr = useT();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const { alertConfig, info } = useAlert();
  const firstUseAt = useSettingsStore((s) => s.firstUseAt);
  const { locked } = useLocalSearchParams<{ locked?: string }>();
  const isLocked = locked === '1';

  const [period, setPeriod] = useState<Period>('yearly'); // годовой выгоднее — по умолчанию
  const trialLeft = trialDaysLeft(firstUseAt);

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
    const id = period === 'yearly' ? PRO_PRODUCT_ID_YEARLY : PRO_PRODUCT_ID_MONTHLY;
    const res = await purchasePro(id);
    if (!res.ok) comingSoon();
  };

  const onRestore = async () => {
    const res = await restorePurchases();
    if (!res.ok) comingSoon();
  };

  const PlanCard = ({
    value,
    title,
    price,
    note,
    badge,
  }: {
    value: Period;
    title: string;
    price: string;
    note?: string;
    badge?: string;
  }) => {
    const selected = period === value;
    return (
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setPeriod(value);
        }}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={[
          styles.planCard,
          {
            backgroundColor: selected ? colors.primarySoft : colors.surface,
            borderColor: selected ? colors.primary : colors.border,
            borderWidth: selected ? 2 : 1,
            borderRadius: br.lg,
          },
        ]}
      >
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.primary, borderRadius: br.full }]}>
            <Text style={[typo.small, { color: colors.white, fontFamily: 'PlusJakartaSans_700Bold' }]}>
              {badge}
            </Text>
          </View>
        ) : null}

        <View style={styles.planTitleRow}>
          <Text style={[typo.caption, { color: colors.textSecondary }]}>{title}</Text>
          <View
            style={[
              styles.radio,
              { borderColor: selected ? colors.primary : colors.border },
              selected && { backgroundColor: colors.primary },
            ]}
          >
            {selected ? <Check size={12} color={colors.white} /> : null}
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={[typo.h2, { color: colors.text }]}>{price}</Text>
          <Text style={[typo.caption, { color: colors.textSecondary, marginBottom: 4 }]}>
            {tr('settings.paywallPerMonth')}
          </Text>
        </View>

        <Text style={[typo.small, { color: colors.textTertiary, minHeight: 16 }]}>{note ?? ''}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.topBar}>
        {isLocked ? (
          <View style={{ width: 48 }} />
        ) : (
          <IconButton
            icon={<ArrowLeft size={22} color={colors.text} />}
            onPress={() => router.back()}
            variant="ghost"
            accessibilityLabel={tr('common.back')}
          />
        )}
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Бренд */}
        <View style={styles.brand}>
          <MasterBookLogo size={52} />
          <Text style={[typo.h3, { color: colors.text, marginTop: sp.sm }]}>MasterBook</Text>
          <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2, textAlign: 'center' }]}>
            {tr('settings.paywallTagline')}
          </Text>
        </View>

        {/* Заголовок */}
        <Text style={[typo.h1, { color: colors.text, textAlign: 'center', marginTop: sp.lg }]}>
          {tr('settings.paywallHeadline')}
        </Text>
        <Text
          style={[
            typo.body,
            { color: colors.textSecondary, textAlign: 'center', marginTop: sp.xs, paddingHorizontal: 8 },
          ]}
        >
          {tr('settings.paywallSub')}
        </Text>

        {/* Планы: помесячно / годовой */}
        <View style={styles.plansRow}>
          <PlanCard
            value="monthly"
            title={tr('settings.planMonthly')}
            price={PRO_PRICE_MONTHLY}
            note={tr('settings.paywallTrialFree')}
          />
          <PlanCard
            value="yearly"
            title={tr('settings.planYearly')}
            price={PRO_PRICE_YEARLY_PER_MONTH}
            note={tr('settings.paywallYearBilled', { price: PRO_PRICE_YEARLY })}
            badge={tr('settings.planSave', { percent: PRO_YEARLY_SAVE_PERCENT })}
          />
        </View>

        <Button
          title={tr('settings.paywallCta')}
          onPress={onSubscribe}
          size="lg"
          style={{ marginTop: sp.lg }}
        />

        {/* Что входит */}
        <Text style={[typo.bodyBold, { color: colors.text, marginTop: sp.xl, marginBottom: sp.sm }]}>
          {tr('settings.paywallWhatsIncluded')}
        </Text>
        <View style={{ gap: sp.md }}>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={[styles.checkWrap, { backgroundColor: colors.successSoft }]}>
                <Check size={15} color={colors.success} />
              </View>
              <Text style={[typo.body, { color: colors.text, flex: 1 }]}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Статус триала + восстановление */}
        <Text
          style={[
            typo.caption,
            {
              color: trialLeft > 0 ? colors.success : colors.textTertiary,
              textAlign: 'center',
              marginTop: sp.lg,
            },
          ]}
        >
          {trialLeft > 0
            ? tr('settings.proTrialLeft', { n: trialLeft })
            : tr('settings.proTrialEnded')}
        </Text>
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
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  brand: { alignItems: 'center', marginTop: 4 },
  plansRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  planCard: {
    flex: 1,
    padding: 16,
    minHeight: 132,
    justifyContent: 'flex-start',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginTop: 10,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    zIndex: 1,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  checkWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  restoreBtn: { alignItems: 'center', paddingVertical: 14 },
});
