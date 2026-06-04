import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { useT } from '@/src/hooks/useT';
import { formatCurrency } from '@/src/utils/currency';
import { timeToMinutes, nowMinutesOfDay } from '@/src/utils/time';
import type { Appointment, Client, Service } from '@/src/types';

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 23;
const HOUR_HEIGHT = 64;
const TIME_COL_WIDTH = 56;

interface DayViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  getClient: (id: string) => Client | undefined;
  getService: (id: string) => Service | undefined;
  onPressEmpty: (hour: number) => void;
  onPressAppt: (id: string) => void;
  bottomOffset?: number;
}

/**
 * Hour-grid Day view — главный «рабочий» режим календаря для соло-мастера.
 * Это то что Маша хотела в ревью: «слоты времени блоками, как у YClients».
 *
 * Дизайн:
 *   - 06:00 → 23:00 вертикально, 64pt на час (плотно но читаемо)
 *   - Слева — узкая колонка с временем
 *   - Справа — пустые «час-rows» которые тапаются для создания записи
 *   - Записи — absolute-positioned блоки поверх hour-rows, шириной всей правой
 *     колонки, высотой пропорционально длительности. Цвет — service.color.
 *   - «Сейчас» — красная hairline через всю ширину если selectedDate === today
 *   - Auto-scroll к 8:00 / first-appointment / now при mount
 */
export function DayView({
  appointments,
  selectedDate,
  getClient,
  getService,
  onPressEmpty,
  onPressAppt,
  bottomOffset = 0,
}: DayViewProps) {
  const { colors, typography: typo, borderRadius: br } = useTheme();
  const tr = useT();
  const scrollRef = useRef<ScrollView>(null);

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      today.getFullYear() === selectedDate.getFullYear() &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getDate() === selectedDate.getDate()
    );
  }, [selectedDate]);

  // Авто-скролл при mount + при смене selectedDate: к ближайшей записи
  // или к 08:00 как дефолт.
  useEffect(() => {
    const firstApptMin = appointments
      .map((a) => timeToMinutes(a.startTime))
      .sort((a, b) => a - b)[0];
    const target = firstApptMin ?? 8 * 60;
    const y = ((target - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT - 60;
    scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: false });
  }, [selectedDate, appointments]);

  // Текущая минута для «Сейчас» линии.
  const [nowMin, setNowMin] = React.useState(() => nowMinutesOfDay());
  useEffect(() => {
    if (!isToday) return;
    const t = setInterval(() => setNowMin(nowMinutesOfDay()), 60_000);
    return () => clearInterval(t);
  }, [isToday]);

  const hours = useMemo(() => {
    const out: number[] = [];
    for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) out.push(h);
    return out;
  }, []);

  const totalHeight = (DAY_END_HOUR - DAY_START_HOUR + 1) * HOUR_HEIGHT;

  // Y-position helper based on minutes since DAY_START_HOUR.
  const yFor = (totalMinutes: number) =>
    ((totalMinutes - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;

  // Видны ли «сейчас» — только если время в диапазоне отображения.
  const showNowLine =
    isToday && nowMin >= DAY_START_HOUR * 60 && nowMin <= DAY_END_HOUR * 60;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: bottomOffset + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: totalHeight }}>
          {/* Hour rows (background) — каждый row tappable для создания записи */}
          {hours.map((h) => (
            <Pressable
              key={h}
              onPress={() => onPressEmpty(h)}
              accessibilityRole="button"
              accessibilityLabel={tr('components.dayCreateApptA11y', { time: `${h.toString().padStart(2, '0')}:00` })}
              style={[
                styles.hourRow,
                {
                  height: HOUR_HEIGHT,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typo.small,
                  { color: colors.textTertiary, width: TIME_COL_WIDTH - 8, textAlign: 'right' },
                ]}
              >
                {h.toString().padStart(2, '0')}:00
              </Text>
              <View style={{ flex: 1 }} />
            </Pressable>
          ))}

          {/* Appointment blocks (absolute over hour rows) */}
          {appointments.map((a) => {
            const startMin = timeToMinutes(a.startTime);
            const endMin = timeToMinutes(a.endTime);
            if (
              endMin <= DAY_START_HOUR * 60 ||
              startMin >= DAY_END_HOUR * 60 + 60
            ) {
              return null; // outside visible range — пропускаем
            }
            const top = yFor(Math.max(startMin, DAY_START_HOUR * 60));
            const heightPx = Math.max(
              26,
              yFor(Math.min(endMin, DAY_END_HOUR * 60 + 60)) - top,
            );
            const client = getClient(a.clientId);
            const service = getService(a.serviceId);
            const color = service?.color ?? colors.primary;
            const isCancelled = a.status === 'cancelled' || a.status === 'no-show';
            const isCompleted = a.status === 'completed';

            return (
              <Pressable
                key={a.id}
                onPress={() => onPressAppt(a.id)}
                accessibilityRole="button"
                accessibilityLabel={`${a.startTime}, ${service?.name ?? ''}, ${client?.name ?? ''}`}
                style={[
                  styles.apptBlock,
                  {
                    top,
                    left: TIME_COL_WIDTH + 6,
                    height: heightPx - 2,
                    backgroundColor: isCancelled ? colors.surface : color + '22',
                    borderLeftColor: color,
                    borderRadius: br.sm,
                    opacity: isCancelled ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    typo.small,
                    {
                      color: isCompleted ? colors.textTertiary : colors.text,
                      fontFamily: typo.bodyBold.fontFamily,
                      textDecorationLine: isCancelled ? 'line-through' : 'none',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {client?.name ?? tr('components.clientFallback')}
                </Text>
                {heightPx >= 38 && (
                  <Text
                    style={[
                      typo.small,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                    numberOfLines={1}
                  >
                    {a.startTime} · {service?.name ?? ''}
                  </Text>
                )}
                {heightPx >= 56 && (
                  <Text
                    style={[
                      typo.small,
                      { color: color, marginTop: 'auto', fontFamily: typo.bodyBold.fontFamily },
                    ]}
                  >
                    {formatCurrency(a.price)}
                  </Text>
                )}
              </Pressable>
            );
          })}

          {/* «Сейчас» горизонтальная линия */}
          {showNowLine && (
            <View
              pointerEvents="none"
              style={[
                styles.nowLine,
                {
                  top: yFor(nowMin),
                  left: TIME_COL_WIDTH - 4,
                  right: 8,
                },
              ]}
            >
              <View style={[styles.nowDot, { backgroundColor: colors.danger }]} />
              <View style={[styles.nowBar, { backgroundColor: colors.danger }]} />
            </View>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 2,
    paddingRight: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  apptBlock: {
    position: 'absolute',
    right: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
  },
  nowLine: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    height: 2,
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: -4,
  },
  nowBar: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
});
