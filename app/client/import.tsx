import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Users } from 'lucide-react-native';
import * as Haptics from '@/src/lib/haptics';
import { useTheme } from '@/src/theme';
import { SearchBar, IconButton, Button, EmptyState, useToast } from '@/src/components/ui';
import { useT } from '@/src/hooks/useT';
import { useClientStore } from '@/src/stores/useClientStore';
import {
  loadDeviceContacts,
  requestContactsPermission,
  phoneDigits,
  type DeviceContact,
} from '@/src/lib/contactsImport';

/**
 * Импорт клиентов из телефонной книги (фидбэк: «не вбивать каждого руками»).
 * Мультивыбор → addClient для каждого. Уже существующие (по телефону) помечены
 * «Уже в базе» и не выбираются. Только чтение, только выбранные.
 */
export default function ImportContactsScreen() {
  const router = useRouter();
  const tr = useT();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const toast = useToast();

  const clients = useClientStore((s) => s.clients);
  const addClient = useClientStore((s) => s.addClient);

  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const granted = await requestContactsPermission();
      if (!alive) return;
      if (!granted) {
        setDenied(true);
        setLoading(false);
        return;
      }
      const list = await loadDeviceContacts();
      if (!alive) return;
      setContacts(list);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Телефоны уже существующих клиентов — чтобы не плодить дубли.
  const existingPhones = useMemo(
    () => new Set(clients.map((c) => phoneDigits(c.phone)).filter(Boolean)),
    [clients],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
    );
  }, [contacts, search]);

  const toggle = (id: string) => {
    Haptics.selectionAsync();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onAdd = () => {
    const toAdd = contacts.filter(
      (c) => selected.has(c.id) && !existingPhones.has(phoneDigits(c.phone)),
    );
    if (toAdd.length === 0) {
      toast.info(tr('clientImport.nothingSelected'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    for (const c of toAdd) {
      addClient({ name: c.name, phone: c.phone, notes: '', tags: [] });
    }
    toast.success(tr('clientImport.added', { n: toAdd.length }));
    router.back();
  };

  const selectedCount = useMemo(
    () =>
      contacts.filter(
        (c) => selected.has(c.id) && !existingPhones.has(phoneDigits(c.phone)),
      ).length,
    [contacts, selected, existingPhones],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel={tr('common.back')}
        />
        <Text style={[typo.h3, { color: colors.text }]}>{tr('clientImport.title')}</Text>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : denied ? (
        <View style={styles.center}>
          <EmptyState
            icon={<Users size={48} color={colors.textTertiary} />}
            title={tr('clientImport.permTitle')}
            subtitle={tr('clientImport.permBody')}
          />
          <Button
            title={tr('clientImport.openSettings')}
            onPress={() => Linking.openSettings()}
            variant="secondary"
            style={{ marginTop: sp.md }}
          />
        </View>
      ) : (
        <>
          <Text style={[typo.caption, { color: colors.textSecondary, paddingHorizontal: 24 }]}>
            {tr('clientImport.subtitle')}
          </Text>
          <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 4 }}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={tr('clientImport.searchPlaceholder')}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <EmptyState
                icon={<Users size={48} color={colors.textTertiary} />}
                title={tr('clientImport.empty')}
              />
            }
            renderItem={({ item }) => {
              const already = existingPhones.has(phoneDigits(item.phone));
              const isSelected = selected.has(item.id);
              return (
                <Pressable
                  onPress={() => !already && toggle(item.id)}
                  disabled={already}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: already }}
                  style={[styles.row, { opacity: already ? 0.5 : 1 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typo.bodyBold, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[typo.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.phone}
                    </Text>
                  </View>
                  {already ? (
                    <Text style={[typo.small, { color: colors.textTertiary }]}>
                      {tr('clientImport.alreadyAdded')}
                    </Text>
                  ) : (
                    <View
                      style={[
                        styles.check,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          borderRadius: br.sm,
                        },
                      ]}
                    >
                      {isSelected ? <Check size={16} color={colors.white} /> : null}
                    </View>
                  )}
                </Pressable>
              );
            }}
          />

          <View style={[styles.bottom, { paddingBottom: sp.lg }]}>
            <Button
              title={tr('clientImport.add', { n: selectedCount })}
              onPress={onAdd}
              size="lg"
              disabled={selectedCount === 0}
              style={{ width: '100%' }}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(127,127,127,0.15)',
  },
  check: {
    width: 26,
    height: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
});
