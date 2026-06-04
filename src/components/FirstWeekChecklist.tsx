import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Check, ChevronRight, Sparkles, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { GlassCard } from '@/src/components/ui';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { useProfessionPack } from '@/src/hooks/useProfessionPack';
import { useT } from '@/src/hooks/useT';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

/**
 * FirstWeekChecklist — gamified onboarding для нового мастера.
 *
 * Показывается на Today screen пока не выполнены все шаги. Когда юзер
 * закроет все 5 пунктов — карточка автоматически исчезает (return null).
 *
 * Завершённость каждого пункта ДЕРИВИРУЕТСЯ из реального состояния, не
 * сохраняется отдельно — это устраняет inconsistency между «галочкой»
 * и реальностью (e.g. юзер удалил всех клиентов — пункт «Добавь первого
 * клиента» снова активен).
 *
 * Pack-aware: `pack.firstWeekChecklist` определяет какие пункты показать
 * и куда они ведут. Для разных профессий список разный.
 */
export function FirstWeekChecklist() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const reduceMotion = useReduceMotion();
  const { pack } = useProfessionPack();
  const tr = useT();

  const clientsCount = useClientStore((s) => s.clients.length);
  const servicesCount = useServiceStore((s) => s.services.length);
  const apptCount = useAppointmentStore((s) => s.appointments.length);
  const workHours = useSettingsStore((s) => s.workHours);
  const biometricLock = useSettingsStore((s) => s.biometricLock);
  const firstUseAt = useSettingsStore((s) => s.firstUseAt);
  const checklistDismissedAt = useSettingsStore((s) => s.checklistDismissedAt);
  const dismissChecklist = useSettingsStore((s) => s.dismissChecklist);

  // Деривация done-флага per item-id. Маппинг знает только этот компонент,
  // pack-данные остаются чисто декларативными.
  const isDone = (itemId: string): boolean => {
    switch (itemId) {
      case 'add-client':
        return clientsCount > 0;
      case 'add-service':
        return servicesCount > 0;
      case 'create-appointment':
        return apptCount > 0;
      case 'work-hours':
        // Дефолт 09:00-20:00 — если изменилось, считаем выполненным
        return !(workHours.start === '09:00' && workHours.end === '20:00');
      case 'enable-biometric':
        return biometricLock;
      default:
        return false;
    }
  };

  const items = pack.firstWeekChecklist ?? [];
  const doneCount = useMemo(() => items.filter((i) => isDone(i.id)).length, [
    items,
    clientsCount,
    servicesCount,
    apptCount,
    workHours,
    biometricLock,
  ]);

  // Скрываем когда все выполнено — мастер уже onboarded.
  if (items.length === 0 || doneCount === items.length) return null;

  // Скрываем если юзер явно закрыл крестиком.
  if (checklistDismissedAt) return null;

  // Скрываем после 7 дней с firstUseAt — мастер уже не «новый».
  if (firstUseAt) {
    const ageMs = Date.now() - new Date(firstUseAt).getTime();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (ageMs > SEVEN_DAYS) return null;
  }

  const progressPct = (doneCount / items.length) * 100;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(180).duration(400)}
      style={{ paddingHorizontal: 16, marginBottom: sp.lg }}
    >
      <GlassCard style={{ padding: 0 }}>
        {/* Header с прогресс-баром */}
        <View style={[styles.header, { paddingHorizontal: sp.md, paddingTop: sp.md }]}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.sparkBubble,
                { backgroundColor: colors.primarySoft, borderRadius: br.sm },
              ]}
            >
              <Sparkles size={14} color={colors.primary} />
            </View>
            <Text style={[typo.bodyBold, { color: colors.text, marginLeft: sp.sm }]}>
              {tr('components.checklistTitle')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[typo.small, { color: colors.textSecondary }]}>
              {tr('components.checklistProgress', { done: doneCount, total: items.length })}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                dismissChecklist();
              }}
              accessibilityRole="button"
              accessibilityLabel={tr('components.checklistHide')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 4 }}
            >
              <X size={14} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ paddingHorizontal: sp.md, marginTop: 8 }}>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceElevated }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPct}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        {/* Items */}
        <View style={{ paddingHorizontal: sp.md, paddingVertical: 4 }}>
          {items.map((item) => {
            const done = isDone(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (done) return; // выполненный пункт — no-op
                  if (!item.href) return;
                  Haptics.selectionAsync();
                  router.push(item.href as Href);
                }}
                accessibilityRole="button"
                accessibilityState={{ disabled: done }}
                accessibilityLabel={done ? tr('components.checklistItemDoneA11y', { label: item.label }) : item.label}
                style={[styles.itemRow, { opacity: done ? 0.55 : 1 }]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: done ? colors.success : colors.border,
                      backgroundColor: done ? colors.success : 'transparent',
                    },
                  ]}
                >
                  {done && <Check size={14} color={colors.white} strokeWidth={3} />}
                </View>
                <Text
                  style={[
                    typo.body,
                    {
                      color: done ? colors.textSecondary : colors.text,
                      flex: 1,
                      textDecorationLine: done ? 'line-through' : 'none',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                {!done && <ChevronRight size={16} color={colors.textTertiary} />}
              </Pressable>
            );
          })}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkBubble: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
