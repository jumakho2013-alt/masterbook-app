import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Linking, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft, Phone, MessageCircle, Plus, Pencil, Check, X,
  ChevronDown, ChevronUp, Heart, Send, MapPin, Camera,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/src/theme';
import { Avatar, Badge, GlassCard, Divider, IconButton, Button, CustomAlert, useToast } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useClientStore } from '@/src/stores/useClientStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { formatDate, formatTimeRange, daysSince } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/currency';
import type { ClientTag } from '@/src/types';

const tagLabels: Record<string, { label: string; color: string }> = {
  vip: { label: 'VIP', color: '#FFA502' },
  problematic: { label: 'Проблемный', color: '#FF4757' },
  new: { label: 'Новый', color: '#2ED573' },
};

const ALL_TAGS: ClientTag[] = ['vip', 'problematic', 'new'];

export default function ClientDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();

  const toast = useToast();
  const allClients = useClientStore((s) => s.clients);
  const updateClient = useClientStore((s) => s.updateClient);
  const allAppointments = useAppointmentStore((s) => s.appointments);
  const services = useServiceStore((s) => s.services);

  const { alertConfig, error: showError } = useAlert();

  const client = allClients.find((c) => c.id === id);
  const appointments = useMemo(
    () => allAppointments.filter((a) => a.clientId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [allAppointments, id],
  );
  const getService = (sid: string) => services.find((s) => s.id === sid);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTags, setEditTags] = useState<ClientTag[]>([]);

  // Preferences
  const [prefsExpanded, setPrefsExpanded] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [prefsText, setPrefsText] = useState('');

  if (!client) return null;

  const lastVisit = appointments.find((a) => a.status === 'completed');
  const totalSpent = appointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + a.price, 0);

  // === HANDLERS ===

  const startEditing = () => {
    setEditName(client.name);
    setEditPhone(client.phone);
    setEditNotes(client.notes);
    setEditAddress(client.address ?? '');
    setEditTags([...client.tags]);
    setEditing(true);
  };

  const saveEdit = () => {
    if (!editName.trim()) { showError('Ошибка', 'Введите имя'); return; }
    updateClient(client.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      notes: editNotes.trim(),
      address: editAddress.trim() || undefined,
      tags: editTags,
    });
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleTag = (tag: ClientTag) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const savePreferences = () => {
    updateClient(client.id, { preferences: prefsText.trim() || undefined });
    setEditingPrefs(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const copyPhone = async () => {
    await Clipboard.setStringAsync(client.phone);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.success('Телефон скопирован');
  };

  const pickPhoto = async () => {
    // Permission check ДО открытия пикера. Иначе на denied launchImageLibrary
    // молча возвращает canceled — пользователь думает «не работает».
    const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!req.granted) {
        showError(
          'Нужен доступ к фото',
          'Включи доступ к галерее в Настройках → MasterBook → Фото.',
        );
        return;
      }
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        updateClient(client.id, { photoUri: result.assets[0].uri });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success('Фото обновлено');
      }
    } catch (err) {
      showError('Не удалось открыть галерею', err instanceof Error ? err.message : String(err));
    }
  };

  const openWhatsApp = async () => {
    const phone = client.phone.replace(/\D/g, '');
    try {
      await Linking.openURL(`whatsapp://send?phone=${phone}`);
    } catch {
      toast.error('WhatsApp не установлен');
    }
  };

  const openTelegram = async () => {
    const phone = client.phone.replace(/\D/g, '');
    try {
      await Linking.openURL(`tg://resolve?phone=${phone}`);
    } catch {
      showError('Ошибка', 'Telegram не установлен');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <IconButton icon={<ArrowLeft size={22} color={colors.text} />} onPress={() => router.back()} variant="ghost" />
        <View style={{ flex: 1 }} />
        {!editing ? (
          <IconButton icon={<Pencil size={18} color={colors.primary} />} onPress={startEditing} variant="ghost" />
        ) : (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <IconButton icon={<Check size={20} color={colors.success} />} onPress={saveEdit} variant="ghost" />
            <IconButton icon={<X size={20} color={colors.danger} />} onPress={() => setEditing(false)} variant="ghost" />
          </View>
        )}
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {/* Profile */}
            <Animated.View entering={FadeInDown} style={styles.profile}>
              <Pressable onPress={pickPhoto}>
                <Avatar name={client.name} size={80} photoUri={client.photoUri} />
                <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                  <Camera size={12} color={colors.white} />
                </View>
              </Pressable>

              {editing ? (
                <View style={{ width: '100%', paddingHorizontal: 24, marginTop: sp.md, gap: 10 }}>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={[styles.editInput, typo.h3, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md }]}
                    placeholder="Имя"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    value={editPhone}
                    onChangeText={setEditPhone}
                    style={[styles.editInput, typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md }]}
                    placeholder="Телефон"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    value={editAddress}
                    onChangeText={setEditAddress}
                    style={[styles.editInput, typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md }]}
                    placeholder="Адрес"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    value={editNotes}
                    onChangeText={setEditNotes}
                    style={[styles.editInput, typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md, minHeight: 60 }]}
                    placeholder="Заметки"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                  />
                  {/* Tag picker */}
                  <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                    {ALL_TAGS.map((tag) => {
                      const t = tagLabels[tag];
                      const active = editTags.includes(tag);
                      return (
                        <Pressable key={tag} onPress={() => toggleTag(tag)}
                          style={[styles.tagChip, { backgroundColor: active ? t.color + '20' : colors.surfaceElevated, borderColor: active ? t.color : colors.border, borderRadius: br.sm }]}>
                          <Text style={[typo.caption, { color: active ? t.color : colors.textSecondary }]}>{t.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <>
                  <Text style={[typo.h2, { color: colors.text, marginTop: sp.md }]}>{client.name}</Text>
                  <Pressable onPress={copyPhone} hitSlop={12}>
                    <Text style={[typo.body, { color: colors.textSecondary, marginTop: 2 }]}>{client.phone}</Text>
                  </Pressable>
                  <View style={styles.tags}>
                    {client.tags.map((tag) => {
                      const t = tagLabels[tag];
                      return t ? <Badge key={tag} label={t.label} color={t.color} /> : null;
                    })}
                  </View>
                  {lastVisit && (
                    <Text style={[typo.caption, { color: colors.textSecondary, marginTop: sp.sm }]}>
                      Последний визит: {daysSince(lastVisit.date)}
                    </Text>
                  )}
                </>
              )}
            </Animated.View>

            {/* Stats */}
            {!editing && (
              <View style={[styles.statsRow, { paddingHorizontal: 16, marginBottom: sp.md }]}>
                <GlassCard style={styles.statCard}>
                  <Text style={[typo.h3, { color: colors.primary }]}>{appointments.length}</Text>
                  <Text style={[typo.small, { color: colors.textSecondary }]}>Визитов</Text>
                </GlassCard>
                <GlassCard style={styles.statCard}>
                  <Text style={[typo.h3, { color: colors.success }]}>{formatCurrency(totalSpent)}</Text>
                  <Text style={[typo.small, { color: colors.textSecondary }]}>Всего</Text>
                </GlassCard>
                {(client.debt ?? 0) > 0 && (
                  <GlassCard style={styles.statCard}>
                    <Text style={[typo.h3, { color: colors.danger }]}>{formatCurrency(client.debt!)}</Text>
                    <Text style={[typo.small, { color: colors.textSecondary }]}>Долг</Text>
                  </GlassCard>
                )}
              </View>
            )}

            {/* Action buttons */}
            {!editing && (
              <View style={[styles.actions, { paddingHorizontal: 16, marginBottom: sp.md }]}>
                <Pressable style={[styles.actionBtn, { backgroundColor: colors.success + '15' }]} onPress={async () => { try { await Linking.openURL(`tel:${client.phone}`); } catch { showError('Ошибка', 'Не удалось позвонить'); } }}>
                  <Phone size={18} color={colors.success} />
                  <Text style={[typo.caption, { color: colors.success }]}>Позвонить</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, { backgroundColor: '#25D366' + '15' }]} onPress={openWhatsApp}>
                  <MessageCircle size={18} color="#25D366" />
                  <Text style={[typo.caption, { color: '#25D366' }]}>WhatsApp</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, { backgroundColor: '#0088cc' + '15' }]} onPress={openTelegram}>
                  <Send size={18} color="#0088cc" />
                  <Text style={[typo.caption, { color: '#0088cc' }]}>Telegram</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]} onPress={() => router.push('/appointment/new')}>
                  <Plus size={18} color={colors.primary} />
                  <Text style={[typo.caption, { color: colors.primary }]}>Записать</Text>
                </Pressable>
              </View>
            )}

            {/* Address */}
            {!editing && client.address ? (
              <Pressable
                onPress={async () => {
                  const query = encodeURIComponent(client.address!);
                  try {
                    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                  } catch {
                    showError('Ошибка', 'Не удалось открыть карты');
                  }
                }}
                style={{ paddingHorizontal: 16, marginBottom: sp.md }}
              >
                <GlassCard>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.addressIcon, { backgroundColor: colors.primarySoft }]}>
                      <MapPin size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[typo.small, { color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }]}>Адрес</Text>
                      <Text style={[typo.body, { color: colors.text, marginTop: 2 }]}>{client.address}</Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            ) : null}

            {/* Notes */}
            {!editing && client.notes ? (
              <View style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
                <GlassCard>
                  <Text style={[typo.small, { color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }]}>Заметки</Text>
                  <Text style={[typo.body, { color: colors.text, marginTop: 6 }]}>{client.notes}</Text>
                </GlassCard>
              </View>
            ) : null}

            {/* Preferences */}
            {!editing && (
              <Pressable onPress={() => { setPrefsExpanded(!prefsExpanded); setPrefsText(client.preferences ?? ''); }} style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
                <GlassCard>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Heart size={16} color={colors.primary} />
                      <Text style={[typo.bodyBold, { color: colors.text }]}>Предпочтения</Text>
                    </View>
                    {prefsExpanded ? <ChevronUp size={18} color={colors.textTertiary} /> : <ChevronDown size={18} color={colors.textTertiary} />}
                  </View>
                  {prefsExpanded && (
                    <Animated.View entering={FadeInDown.duration(200)} style={{ marginTop: 12 }}>
                      {editingPrefs ? (
                        <>
                          <TextInput
                            value={prefsText}
                            onChangeText={setPrefsText}
                            placeholder="Любимый цвет, стиль, аллергии..."
                            placeholderTextColor={colors.textTertiary}
                            style={[typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.sm, padding: 12, minHeight: 70, textAlignVertical: 'top' }]}
                            multiline
                            autoFocus
                          />
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                            <Button title="Сохранить" onPress={savePreferences} size="sm" style={{ flex: 1 }} />
                            <Button title="Отмена" onPress={() => setEditingPrefs(false)} variant="ghost" size="sm" style={{ flex: 1 }} />
                          </View>
                        </>
                      ) : (
                        <Pressable onPress={() => setEditingPrefs(true)}>
                          <Text style={[typo.body, { color: client.preferences ? colors.text : colors.textTertiary }]}>
                            {client.preferences || 'Нажмите чтобы добавить...'}
                          </Text>
                        </Pressable>
                      )}
                    </Animated.View>
                  )}
                </GlassCard>
              </Pressable>
            )}

            {/* History header */}
            <Text style={[typo.bodyBold, { color: colors.text, paddingHorizontal: 24, marginBottom: 12 }]}>
              История визитов ({appointments.length})
            </Text>
          </>
        }
        ItemSeparatorComponent={() => <Divider style={{ marginLeft: 16, marginRight: 16, marginVertical: 0 }} />}
        renderItem={({ item }) => {
          const service = getService(item.serviceId);
          return (
            <Pressable style={styles.historyRow} onPress={() => router.push(`/appointment/${item.id}`)}>
              <View style={[styles.statusDot, {
                backgroundColor: item.status === 'completed' ? colors.success
                  : item.status === 'cancelled' ? colors.danger
                  : item.status === 'no-show' ? colors.warning
                  : colors.primary,
              }]} />
              <View style={{ flex: 1 }}>
                <Text style={[typo.body, { color: colors.text }]}>{service?.name ?? 'Услуга'}</Text>
                <Text style={[typo.caption, { color: colors.textSecondary }]}>
                  {formatDate(item.date)} / {formatTimeRange(item.startTime, item.endTime)}
                </Text>
              </View>
              <Text style={[typo.bodyBold, { color: colors.text }]}>{formatCurrency(item.price)}</Text>
            </Pressable>
          );
        }}
      />
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4 },
  profile: { alignItems: 'center', paddingVertical: 16 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: 14,
  },
  editInput: { paddingHorizontal: 16, paddingVertical: 12, textAlign: 'center' },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  addressIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
