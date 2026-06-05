import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, Users, Moon, UserPlus } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { SearchBar, EmptyState, GlassCard, Badge } from '@/src/components/ui';
import { SwipeableClientRow } from '@/src/components/SwipeableClientRow';
import { useClientStore } from '@/src/stores/useClientStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useTabBarOffset } from '@/src/hooks/useTabBarOffset';
import { findSleepingClients } from '@/src/lib/sleepingClients';
import { toDateKey } from '@/src/utils/date';
import { useProfessionPack } from '@/src/hooks/useProfessionPack';
import { useT } from '@/src/hooks/useT';
import type { Client } from '@/src/types';

const SLEEPING_DAYS = 45;

type Filter = 'all' | 'vip' | 'new' | 'debt';
const FILTER_KEYS: Record<Filter, string> = {
  all: 'clients.filterAll',
  vip: 'clients.filterVip',
  new: 'clients.filterNew',
  debt: 'clients.filterDebt',
};

const SERIF = 'CormorantGaramond_600SemiBold';

function ClientsScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, isDark } = useTheme();
  const fabOffset = useTabBarOffset(16);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const allClients = useClientStore((s) => s.clients);
  const allAppointments = useAppointmentStore((s) => s.appointments);
  const services = useServiceStore((s) => s.services);
  const { pack } = useProfessionPack();
  const tr = useT();
  const onPrimary = isDark ? '#2A2030' : colors.white;

  const lastVisitMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of allAppointments) {
      if (a.status === 'completed' && (!map[a.clientId] || a.date > map[a.clientId])) {
        map[a.clientId] = a.date;
      }
    }
    return map;
  }, [allAppointments]);

  // Поиск + фильтр (Все/VIP/Новые/Должники), затем алфавитная группировка.
  const sections = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = allClients.filter((c) => {
      if (q && !(
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.notes.toLowerCase().includes(q) ||
        (c.preferences?.toLowerCase().includes(q) ?? false) ||
        (c.address?.toLowerCase().includes(q) ?? false)
      )) return false;
      if (filter === 'vip') return c.tags.includes('vip');
      if (filter === 'new') return c.tags.includes('new');
      if (filter === 'debt') return (c.debt ?? 0) > 0;
      return true;
    });

    const byLetter: Record<string, Client[]> = {};
    for (const c of filtered) {
      const letter = (c.name.trim()[0] || '#').toUpperCase();
      (byLetter[letter] ??= []).push(c);
    }
    return Object.keys(byLetter)
      .sort((a, b) => a.localeCompare(b, 'ru'))
      .map((letter) => ({ title: letter, data: byLetter[letter].sort((a, b) => a.name.localeCompare(b.name, 'ru')) }));
  }, [allClients, search, filter]);

  const sleeping = useMemo(() => {
    if (search || filter !== 'all') return [];
    return findSleepingClients({
      clients: allClients,
      appointments: allAppointments,
      todayKey: toDateKey(new Date()),
      thresholdDays: SLEEPING_DAYS,
      serviceNameById: (sid) => services.find((s) => s.id === sid)?.name,
    });
  }, [allClients, allAppointments, services, search, filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      {/* Header: title + count (его раскладка) + кнопка импорта (наша фича) */}
      <View style={[styles.header, styles.headerRow]}>
        <Text style={[typo.display, { color: colors.text, textTransform: 'capitalize' }]}>{tr('clients.title')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={[typo.label, { color: colors.textTertiary }]}>{tr('clients.totalCount', { count: allClients.length })}</Text>
          <Pressable
            onPress={() => router.push('/client/import')}
            accessibilityRole="button"
            accessibilityLabel={tr('clientImport.title')}
            hitSlop={8}
            style={[styles.importBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <UserPlus size={18} color={colors.primary} strokeWidth={1.7} />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={tr('clients.searchPlaceholder')} />
      </View>

      {/* Filter chips */}
      <View style={styles.chipsRow}>
        {(Object.keys(FILTER_KEYS) as Filter[]).map((key) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              hitSlop={{ top: 6, bottom: 6 }}
              style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? 'transparent' : colors.border }]}
            >
              <Text style={[typo.caption, { color: active ? onPrimary : colors.textSecondary, fontFamily: 'Manrope_600SemiBold' }]}>
                {tr(FILTER_KEYS[key])}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: fabOffset + 72, paddingHorizontal: 8 }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          sleeping.length > 0 ? (
            <Animated.View entering={FadeInDown} style={{ paddingHorizontal: 8, marginBottom: sp.md }}>
              <GlassCard style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Moon size={16} color={colors.warning} />
                  <Text style={[typo.bodyBold, { color: colors.text }]}>{tr('clients.sleepingTitle')}</Text>
                  <Badge label={`${sleeping.length}`} color={colors.warning} />
                </View>
                {sleeping.slice(0, 3).map((s) => (
                  <TouchableOpacity key={s.client.id} onPress={() => router.push(`/client/${s.client.id}`)} activeOpacity={0.7} style={[styles.sleepingRow, { borderColor: colors.border }]}>
                    <Text style={[typo.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>{s.client.name}</Text>
                    <Text style={[typo.caption, { color: colors.warning }]}>{tr('clients.daysShort', { count: s.daysSince })}</Text>
                  </TouchableOpacity>
                ))}
                {sleeping.length > 3 && (
                  <Text style={[typo.caption, { color: colors.textTertiary, marginTop: 8, textAlign: 'center' }]}>
                    {tr('clients.andMore', { count: sleeping.length - 3 })}
                  </Text>
                )}
              </GlassCard>
            </Animated.View>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <Text style={{ fontFamily: SERIF, fontSize: 15, color: colors.textTertiary, paddingHorizontal: 16, marginTop: 14, marginBottom: 2 }}>
            {section.title}
          </Text>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<Users size={48} color={colors.textTertiary} />}
            title={pack.emptyStates.clients?.title ?? tr('clients.emptyTitle')}
            subtitle={search ? tr('clients.noneFound') : pack.emptyStates.clients?.subtitle ?? tr('clients.addFirst')}
          />
        }
        renderItem={({ item }) => (
          <SwipeableClientRow client={item} lastVisitDate={lastVisitMap[item.id]} onPress={() => router.push(`/client/${item.id}`)} />
        )}
      />

      <TouchableOpacity
        onPress={() => router.push('/client/new')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={tr('clients.newClient')}
        style={[styles.fabWrap, { bottom: fabOffset }]}
      >
        <View style={[styles.fab, { backgroundColor: colors.primary, borderRadius: 20 }]}>
          <Plus size={28} color={onPrimary} />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  importBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  sleepingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5 },
  fabWrap: {
    position: 'absolute',
    right: 20,
    shadowColor: '#6B4E71',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  fab: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});

// --- Tab-level Error Boundary wrapper ---
import { TabErrorBoundary } from '@/src/components/TabErrorBoundary';
export default function ClientsScreenWithBoundary() {
  return (
    <TabErrorBoundary tabName="clients">
      <ClientsScreen />
    </TabErrorBoundary>
  );
}
