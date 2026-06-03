import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Circle,
  Line as SvgLine,
} from 'react-native-svg';
import { useTheme } from '@/src/theme';
import { formatCurrencyShort } from '@/src/utils/currency';
import type { FinanceEntry } from '@/src/types';

interface FinanceChartProps {
  entries: FinanceEntry[];
  days: number;
}

/**
 * Premium area-line chart дохода по дням.
 *
 * Дизайн по UI/UX Pro Max (chart domain, «Trend Over Time»):
 *   • Smooth area chart с gradient fill (тут — success/emerald)
 *   • Fill opacity gradient: 35% вверху → 0% внизу
 *   • Точки-маркеры на каждом дне с большой точкой на «сегодня»
 *   • Baseline тонкая линия + подпись max-значения
 *   • Расход — отдельная тонкая danger-линия поверх (без fill, чтобы не
 *     спорить с income-областью)
 *
 * Catmull-Rom → Bezier для плавности кривой (не ломаные линии).
 */
export function FinanceChart({ entries, days }: FinanceChartProps) {
  const { colors, typography: typo } = useTheme();
  const { width: screenW } = useWindowDimensions();

  // Ширина = ширина экрана минус горизонтальные паддинги (16+16) и
  // padding GlassCard (20+20). Высота фиксирована.
  const CHART_W = screenW - 32 - 40;
  const CHART_H = 130;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 24;
  const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;

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
    // Месяц (30д) — группируем по 5 чтобы не было каши
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

  const maxValue = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);

  const n = data.length;
  const stepX = n > 1 ? CHART_W / (n - 1) : CHART_W;

  // helper: координата точки
  const px = (i: number) => i * stepX;
  const py = (v: number) => PAD_TOP + innerH - (v / maxValue) * innerH;

  // Catmull-Rom → Bezier smooth path
  const buildSmoothPath = (vals: number[]): string => {
    if (vals.length === 0) return '';
    if (vals.length === 1) return `M ${px(0)} ${py(vals[0])}`;
    const pts = vals.map((v, i) => ({ x: px(i), y: py(v) }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const incomeLine = buildSmoothPath(data.map((d) => d.income));
  const incomeArea =
    incomeLine +
    ` L ${px(n - 1)} ${PAD_TOP + innerH} L ${px(0)} ${PAD_TOP + innerH} Z`;
  const hasExpense = data.some((d) => d.expense > 0);
  const expenseLine = hasExpense ? buildSmoothPath(data.map((d) => d.expense)) : '';

  const empty = data.every((d) => d.income === 0 && d.expense === 0);

  return (
    <View style={styles.container}>
      {/* Max-value подпись сверху справа */}
      {!empty && (
        <Text style={[typo.small, { color: colors.textTertiary, alignSelf: 'flex-end', marginBottom: 4 }]}>
          макс {formatCurrencyShort(maxValue)}
        </Text>
      )}

      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          {/* Заливка области: насыщеннее вверху, в ноль внизу. */}
          <LinearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.success} stopOpacity="0.42" />
            <Stop offset="0.7" stopColor={colors.success} stopOpacity="0.08" />
            <Stop offset="1" stopColor={colors.success} stopOpacity="0" />
          </LinearGradient>
          {/* Горизонтальный градиент линии: изумруд → золото (брендовая гамма). */}
          <LinearGradient id="incomeStroke" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.success} />
            <Stop offset="1" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>

        {/* Baseline */}
        <SvgLine
          x1="0"
          y1={PAD_TOP + innerH}
          x2={CHART_W}
          y2={PAD_TOP + innerH}
          stroke={colors.border}
          strokeWidth="1"
        />

        {!empty && (
          <>
            {/* Income area fill */}
            <Path d={incomeArea} fill="url(#incomeFill)" />
            {/* Soft glow — широкая полупрозрачная копия линии под основной. */}
            <Path
              d={incomeLine}
              fill="none"
              stroke={colors.success}
              strokeWidth="7"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.16}
            />
            {/* Income line — градиентный штрих изумруд→золото */}
            <Path
              d={incomeLine}
              fill="none"
              stroke="url(#incomeStroke)"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Expense line (тонкая, danger, dashed) */}
            {hasExpense && (
              <Path
                d={expenseLine}
                fill="none"
                stroke={colors.danger}
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeLinejoin="round"
                opacity={0.8}
              />
            )}
            {/* Маркер последней точки с «гало» — как индикатор текущего
                значения в health-app (без точек на каждом дне → чище). */}
            {(() => {
              const lastIdx = n - 1;
              const lastVal = data[lastIdx]?.income ?? 0;
              if (lastVal <= 0) return null;
              return (
                <>
                  <Circle cx={px(lastIdx)} cy={py(lastVal)} r={9} fill={colors.accent} opacity={0.18} />
                  <Circle
                    cx={px(lastIdx)}
                    cy={py(lastVal)}
                    r={4}
                    fill={colors.accent}
                    stroke={colors.surface}
                    strokeWidth={2}
                  />
                </>
              );
            })()}
          </>
        )}
      </Svg>

      {/* X-axis day labels */}
      <View style={[styles.xAxis, { width: CHART_W }]}>
        {data.map((d, i) => (
          <Text
            key={i}
            style={[
              typo.small,
              {
                color: d.isToday ? colors.success : colors.textTertiary,
                fontSize: 9,
                fontFamily: d.isToday ? typo.bodyBold.fontFamily : typo.small.fontFamily,
              },
            ]}
          >
            {d.dayNum}
          </Text>
        ))}
      </View>

      {empty && (
        <Text style={[typo.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: -70, marginBottom: 50 }]}>
          Пока нет данных за период
        </Text>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[typo.small, { color: colors.textSecondary }]}>Доход</Text>
        </View>
        {hasExpense && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDash, { backgroundColor: colors.danger }]} />
            <Text style={[typo.small, { color: colors.textSecondary }]}>Расход</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDash: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
});
