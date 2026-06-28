import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import * as Haptics from '@/src/lib/haptics';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton } from '@/src/components/ui';
import { useT } from '@/src/hooks/useT';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { SUPPORTED_CURRENCIES, formatCurrency } from '@/src/utils/currency';
import type { CurrencyCode } from '@/src/utils/currency.types';

/**
 * Экран выбора валюты. Меняет настройку глобально — все экраны где
 * вызывается formatCurrency(amount) сразу начнут показывать новый знак
 * (компоненты подписаны через useSettingsStore).
 *
 * Без миграции данных: исторические записи остаются с теми же числовыми
 * amount, только символ меняется. Если мастер реально переезжает страну,
 * он сам поправит цены через UI услуг.
 */
export default function CurrencyScreen() {
  const router = useRouter();
  const tr = useT();
  const { colors, typography: typo } = useTheme();
  const current = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);

  const choose = (code: CurrencyCode) => {
    Haptics.selectionAsync();
    setCurrency(code);
    router.back();
  };

  // Показываем все поддерживаемые валюты (СНГ + базовые западные). Раньше список
  // был зашит на RUB/USD/EUR — из-за чего дефолтный сомони (TJS) был не виден и
  // его нельзя было выбрать. Порядок — как в SUPPORTED_CURRENCIES (TJS первым).
  const pickerCurrencies = SUPPORTED_CURRENCIES;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel={tr('common.back')}
        />
        <Text style={[typo.h3, { color: colors.text }]}>{tr('settings.currencyTitle')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <Text style={[typo.caption, { color: colors.textSecondary, paddingHorizontal: 20, marginBottom: 12 }]}>
        {tr('settings.currencyHint')}
      </Text>

      <FlatList
        data={pickerCurrencies}
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
              accessibilityLabel={tr('settings.currencyExampleA11y', { name: item.name, example: formatCurrency(2500, item.code) })}
            >
              <GlassCard style={styles.row}>
                <View style={[styles.symbolBubble, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[typo.bodyBold, { color: colors.primary }]}>{item.symbol}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typo.body, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                    {item.code} · {formatCurrency(2500, item.code)}
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
    gap: 14,
  },
  symbolBubble: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
