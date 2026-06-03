import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, Users, Moon, ArrowUpDown } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { SearchBar, EmptyState, Divider, GlassCard, Badge, LiquidGlass } from '@/src/components/ui';
import { ClientRow } from '@/src/components/ClientRow';
import { useClientStore } from '@/src/stores/useClientStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useTabBarOffset } from '@/src/hooks/useTabBarOffset';
import { findSleepingClients } from '@/src/lib/sleepingClients';
import { toDateKey } from '@/src/utils/date';
import { useProfessionPack } from '@/src/hooks/useProfessionPack';

const SLEEPING_DAYS = 45;

type SortBy = 'name' | 'recent' | 'lastVisit' | 'debt';

const SORT_LABELS: Record<SortBy, string> = {
  name: 'По имени',
  recent: 'Новые',
  lastVisit: 'Визит',
  debt: 'Долг',
};

export default function ClientsScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const fabOffset = useTabBarOffset(16);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [refreshing, setRefreshing] = useState(false);
  const allClients = useClientStore((s) => s.clients);
  const allAppointments = useAppointmentStore((s) => s.appointments);
  const services = useServiceStore((s) => s.services);
  const { t, pack } = useProfessionPack();

  // Last visit per client
  const lastVisitMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of allAppointments) {
      if (a.status === 'completed') {
        if (!map[a.clientId] || a.date > map[a.clientId]) {
          map[a.clientId] = a.date;
        }
      }
    }
    return map;
  }, [allAppointments]);

  const clients = useMemo(() => {
    // Filter — расширенный поиск: имя, телефон, заметки, предпочтения,
    // адрес. Без fuzzy matching пока что: simple includes() работает быстро
    // на N<1000 и достаточно для основного UX (пользователь обычно ищет
    // по началу имени или фрагменту телефона).
    const q = search.toLowerCase().trim();
    let list = q
      ? allClients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.notes.toLowerCase().includes(q) ||
            (c.preferences?.toLowerCase().includes(q) ?? false) ||
            (c.address?.toLowerCase().includes(q) ?? false),
        )
      : [...allClients];

    // Sort
    switch (sortBy) {
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        break;
      case 'recent':
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case 'lastVisit':
        list.sort((a, b) => {
          const la = lastVisitMap[a.id] ?? '';
          const lb = lastVisitMap[b.id] ?? '';
          return lb.localeCompare(la);
        });
        break;
      case 'debt':
        list.sort((a, b) => (b.debt ?? 0) - (a.debt ?? 0));
        break;
    }

    return list;
  }, [allClients, search, sortBy, lastVisitMap]);

  // Sleeping clients — используем shared логику из src/lib/sleepingClients
  // чтобы behavior был консистентен с виджетом на Today screen (исключение
  // problematic-тегов, upcoming appointments).
  const sleeping = useMemo(() => {
    if (search) return [];
    return findSleepingClients({
      clients: allClients,
      appointments: allAppointments,
      todayKey: toDateKey(new Date()),
      thresholdDays: SLEEPING_DAYS,
      serviceNameById: (sid) => services.find((s) => s.id === sid)?.name,
    });
  }, [allClients, allAppointments, services, search]);

  // Для legacy markup ниже — массив сами клиенты.
  const sleepingClients = useMemo(() => sleeping.map((s) => s.client), [sleeping]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typo.h2, { color: colors.text, textTransform: 'capitalize' }]}>
          {t('client.plural', 'Клиенты')}
        </Text>
        <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {allClients.length} {t('client.plural', 'клиентов')}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Имя или телефон..." />
      </View>

      {/* Sort chips */}
      <View style={styles.sortContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortScroll}
        >
          <View style={[styles.sortIcon, { backgroundColor: colors.surfaceElevated, borderRadius: br.sm }]}>
            <ArrowUpDown size={14} color={colors.textSecondary} />
          </View>
        {(Object.keys(SORT_LABELS) as SortBy[]).map((key) => {
          const active = sortBy === key;
          return (
            <Pressable
              key={key}
              onPress={() => setSortBy(key)}
              accessibilityRole="button"
              accessibilityLabel={`Сортировка: ${SORT_LABELS[key]}`}
              accessibilityState={{ selected: active }}
              // Chip визуально тонкий (32pt), но hitSlop расширяет touch-target
              // до 44pt по вертикали — iOS Human Interface Guidelines minimum.
              hitSlop={{ top: 6, bottom: 6, left: 0, right: 0 }}
              style={[
                styles.sortChip,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceElevated,
                  borderRadius: br.sm,
                },
              ]}
            >
              <Text
                style={[
                  typo.caption,
                  { color: active ? colors.white : colors.textSecondary },
                ]}
              >
                {SORT_LABELS[key]}
              </Text>
            </Pressable>
          );
        })}
        </ScrollView>
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: fabOffset + 72 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          sleepingClients.length > 0 ? (
            <Animated.View entering={FadeInDown} style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
              <GlassCard style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Moon size={16} color={colors.warning} />
                  <Text style={[typo.bodyBold, { color: colors.text }]}>Давно не были</Text>
                  <Badge label={`${sleepingClients.length}`} color={colors.warning} />
                </View>
                {sleeping.slice(0, 3).map((s) => (
                  <TouchableOpacity
                    key={s.client.id}
                    onPress={() => router.push(`/client/${s.client.id}`)}
                    activeOpacity={0.7}
                    style={[styles.sleepingRow, { borderColor: colors.border }]}
                  >
                    <Text style={[typo.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                      {s.client.name}
                    </Text>
                    <Text style={[typo.caption, { color: colors.warning }]}>
                      {s.daysSince} дн.
                    </Text>
                  </TouchableOpacity>
                ))}
                {sleepingClients.length > 3 && (
                  <Text style={[typo.caption, { color: colors.textTertiary, marginTop: 8, textAlign: 'center' }]}>
                    и ещё {sleepingClients.length - 3}...
                  </Text>
                )}
              </GlassCard>
            </Animated.View>
          ) : null
        }
        ItemSeparatorComponent={() => <Divider style={{ marginVertical: 0, marginLeft: 76 }} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Users size={48} color={colors.textTertiary} />}
            title={pack.emptyStates.clients?.title ?? 'Нет клиентов'}
            subtitle={
              search
                ? 'Никого не нашли'
                : pack.emptyStates.clients?.subtitle ?? 'Добавьте первого клиента'
            }
          />
        }
        renderItem={({ item }) => (
          <ClientRow
            client={item}
            lastVisitDate={lastVisitMap[item.id]}
            onPress={() => router.push(`/client/${item.id}`)}
          />
        )}
      />

      <TouchableOpacity
        onPress={() => router.push('/client/new')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Новый клиент"
        style={[styles.fabWrap, { bottom: fabOffset }]}
      >
        <LiquidGlass
          variant="floating"
          tint={colors.primary}
          tintStrength={0.72}
          radius={20}
          style={styles.fab}
        >
          <Plus size={28} color={colors.white} />
        </LiquidGlass>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  sortContainer: {
    height: 44,
    marginBottom: 12,
  },
  sortScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  sortIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortChip: {
    height: 32,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  fabWrap: {
    position: 'absolute',
    right: 20,
    shadowColor: '#7C5DFA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  fab: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
