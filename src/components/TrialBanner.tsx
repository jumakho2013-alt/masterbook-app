import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { getAccessStatus, trialDaysLeft, PRO_PRICE } from '@/src/lib/iap';
import { useT } from '@/src/hooks/useT';

/**
 * Баннер подписки на Today. Не нагружает каждый день:
 *   • триал идёт, >3 дней осталось → ничего;
 *   • последние 3 дня триала → мягкое напоминание;
 *   • триал истёк → заметный призыв оформить.
 * Тап → экран Pro. Жёсткий гейт (блокировка) включится вместе с реальным IAP
 * (SUBSCRIPTION_ENFORCED), пока — только баннер.
 */
export function TrialBanner() {
  const { colors, typography: typo, borderRadius: br } = useTheme();
  const router = useRouter();
  const tr = useT();
  const firstUseAt = useSettingsStore((s) => s.firstUseAt);

  const status = getAccessStatus(firstUseAt);
  if (status === 'subscribed') return null;

  const left = trialDaysLeft(firstUseAt);
  const expired = status === 'expired';
  if (!expired && left > 3) return null; // не нагружаем в начале триала

  const accent = expired ? colors.warning : colors.primary;

  return (
    <Pressable
      onPress={() => router.push('/settings/subscription')}
      accessibilityRole="button"
      accessibilityLabel={tr('settings.proTitle')}
      style={[
        styles.wrap,
        { backgroundColor: colors.surface, borderColor: accent + '55', borderRadius: br.lg },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
        <Crown size={18} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typo.bodyBold, { color: colors.text }]}>
          {expired ? tr('settings.proTrialEnded') : tr('settings.proTrialLeft', { n: left })}
        </Text>
        <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 1 }]}>
          {tr('settings.proCta', { price: PRO_PRICE })}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
