import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Linking, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Phone, MessageCircle, Check, X, MoreHorizontal,
  ChevronDown, ChevronUp, Heart, MapPin, Camera, Calendar, Star,
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

// Декоративные градиенты-плитки истории визитов (точно как в макете Atelier).
const HISTORY_GRADS: [string, string][] = [
  ['#E8D9C4', '#D9C3A8'],
  ['#E5DCEA', '#CBB8D6'],
  ['#D9E2DC', '#BBD0C6'],
];

export default function ClientDetailScreen() {
  const router = useRouter();
  const tr = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography: typo, spacing: sp, borderRadius: br, isDark } = useTheme();

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
  const onPrimary = isDark ? '#2A2030' : colors.white;
  const serif = 'CormorantGaramond_600SemiBold';

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
    setEditTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
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
        mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        const persisted = persistImageToAppDir(result.assets[0].uri);
        updateClient(client.id, { photoUri: persisted });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success(tr('clientDetail.photoUpdated'));
        const path = await uploadPhoto(persisted, `clients/${client.id}`);
        if (path) updateClient(client.id, { photoUri: path });
      }
    } catch (err) {
      showError(tr('clientDetail.galleryErrorTitle'), err instanceof Error ? err.message : String(err));
    }
  };

  const callClient = async () => {
    try { await Linking.openURL(`tel:${client.phone}`); }
    catch { showError(tr('common.error'), tr('clientDetail.callError')); }
  };

  const openWhatsApp = async () => {
    const phone = client.phone.replace(/\D/g, '');
    try { await Linking.openURL(`whatsapp://send?phone=${phone}`); }
    catch { toast.error(tr('clientDetail.whatsappNotInstalled')); }
  };

  const book = () => router.push({ pathname: '/appointment/new', params: { clientId: client.id } });

  // Ряд из 3 действий — точно как в макете: Позвонить / WhatsApp / Записать.
  // Первые две — в рамке (плам-иконка), третья — заливка плам.
  const actions = [
    { key: 'call', Icon: Phone, label: tr('clientDetail.actionCall'), onPress: callClient, filled: false },
    { key: 'wa', Icon: MessageCircle, label: 'WhatsApp', onPress: openWhatsApp, filled: false },
    { key: 'book', Icon: Calendar, label: tr('clientDetail.actionRebookShort'), onPress: book, filled: true },
  ];

  const stats: [string, string][] = [
    [String(appointments.length), tr('clientDetail.statVisits')],
    [formatCurrency(totalSpent), tr('clientDetail.statTotal')],
    [formatCurrency(avgCheck), tr('clientDetail.statAvg')],
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
      <FlatList
        data={editing ? [] : appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: editing ? 40 : 130 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* PAPER HEADER BLOCK */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <View style={styles.headerTop}>
                <Pressable onPress={() => router.back()} hitSlop={10}>
                  <ArrowLeft size={24} color={colors.text} strokeWidth={1.7} />
                </Pressable>
                {!editing ? (
                  <Pressable onPress={startEditing} hitSlop={10}>
                    <MoreHorizontal size={22} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <IconButton icon={<Check size={20} color={colors.success} />} onPress={saveEdit} variant="ghost" />
                    <IconButton icon={<X size={20} color={colors.danger} />} onPress={() => setEditing(false)} variant="ghost" />
                  </View>
                )}
              </View>

              {editing ? (
                <View style={{ width: '100%', marginTop: sp.md, gap: 10 }}>
                  <Pressable onPress={pickPhoto} style={{ alignSelf: 'center' }}>
                    <Avatar name={client.name} size={78} photoUri={client.photoUri} />
                    <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                      <Camera size={12} color={onPrimary} />
                    </View>
                  </Pressable>
                  <TextInput value={editName} onChangeText={setEditName}
                    style={[styles.editInput, typo.h3, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md }]}
                    placeholder={tr('clientDetail.placeholderName')} placeholderTextColor={colors.textTertiary} />
                  <TextInput value={editPhone} onChangeText={setEditPhone}
                    style={[styles.editInput, typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md }]}
                    placeholder={tr('clientDetail.placeholderPhone')} placeholderTextColor={colors.textTertiary} keyboardType="phone-pad" />
                  <TextInput value={editAddress} onChangeText={setEditAddress}
                    style={[styles.editInput, typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md }]}
                    placeholder={tr('clientDetail.placeholderAddress')} placeholderTextColor={colors.textTertiary} />
                  <TextInput value={editNotes} onChangeText={setEditNotes}
                    style={[styles.editInput, typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.md, minHeight: 60 }]}
                    placeholder={tr('clientDetail.placeholderNotes')} placeholderTextColor={colors.textTertiary} multiline />
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
                <Animated.View entering={FadeInDown} style={{ alignItems: 'center', marginTop: 8 }}>
                  <Pressable onPress={pickPhoto}>
                    <Avatar name={client.name} size={78} photoUri={client.photoUri} />
                    <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                      <Camera size={12} color={onPrimary} />
                    </View>
                  </Pressable>
                  <Text style={{ fontFamily: serif, fontSize: 29, letterSpacing: -0.4, color: colors.text, marginTop: 14 }}>{client.name}</Text>
                  <View style={styles.identityMeta}>
                    {client.tags.includes('vip') && (
                      <View style={[styles.vipPill, { backgroundColor: colors.goldSoft }]}>
                        <Star size={12} color={colors.gold} fill={colors.gold} />
                        <Text style={[typo.label, { color: colors.gold }]}>{tr('clientDetail.vipFull')}</Text>
                      </View>
                    )}
                    {client.tags.filter((t) => t !== 'vip').map((tag) => {
                      const tagColor = tagColors[tag];
                      return tagColor ? <Badge key={tag} label={tr(tagLabelKeys[tag])} color={tagColor} /> : null;
                    })}
                    {lastVisit && (
                      <Pressable onPress={copyPhone} hitSlop={8}>
                        <Text style={[typo.caption, { color: colors.textSecondary }]}>
                          {tr('clientDetail.lastVisit', { ago: daysSince(lastVisit.date) })}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* 3 actions */}
                  <View style={styles.actionsRow}>
                    {actions.map((a) => {
                      const fg = a.filled ? onPrimary : colors.primary;
                      return (
                        <Pressable key={a.key} onPress={a.onPress}
                          style={[styles.actionCard, {
                            backgroundColor: a.filled ? colors.primary : colors.surface,
                            borderColor: a.filled ? 'transparent' : colors.border,
                            borderWidth: a.filled ? 0 : StyleSheet.hairlineWidth,
                          }]}>
                          <a.Icon size={19} color={fg} strokeWidth={1.6} />
                          <Text style={[typo.caption, { color: a.filled ? onPrimary : colors.text }]}>{a.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              )}
            </View>

            {!editing && (
              <>
                {/* STATS — value on top (serif 26), label below */}
                <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
                  {stats.map(([v, lb], i) => (
                    <React.Fragment key={lb}>
                      {i > 0 && <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 2 }} />}
                      <View style={styles.statCol}>
                        <Text style={{ fontFamily: serif, fontSize: 26, letterSpacing: -0.3, color: colors.text }} numberOfLines={1} adjustsFontSizeToFit>{v}</Text>
                        <Text style={[typo.label, { color: colors.textTertiary, marginTop: 4 }]}>{lb}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>

                {(client.debt ?? 0) > 0 && (
                  <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
                    <View style={[styles.debtPill, { backgroundColor: colors.dangerSoft }]}>
                      <Text style={[typo.caption, { color: colors.danger }]}>{tr('clientDetail.statDebt')}</Text>
                      <Text style={[typo.numberMd, { color: colors.danger }]}>−{formatCurrency(client.debt!)}</Text>
                    </View>
                  </View>
                )}

                {/* HISTORY header */}
                <View style={styles.historyHeader}>
                  <Text style={{ fontFamily: serif, fontSize: 20, color: colors.text }}>{tr('clientDetail.historyPlain')}</Text>
                  <Text style={[typo.label, { color: colors.primary }]}>{tr('clientDetail.historyAll', { count: appointments.length })}</Text>
                </View>
              </>
            )}
          </>
        }
        renderItem={({ item, index }) => {
          const service = getService(item.serviceId);
          const grad = HISTORY_GRADS[index % HISTORY_GRADS.length];
          return (
            <Pressable style={styles.historyRow} onPress={() => router.push(`/appointment/${item.id}`)}>
              <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.historyTile, { borderColor: colors.border }]} />
              <View style={{ flex: 1 }}>
                <Text style={[typo.bodyBold, { color: colors.text }]} numberOfLines={1}>{service?.name ?? tr('clientDetail.serviceFallback')}</Text>
                <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {formatDate(item.date)} · {formatTimeRange(item.startTime, item.endTime)}
                </Text>
              </View>
              <Text style={{ fontFamily: serif, fontSize: 18, color: colors.text }}>{formatCurrency(item.price)}</Text>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <Divider style={{ marginLeft: 24, marginRight: 24, marginVertical: 0 }} />}
        ListFooterComponent={
          editing ? null : (
            <View style={{ marginTop: 8 }}>
              {/* Реальные фичи, которых нет в статичном макете — ниже истории */}
              {client.address ? (
                <Pressable
                  onPress={async () => { const ok = await openAddressInMaps(client.address!); if (!ok) showError(tr('common.error'), tr('clientDetail.mapsError')); }}
                  accessibilityRole="button"
                  accessibilityLabel={tr('clientDetail.addressRouteLabel', { address: client.address })}
                  style={{ paddingHorizontal: 24, marginTop: 12 }}
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

              {client.notes ? (
                <View style={{ paddingHorizontal: 24, marginTop: 12 }}>
                  <GlassCard>
                    <Text style={[typo.label, { color: colors.textTertiary }]}>{tr('clientDetail.notesLabel')}</Text>
                    <Text style={[typo.body, { color: colors.text, marginTop: 6 }]}>{client.notes}</Text>
                  </GlassCard>
                </View>
              ) : null}

              <Pressable onPress={() => { setPrefsExpanded(!prefsExpanded); setPrefsText(client.preferences ?? ''); }} style={{ paddingHorizontal: 24, marginTop: 12 }}>
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
                          <TextInput value={prefsText} onChangeText={setPrefsText}
                            placeholder={tr('clientDetail.preferencesPlaceholder')} placeholderTextColor={colors.textTertiary}
                            style={[typo.body, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: br.sm, padding: 12, minHeight: 70, textAlignVertical: 'top' }]}
                            multiline autoFocus />
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
            </View>
          )
        }
      />

      {/* Bottom CTA — «Записать снова» */}
      {!editing && (
        <View style={[styles.ctaBar, { backgroundColor: colors.surfaceGlass, borderTopColor: colors.border }]}>
          <Pressable onPress={book} accessibilityRole="button" style={[styles.ctaBtn, { backgroundColor: colors.primary }]}>
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
  header: { paddingTop: 8, paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identityMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  vipPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 22, alignSelf: 'stretch' },
  actionCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: 14 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  statCol: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  debtPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
  editInput: { paddingHorizontal: 16, paddingVertical: 12, textAlign: 'center' },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  tile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 24, marginTop: 18, marginBottom: 6 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 24 },
  historyTile: { width: 46, height: 46, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  cameraBadge: { position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  ctaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 30, borderTopWidth: StyleSheet.hairlineWidth },
  ctaBtn: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
});
