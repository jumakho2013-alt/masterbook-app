import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Clock } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, useToast } from '@/src/components/ui';
import { useT } from '@/src/hooks/useT';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { toDateKey, formatTimeRange } from '@/src/utils/date';
import { openOutreach } from '@/src/lib/sleepingClients';

function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateKey(d);
}

export default function RemindersTomorrowScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const toast = useToast();
  const tr = useT();

  const appointments = useAppointmentStore((s) => s.appointments);
  const clients = useClientStore((s) => s.clients);
  const services = useServiceStore((s) => s.services);
  const masterName = useSettingsStore((s) => s.masterName);

  const rows = useMemo(() => {
    const key = tomorrowKey();
    return appointments
      .filter((a) => a.date === key && a.status === 'scheduled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((a) => ({
        appt: a,
        client: clients.find((c) => c.id === a.clientId),
        service: services.find((s) => s.id === a.serviceId),
      }));
  }, [appointments, clients, services]);

  const remind = async (clientName: string, phone: string | undefined, time: string, serviceName?: string) => {
    if (!phone) {
      toast.error(tr('misc.remindNoPhone'));
      return;
    }
    const firstName = clientName.split(' ')[0] || clientName;
    const svc = serviceName ? tr('misc.remindSvc', { service: serviceName }) : '';
    const sig = masterName ? `\n\n— ${masterName}` : '';
    const msg = tr('misc.remindText', { name: firstName, time, svc }) + sig;
    const ok = await openOutreach('whatsapp', phone, msg);
    if (!ok) toast.error(tr('misc.remindWhatsappFailed'));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton icon={<ArrowLeft size={22} color={colors.text} />} onPress={() => router.back()} variant="ghost" />
        <Text style={[typo.h3, { color: colors.text }]}>{tr('misc.remindTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.appt.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          rows.length > 0 ? (
            <Text style={[typo.body, { color: colors.textSecondary, marginBottom: sp.md }]}>
              {tr('misc.remindHeader')}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <Text style={[typo.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 48 }]}>
            {tr('misc.remindEmpty')}
          </Text>
        }
        renderItem={({ item }) => {
          const name = item.client?.name ?? tr('misc.remindClientFallback');
          return (
            <GlassCard style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[typo.bodyBold, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                <View style={styles.metaRow}>
                  <Clock size={13} color={colors.textTertiary} />
                  <Text style={[typo.caption, { color: colors.textSecondary }]}>
                    {formatTimeRange(item.appt.startTime, item.appt.endTime)}
                    {item.service ? ` · ${item.service.name}` : ''}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => remind(name, item.client?.phone, item.appt.startTime, item.service?.name)}
                style={[styles.remindBtn, { backgroundColor: colors.primarySoft }]}
                accessibilityRole="button"
                accessibilityLabel={tr('misc.remindA11y', { name })}
              >
                <MessageCircle size={16} color={colors.primary} />
                <Text style={[typo.caption, { color: colors.primary, fontFamily: typo.bodyBold.fontFamily }]}>{tr('misc.remindBtn')}</Text>
              </Pressable>
            </GlassCard>
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
});
