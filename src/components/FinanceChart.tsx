import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme';
import type { FinanceEntry } from '@/src/types';

interface FinanceChartProps {
  entries: FinanceEntry[];
  days: number;
}

export function FinanceChart({ entries, days }: FinanceChartProps) {
  const { colors, typography: typo, borderRadius: br } = useTheme();

  // Build daily totals
  const dailyData: { date: string; dayNum: string; income: number; expense: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayNum = d.getDate().toString();

    const dayEntries = entries.filter((e) => e.date === key);
    const income = dayEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = dayEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

    dailyData.push({ date: key, dayNum, income, expense });
  }

  // For month view (30 days), group by ~3 day chunks to avoid cramping
  const isMonth = days > 14;
  const displayData = isMonth ? groupByChunks(dailyData, 5) : dailyData;

  const maxValue = Math.max(
    ...displayData.map((d) => Math.max(d.income, d.expense)),
    1,
  );

  const BAR_HEIGHT = 100;

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {displayData.map((day, i) => {
          const incomeH = (day.income / maxValue) * BAR_HEIGHT;
          const expenseH = (day.expense / maxValue) * BAR_HEIGHT;

          return (
            <View key={i} style={styles.barGroup}>
              <View style={styles.barsWrap}>
                {day.income > 0 && (
                  <View style={[styles.bar, { height: Math.max(incomeH, 4), backgroundColor: colors.success, borderRadius: 4 }]} />
                )}
                {day.expense > 0 && (
                  <View style={[styles.bar, { height: Math.max(expenseH, 4), backgroundColor: colors.danger, opacity: 0.5, borderRadius: 4 }]} />
                )}
                {day.income === 0 && day.expense === 0 && (
                  <View style={[styles.bar, { height: 4, backgroundColor: colors.border, borderRadius: 2 }]} />
                )}
              </View>
              <Text style={[typo.small, { color: colors.textTertiary, marginTop: 8, fontSize: 9 }]}>
                {day.dayNum}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[typo.small, { color: colors.textSecondary }]}>Доход</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger, opacity: 0.5 }]} />
          <Text style={[typo.small, { color: colors.textSecondary }]}>Расход</Text>
        </View>
      </View>
    </View>
  );
}

function groupByChunks(
  data: { date: string; dayNum: string; income: number; expense: number }[],
  size: number,
) {
  const result: { date: string; dayNum: string; income: number; expense: number }[] = [];
  for (let i = 0; i < data.length; i += size) {
    const chunk = data.slice(i, i + size);
    const income = chunk.reduce((s, d) => s + d.income, 0);
    const expense = chunk.reduce((s, d) => s + d.expense, 0);
    const firstDay = chunk[0].dayNum;
    const lastDay = chunk[chunk.length - 1].dayNum;
    result.push({
      date: chunk[0].date,
      dayNum: `${firstDay}-${lastDay}`,
      income,
      expense,
    });
  }
  return result;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 130,
    paddingHorizontal: 4,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    width: 10,
    minWidth: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
