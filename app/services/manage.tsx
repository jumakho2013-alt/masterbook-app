import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, Button, Input, CustomAlert, useToast, SearchBar } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { formatCurrency } from '@/src/utils/currency';

export default function ManageServicesScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const services = useServiceStore((s) => s.services);
  const addService = useServiceStore((s) => s.addService);
  const deleteService = useServiceStore((s) => s.deleteService);

  const { alertConfig, confirm } = useAlert();
  const toast = useToast();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, query]);

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error('Введите название услуги');
      return;
    }
    if (!price || !duration) return;
    addService({
      name: name.trim(),
      price: Number(price),
      duration: Number(duration),
      color: '#007AFF',
    });
    setName('');
    setPrice('');
    setDuration('');
    setAdding(false);
    toast.success('Услуга добавлена');
  };

  const handleDelete = (id: string, serviceName: string) => {
    confirm('Удалить?', `Удалить услугу "${serviceName}"?`, () => { deleteService(id); toast.success('Услуга удалена'); }, 'Удалить', true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text style={[typo.h3, { color: colors.text }]}>Мои услуги</Text>
        <IconButton
          icon={<Plus size={22} color={colors.primary} />}
          onPress={() => setAdding(true)}
          variant="ghost"
        />
      </View>

      {services.length > 6 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Поиск услуги" />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          query.trim() ? (
            <Text style={[typo.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 32 }]}>
              Ничего не найдено
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.serviceCard}>
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[typo.bodyBold, { color: colors.text }]}>{item.name}</Text>
              <Text style={[typo.caption, { color: colors.textSecondary }]}>
                {formatCurrency(item.price)} / {item.duration} мин
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} hitSlop={12}>
              <Trash2 size={18} color={colors.danger} />
            </TouchableOpacity>
          </GlassCard>
        )}
      />

      <CustomAlert {...alertConfig} />

      {adding && (
        <View style={[styles.addForm, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Input placeholder="Название" value={name} onChangeText={setName} />
          <View style={styles.addRow}>
            <Input placeholder="Цена" value={price} onChangeText={setPrice} keyboardType="numeric" containerStyle={{ flex: 1 }} />
            <Input placeholder="Мин" value={duration} onChangeText={setDuration} keyboardType="numeric" containerStyle={{ width: 80 }} />
          </View>
          <View style={styles.addRow}>
            <Button title="Добавить" onPress={handleAdd} style={{ flex: 1 }} />
            <Button title="Отмена" onPress={() => setAdding(false)} variant="secondary" style={{ flex: 1 }} />
          </View>
        </View>
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
    gap: 12,
    borderTopWidth: 0.5,
  },
  addRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
