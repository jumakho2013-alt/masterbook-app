import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard } from '@/src/components/ui';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useSyncStore } from '@/src/stores/useSyncStore';
import { syncNow } from '@/src/lib/cloudSync';
import { daysSince } from '@/src/utils/date';
import { useT } from '@/src/hooks/useT';

/**
 * Карточка статуса облачной синхронизации в Профиле. Тап → ручная
 * синхронизация (pull + push). В local-only режиме показывает, что облако
 * выключено (данные только на телефоне).
 */
export function SyncStatusCard() {
  const { colors, typography: typo, spacing: sp } = useTheme();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const localOnly = useAuthStore((s) => s.localOnlyMode);
  const status = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const tr = useT();
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy || status === 'syncing') return;
    setBusy(true);
    try {
      await syncNow();
    } finally {
      setBusy(false);
    }
  };

  // Local-only: облако не используется. Честно сообщаем.
  if (!userId || localOnly) {
    return (
      <View style={[styles.row, { paddingHorizontal: sp.md }]}>
        <CloudOff size={20} color={colors.textTertiary} />
        <View style={{ flex: 1 }}>
          <Text style={[typo.body, { color: colors.text }]}>{tr('components.syncCloudOff')}</Text>
          <Text style={[typo.small, { color: colors.textTertiary, marginTop: 1 }]}>
            {tr('components.syncCloudOffHint')}
          </Text>
        </View>
      </View>
    );
  }

  const syncing = busy || status === 'syncing';
  const isError = status === 'error';

  let icon: React.ReactNode;
  let title: string;
  let subtitle: string;
  if (syncing) {
    icon = <ActivityIndicator size="small" color={colors.primary} />;
    title = tr('components.syncSyncing');
    subtitle = tr('components.syncSyncingHint');
  } else if (isError) {
    icon = <CloudOff size={20} color={colors.danger} />;
    title = tr('components.syncError');
    subtitle = tr('components.syncErrorHint');
  } else if (lastSyncedAt) {
    icon = <CheckCircle2 size={20} color={colors.success} />;
    title = tr('components.syncDone');
    subtitle = tr('components.syncDoneHint', { ago: daysSince(lastSyncedAt) });
  } else {
    icon = <Cloud size={20} color={colors.primary} />;
    title = tr('components.syncIdle');
    subtitle = tr('components.syncIdleHint');
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={syncing}>
      <GlassCard style={styles.cardRow}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={[typo.body, { color: colors.text }]}>{title}</Text>
          <Text style={[typo.small, { color: colors.textTertiary, marginTop: 1 }]}>{subtitle}</Text>
        </View>
        {!syncing && <RefreshCw size={18} color={colors.textTertiary} />}
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
});
