import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme';
import { useT } from '@/src/hooks/useT';
import { formatCurrencyShort } from '@/src/utils/currency';
import type { FinanceEntry } from '@/src/types';

interface FinanceChartProps {
  entries: FinanceEntry[];
  days: number;
}

/**
 * Atelier: простой столбчатый график дохода по дням. Неактивные столбики —
 * `primarySoft` с хайрлайн-бордером, сегодняшний — сплошной `primary`.
 * Никаких ярких градиентов и тяжёлой графики — редакционная сдержанность.
 */
export function FinanceChart({ entries, days }: FinanceChartProps) {
  const { colors, typography: typo } = useTheme();
  const tr = useT();

  const data = useMemo(() => {
    const out: { dayNum: string; income: number; expense: number; isToday: boolean }[] = [];
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayEntries = entries.filter((e) => e.date === key);
      out.push({
        dayNum: d.getDate().toString(),
        income: dayEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0),
        expense: dayEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
        isToday: key === todayKey,
      });
    }
    // Месяц (30д) — группируем по 5 чтобы столбики не превратились в кашу.
    if (days > 14) {
      const grouped: typeof out = [];
      for (let i = 0; i < out.length; i += 5) {
        const chunk = out.slice(i, i + 5);
        grouped.push({
          dayNum: `${chunk[0].dayNum}`,
          income: chunk.reduce((s, c) => s + c.income, 0),
          expense: chunk.reduce((s, c) => s + c.expense, 0),
          isToday: chunk.some((c) => c.isToday),
        });
      }
      return grouped;
    }
    return out;
  }, [entries, days]);

  const maxValue = Math.max(...data.map((d) => d.income), 1);
  const empty = data.every((d) => d.income === 0 && d.expense === 0);
  const BARS_H = 132;

  return (
    <View style={styles.container}>
      {!empty && (
        <Text style={[typo.label, { color: colors.textTertiary, alignSelf: 'flex-end', marginBottom: 8 }]}>
          {tr('components.chartMax', { value: formatCurrencyShort(maxValue) })}
        </Text>
      )}

      <View style={[styles.bars, { height: BARS_H }]}>
        {data.map((d, i) => {
          const ratio = maxValue > 0 ? d.income / maxValue : 0;
          const active = d.isToday;
          return (
            <View key={i} style={styles.col}>
              <View style={styles.track}>
                <View
                  style={{
                    width: '62%',
                    height: `${Math.max(ratio * 100, d.income > 0 ? 3 : 0)}%`,
                    minHeight: d.income > 0 ? 4 : 0,
                    borderRadius: 6,
                    backgroundColor: active ? colors.primary : colors.primarySoft,
                    borderWidth: active ? 0 : StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                  }}
                />
              </View>
              <Text
                style={[
                  typo.label,
                  { color: active ? colors.primary : colors.textTertiary, marginTop: 6 },
                ]}
              >
                {d.dayNum}
              </Text>
            </View>
          );
        })}
      </View>

      {empty && (
        <Text style={[typo.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: -BARS_H / 2 }]}>
          {tr('components.chartEmpty')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 4 },
  bars: { flexDirection: 'row', alignItems: 'flex-end' },
  col: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  track: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
});
