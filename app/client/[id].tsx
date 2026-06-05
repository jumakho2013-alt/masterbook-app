import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Linking, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft, Phone, MessageCircle, Pencil, Check, X,
  ChevronDown, ChevronUp, Heart, Send, MapPin, Camera, Calendar, Star,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { persistImageToAppDir } from '@/src/lib/photoStorage';
import { uploadPhoto } from '@/src/lib/photoCloud';
import { useTheme } from '@/src/theme';
import { Avatar, Badge, GlassCard, Divider, IconButton, Button, CustomAlert, useToast } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useClientStore } from '@/src/stores/useClientStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { formatDate, formatTimeRange, daysSince } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/currency';
import { openAddressInMaps } from '@/src/lib/openMaps';
import { useT } from '@/src/hooks/useT';
import type { ClientTag } from '@/src/types';

const tagLabelKeys: Record<string, string> = {
  vip: 'clientDetail.tagVip',
  problematic: 'clientDetail.tagProblematic',
  new: 'clientDetail.tagNew',
};

const ALL_TAGS: ClientTag[] = ['vip', 'problematic', 'new'];

export default function ClientDetailScreen() {
  const router = useRouter();
  const tr = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography: typo, spacing: sp, borderRadius: br, isDark } = useTheme();

  // Цвета тегов клиента — из темы (единая гамма): VIP=золото, проблемный=
  // красный, новый=изумруд. Раньше были ad-hoc хексы мимо палитры.
  const tagColors: Record<string, string> = {
    vip: colors.warning,
    problematic: colors.danger,
    new: colors.success,
  };

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
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const totalSpent = appointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + a.price, 0);
  const avgCheck = completedCount ? Math.round(totalSpent / completedCount) : 0;
  // На тёмной теме primary — светлая лаванда, поэтому контент на нём — тёмный.
  const onPrimary = isDark ? '#2A2030' : colors.white;

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
    if (!editName.trim()) { showError(tr('common.error'), tr('clientDetail.nameRequired')); return; }
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
    toast.success(tr('clientDetail.phoneCopied'));
  };

  const pickPhoto = async () => {
    // Весь флоу в одном try (вкл. permission) — pickPhoto зовётся из onPress,
    // без обёртки throw из permission API стал бы unhandled rejection.
    try {
      const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!req.granted) {
          showError(tr('clientDetail.photoAccessTitle'), tr('clientDetail.photoAccessBody'));
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        // Копируем в постоянную папку — иначе после чистки кэша фото пропадёт.
        const persisted = persistImageToAppDir(result.assets[0].uri);
        updateClient(client.id, { photoUri: persisted }); // мгновенно (локально)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success(tr('clientDetail.photoUpdated'));
        // Заливаем в облако и меняем на storage-path. Best-effort.
        const path = await uploadPhoto(persisted, `clients/${client.id}`);
        if (path) updateClient(client.id, { photoUri: path });
      }
    } catch (err) {
      showError(tr('clientDetail.galleryErrorTitle'), err instanceof Error ? err.message : String(err));
    }
  };

  const openWhatsApp = async () => {
    const phone = client.phone.replace(/\D/g, '');
    try {
      await Linking.openURL(`whatsapp://send?phone=${phone}`);
    } catch {
      toast.error(tr('clientDetail.whatsappNotInstalled'));
    }
  };

  const openTelegram = async () => {
    const phone = client.phone.replace(/\D/g, '');
    try {
      await Linking.openURL(`tg://resolve?phone=${phone}`);
    } catch {
      showError(tr('common.error'), tr('clientDetail.telegramNotInstalled'));
    }
  };

  const callClient = async () => {
    try { await Linking.openURL(`tel:${client.phone}`); }
    catch { showError(tr('common.error'), tr('clientDetail.callError')); }
  };

  // 3 быстрых действия (по макету Atelier): Позвонить / WhatsApp / Telegram —
  // все в рамке, плам-иконка. Бронирование вынесено в нижний CTA «Записать снова».
  const quickActions = [
    { key: 'call', icon: <Phone size={19} color={colors.primary} strokeWidth={1.6} />, label: tr('clientDetail.actionCall'), onPress: callClient },
    { key: 'wa', icon: <MessageCircle size={19} color={colors.primary} strokeWidth={1.6} />, label: 'WhatsApp', onPress: openWhatsApp },
    { key: 'tg', icon: <Send size={19} color={colors.primary} strokeWidth={1.6} />, label: 'Telegram', onPress: openTelegram },
  ];

  const stats: [string, string][] = [
    [String(appointments.length), tr('clientDetail.statVisits')],
    [formatCurrency(totalSpent), tr('clientDetail.statTotal')],
    [formatCurrency(avgCheck), tr('clientDetail.statAvg')],
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
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
        data={editing ? [] : appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: editing ? 40 : 130 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Identity */}
            <Animated.View entering={FadeInDown} style={styles.identity}>
              <Pressable onPress={pickPhoto}>
                <Avatar name={client.name} size={78} photoUri={client.photoUri} />
                <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                  <Camera size={12} color={onPrimary} />
                </View>
              </Pressable>

              {editing ? (
                <View style={{ width: '100%', paddingHorizontal: 8, marginTop: sp.md, gap: 10 }}>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={[styles.editInput, typo.h3, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md }]}
                    placeholder={tr('clientDetail.placeholderName')}
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    value={editPhone}
                    onChangeText={setEditPhone}
                    style={[styles.editInput, typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md }]}
                    placeholder={tr('clientDetail.placeholderPhone')}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    value={editAddress}
                    onChangeText={setEditAddress}
                    style={[styles.editInput, typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md }]}
                    placeholder={tr('clientDetail.placeholderAddress')}
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    value={editNotes}
                    onChangeText={setEditNotes}
                    style={[styles.editInput, typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md, minHeight: 60 }]}
                    placeholder={tr('clientDetail.placeholderNotes')}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                  />
                  <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                    {ALL_TAGS.map((tag) => {
                      const tagColor = tagColors[tag];
                      const active = editTags.includes(tag);
                      return (
                        <Pressable key={tag} onPress={() => toggleTag(tag)}
                          style={[styles.tagChip, { backgroundColor: active ? tagColor + '20' : colors.surfaceElevated, borderColor: active ? tagColor : colors.border, borderRadius: br.sm }]}>
                          <Text style={[typo.caption, { color: active ? tagColor : colors.textSecondary }]}>{tr(tagLabelKeys[tag])}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <>
                  <Text style={[typo.h1, { color: colors.text, marginTop: 14, textAlign: 'center' }]}>{client.name}</Text>
                  <View style={styles.identityTags}>
                    {client.tags.includes('vip') && (
                      <View style={[styles.vipPill, { backgroundColor: colors.goldSoft }]}>
                        <Star size={12} color={colors.gold} fill={colors.gold} />
                        <Text style={[typo.label, { color: colors.gold }]}>{tr(tagLabelKeys.vip)}</Text>
                      </View>
                    )}
                    {client.tags.filter((t) => t !== 'vip').map((tag) => {
                      const tagColor = tagColors[tag];
                      const labelKey = tagLabelKeys[tag];
                      return tagColor ? <Badge key={tag} label={tr(labelKey)} color={tagColor} /> : null;
                    })}
                  </View>
                  <Pressable onPress={copyPhone} hitSlop={12}>
                    <Text style={[typo.body, { color: colors.textSecondary, marginTop: 8 }]}>{client.phone}</Text>
                  </Pressable>
                  {lastVisit && (
                    <Text style={[typo.caption, { color: colors.textTertiary, marginTop: 4 }]}>
                      {tr('clientDetail.lastVisit', { ago: daysSince(lastVisit.date) })}
                    </Text>
                  )}
                </>
              )}
            </Animated.View>

            {!editing && (
              <>
                {/* 3 quick actions */}
                <View style={styles.actionsRow}>
                  {quickActions.map((a) => (
                    <Pressable key={a.key} onPress={a.onPress}
                      style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br.md }]}>
                      {a.icon}
                      <Text style={[typo.caption, { color: colors.text }]}>{a.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Stats — 3 cols, serif numbers */}
                <View style={[styles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                  {stats.map(([v, lb], i) => (
                    <React.Fragment key={lb}>
                      {i > 0 && <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 2 }} />}
                      <View style={styles.statCol}>
                        <Text style={[typo.numberLg, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{v}</Text>
                        <Text style={[typo.label, { color: colors.textTertiary, marginTop: 4 }]}>{lb}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>

                {(client.debt ?? 0) > 0 && (
                  <View style={{ paddingHorizontal: 24, marginTop: sp.md }}>
                    <View style={[styles.debtPill, { backgroundColor: colors.dangerSoft }]}>
                      <Text style={[typo.caption, { color: colors.danger }]}>{tr('clientDetail.statDebt')}</Text>
                      <Text style={[typo.numberMd, { color: colors.danger }]}>−{formatCurrency(client.debt!)}</Text>
                    </View>
                  </View>
                )}

                {/* Address — тап открывает карты с маршрутом */}
                {client.address ? (
                  <Pressable
                    onPress={async () => {
                      const ok = await openAddressInMaps(client.address!);
                      if (!ok) showError(tr('common.error'), tr('clientDetail.mapsError'));
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={tr('clientDetail.addressRouteLabel', { address: client.address })}
                    accessibilityHint={tr('clientDetail.addressRouteHint')}
                    style={{ paddingHorizontal: 24, marginTop: sp.md }}
                  >
                    <GlassCard>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.tile, { backgroundColor: colors.primarySoft }]}>
                          <MapPin size={18} color={colors.primary} strokeWidth={1.6} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[typo.label, { color: colors.textTertiary }]}>{tr('clientDetail.addressCardLabel')}</Text>
                          <Text style={[typo.body, { color: colors.text, marginTop: 2 }]}>{client.address}</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </Pressable>
                ) : null}

                {/* Notes */}
                {client.notes ? (
                  <View style={{ paddingHorizontal: 24, marginTop: sp.md }}>
                    <GlassCard>
                      <Text style={[typo.label, { color: colors.textTertiary }]}>{tr('clientDetail.notesLabel')}</Text>
                      <Text style={[typo.body, { color: colors.text, marginTop: 6 }]}>{client.notes}</Text>
                    </GlassCard>
                  </View>
                ) : null}

                {/* Preferences */}
                <Pressable onPress={() => { setPrefsExpanded(!prefsExpanded); setPrefsText(client.preferences ?? ''); }} style={{ paddingHorizontal: 24, marginTop: sp.md }}>
                  <GlassCard>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Heart size={16} color={colors.primary} strokeWidth={1.6} />
                        <Text style={[typo.bodyBold, { color: colors.text }]}>{tr('clientDetail.preferences')}</Text>
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
                              placeholder={tr('clientDetail.preferencesPlaceholder')}
                              placeholderTextColor={colors.textTertiary}
                              style={[typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.sm, padding: 12, minHeight: 70, textAlignVertical: 'top' }]}
                              multiline
                              autoFocus
                            />
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                              <Button title={tr('common.save')} onPress={savePreferences} size="sm" style={{ flex: 1 }} />
                              <Button title={tr('common.cancel')} onPress={() => setEditingPrefs(false)} variant="ghost" size="sm" style={{ flex: 1 }} />
                            </View>
                          </>
                        ) : (
                          <Pressable onPress={() => setEditingPrefs(true)}>
                            <Text style={[typo.body, { color: client.preferences ? colors.text : colors.textTertiary }]}>
                              {client.preferences || tr('clientDetail.preferencesEmpty')}
                            </Text>
                          </Pressable>
                        )}
                      </Animated.View>
                    )}
                  </GlassCard>
                </Pressable>

                {/* History header */}
                <View style={styles.historyHeader}>
                  <Text style={[typo.h3, { color: colors.text }]}>{tr('clientDetail.historyTitle', { count: appointments.length })}</Text>
                </View>
              </>
            )}
          </>
        }
        ItemSeparatorComponent={() => <Divider style={{ marginLeft: 24, marginRight: 24, marginVertical: 0 }} />}
        renderItem={({ item }) => {
          const service = getService(item.serviceId);
          const tileColor = item.status === 'completed' ? colors.successSoft
            : item.status === 'cancelled' || item.status === 'no-show' ? colors.dangerSoft
            : colors.primarySoft;
          return (
            <Pressable style={styles.historyRow} onPress={() => router.push(`/appointment/${item.id}`)}>
              <View style={[styles.historyTile, { backgroundColor: tileColor, borderColor: colors.border }]} />
              <View style={{ flex: 1 }}>
                <Text style={[typo.bodyBold, { color: colors.text }]} numberOfLines={1}>{service?.name ?? tr('clientDetail.serviceFallback')}</Text>
                <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {formatDate(item.date)} · {formatTimeRange(item.startTime, item.endTime)}
                </Text>
              </View>
              <Text style={[typo.numberMd, { color: colors.text }]}>{formatCurrency(item.price)}</Text>
            </Pressable>
          );
        }}
      />

      {/* Bottom CTA — «Записать снова» (по макету Atelier) */}
      {!editing && (
        <View style={[styles.ctaBar, { backgroundColor: colors.surfaceGlass, borderTopColor: colors.border }]}>
          <Pressable
            onPress={() => router.push({ pathname: '/appointment/new', params: { clientId: client.id } })}
            accessibilityRole="button"
            style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          >
            <Calendar size={19} color={onPrimary} strokeWidth={1.7} />
            <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 15.5, color: onPrimary }}>{tr('clientDetail.ctaRebook')}</Text>
          </Pressable>
        </View>
      )}

      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4 },
  identity: { alignItems: 'center', paddingTop: 8, paddingBottom: 20, paddingHorizontal: 24 },
  identityTags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  vipPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999 },
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 24, marginBottom: 16 },
  actionCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderWidth: StyleSheet.hairlineWidth },
  statsRow: { flexDirection: 'row', marginHorizontal: 24, paddingVertical: 18, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  statCol: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  debtPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
  editInput: { paddingHorizontal: 16, paddingVertical: 12, textAlign: 'center' },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  tile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyHeader: { paddingHorizontal: 24, marginTop: 22, marginBottom: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 24 },
  historyTile: { width: 46, height: 46, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  cameraBadge: { position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  ctaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 30, borderTopWidth: StyleSheet.hairlineWidth },
  ctaBtn: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
});
