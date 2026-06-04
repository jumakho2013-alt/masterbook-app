import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, Button, Input, CustomAlert, useToast, SearchBar } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { formatCurrency, SUPPORTED_CURRENCIES } from '@/src/utils/currency';

// Пресеты длительности — мастеру не нужно думать «120 минут», он тапает «2 ч».
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];

export default function ManageServicesScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const tr = useT();
  const services = useServiceStore((s) => s.services);
  const addService = useServiceStore((s) => s.addService);
  const deleteService = useServiceStore((s) => s.deleteService);
  const currency = useSettingsStore((s) => s.currency);
  const symbol = SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.symbol ?? '';

  const { alertConfig, confirm } = useAlert();
  const toast = useToast();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState(60);
  const [query, setQuery] = useState('');

  // «90 мин» → «1 ч 30 м», «120» → «2 ч», «45» → «45 мин».
  const fmtDuration = (m: number): string => {
    if (m < 60) return `${m} ${tr('misc.svcUnit')}`;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return mm === 0 ? tr('misc.svcDurHour', { h }) : tr('misc.svcDurHourMin', { h, m: mm });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, query]);

  const resetForm = () => {
    setName('');
    setPrice('');
    setDuration(60);
    setAdding(false);
  };

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error(tr('misc.svcNameRequired'));
      return;
    }
    const priceNum = Number(price.replace(',', '.').replace(/\s/g, ''));
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error(tr('misc.svcPriceRequired'));
      return;
    }
    addService({ name: name.trim(), price: priceNum, duration, color: colors.primary });
    resetForm();
    toast.success(tr('misc.svcAdded'));
  };

  const handleDelete = (id: string, serviceName: string) => {
    confirm(
      tr('misc.svcDeleteTitle'),
      tr('misc.svcDeleteBody', { name: serviceName }),
      () => { deleteService(id); toast.success(tr('misc.svcDeleted')); },
      tr('common.delete'),
      true,
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.topBar}>
          <IconButton icon={<ArrowLeft size={22} color={colors.text} />} onPress={() => router.back()} variant="ghost" />
          <Text style={[typo.h3, { color: colors.text }]}>{tr('misc.svcTitle')}</Text>
          <IconButton
            icon={<Plus size={22} color={colors.primary} />}
            onPress={() => setAdding(true)}
            variant="ghost"
          />
        </View>

        {services.length > 6 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <SearchBar value={query} onChangeText={setQuery} placeholder={tr('misc.svcSearchPlaceholder')} />
          </View>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={[typo.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 40 }]}>
              {query.trim() ? tr('misc.svcNotFound') : tr('misc.svcEmpty')}
            </Text>
          }
          renderItem={({ item }) => (
            <GlassCard style={styles.serviceCard}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[typo.bodyBold, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[typo.caption, { color: colors.textSecondary }]}>
                  {formatCurrency(item.price)} · {fmtDuration(item.duration)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} hitSlop={12}>
                <Trash2 size={18} color={colors.danger} />
              </TouchableOpacity>
            </GlassCard>
          )}
        />

        {adding && (
          <View style={[styles.addForm, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <Input
              label={tr('misc.svcName')}
              placeholder={tr('misc.svcNamePlaceholder')}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <Input
              label={`${tr('misc.svcPrice')}${symbol ? `, ${symbol}` : ''}`}
              placeholder="0"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />

            <Text style={[typo.small, { color: colors.textSecondary, marginTop: 4, marginBottom: 6 }]}>
              {tr('misc.svcDuration')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {DURATION_OPTIONS.map((m) => {
                const active = duration === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setDuration(m)}
                    style={[styles.durChip, {
                      backgroundColor: active ? colors.primary : colors.surfaceElevated,
                      borderRadius: br.sm,
                    }]}
                  >
                    <Text style={[typo.caption, { color: active ? colors.white : colors.text, fontFamily: active ? typo.bodyBold.fontFamily : typo.caption.fontFamily }]}>
                      {fmtDuration(m)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.addRow}>
              <Button title={tr('misc.svcAdd')} onPress={handleAdd} style={{ flex: 1 }} />
              <Button title={tr('common.cancel')} onPress={resetForm} variant="secondary" style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <CustomAlert {...alertConfig} />
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
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  addForm: {
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  durChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  addRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
});
